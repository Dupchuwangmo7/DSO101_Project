import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Get,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LocalHFService } from './local-hf.service';
import { ElevenLabsService } from './elevenlabs.service';

type AskDto = { prompt: string; system?: string };

@Controller('ai')
export class AiController {
  constructor(
    private readonly local: LocalHFService,
    private readonly eleven: ElevenLabsService,
  ) {}

  private getGenAI(): GoogleGenerativeAI {
    const apiKey = process.env.GOOGLE_AI_API_KEY || '';
    if (!apiKey) {
      throw new HttpException(
        'Missing GOOGLE_AI_API_KEY environment variable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return new GoogleGenerativeAI(apiKey);
  }

  @Get('health')
  health(): { ok: boolean; base: string; reason?: string } {
    const apiKey = process.env.GOOGLE_AI_API_KEY || '';
    if (!apiKey) {
      return { ok: false, base: 'google-ai', reason: 'Missing API key' };
    }
    return { ok: true, base: 'google-ai' };
  }

  @Get('models')
  models(): { models: string[] } {
    return { models: ['gemini-1.5-flash'] };
  }

  @Get('tts-config')
  ttsConfig(): {
    hasApiKey: boolean;
    apiKeyPreview: string | null;
    voiceIdEnv: string | null;
    modelIdEnv: string | null;
  } {
    const apiKey = process.env.ELEVENLABS_API_KEY || '';
    return {
      hasApiKey: !!apiKey,
      apiKeyPreview: apiKey
        ? `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}`
        : null,
      voiceIdEnv: process.env.ELEVENLABS_VOICE_ID || null,
      modelIdEnv: process.env.ELEVENLABS_MODEL_ID || null,
    };
  }

  @Post('tts-config')
  ttsConfigPost() {
    return this.ttsConfig();
  }

  @Post('tts')
  async tts(
    @Body()
    body: {
      text?: string;
      voiceId?: string;
      format?: 'mp3' | 'opus' | 'pcm_16000';
      message?: string;
      content?: string;
    },
  ): Promise<{
    audio: string;
    voiceId: string;
    cached: boolean;
    contentType: string;
  }> {
    const rawCandidate = [body?.text, body?.message, body?.content].find(
      (v) => typeof v === 'string' && v.trim().length > 0,
    );
    const text = (rawCandidate || '').trim();
    if (!text) {
      const presentKeys = Object.keys(body || {}).join(',') || 'none';
      throw new HttpException(
        `Missing text (expected 'text' field). Present keys: ${presentKeys}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      console.log(
        `[tts] incoming len=${text.length} voiceId=${body?.voiceId || 'auto'} keys=${Object.keys(body || {}).join(',')}`,
      );
    } catch {
      /* ignore logging errors */
    }
    try {
      const { audioBase64, contentType, voiceId, cached } =
        await this.eleven.synthesize(text, {
          voiceId: body?.voiceId,
          format: body?.format,
        });
      return {
        audio: `data:${contentType};base64,${audioBase64}`,
        voiceId,
        cached,
        contentType,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('[tts] failure', msg, 'voiceId=', body?.voiceId);
      throw e;
    }
  }

  @Post('tts-stream')
  async ttsStream(
    @Body()
    body: {
      text?: string;
      voiceId?: string;
      message?: string;
      content?: string;
      format?: 'mp3' | 'opus';
      optimizeStreamingLatency?: number | null;
    },
    @Res() res: Response,
  ) {
    const rawCandidate = [body?.text, body?.message, body?.content].find(
      (v) => typeof v === 'string' && v.trim().length > 0,
    );
    const text = (rawCandidate || '').trim();
    if (!text) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing text' });
      return;
    }
    const voiceId = (
      body?.voiceId ||
      process.env.ELEVENLABS_VOICE_ID ||
      'g6xIsTj2HwM6VR4iXFCw'
    ).trim();
    const format = body?.format || 'mp3';
    const apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!apiKey) {
      res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({ error: 'Missing ELEVENLABS_API_KEY env variable' });
      return;
    }
    const latencyOpt =
      body?.optimizeStreamingLatency ??
      (process.env.ELEVENLABS_OPTIMIZE_LATENCY
        ? Number(process.env.ELEVENLABS_OPTIMIZE_LATENCY)
        : null);
    const qs = new URLSearchParams();
    if (latencyOpt !== null && Number.isFinite(latencyOpt)) {
      qs.set('optimize_streaming_latency', String(latencyOpt));
    }
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      voiceId,
    )}/stream${qs.toString() ? `?${qs.toString()}` : ''}`;
    const payload: Record<string, unknown> = {
      text,
      model_id: process.env.ELEVENLABS_MODEL_ID || undefined,
      voice_settings: {
        stability: Number(process.env.ELEVENLABS_STABILITY || '0.3') || 0.3,
        similarity_boost:
          Number(process.env.ELEVENLABS_SIMILARITY || '0.8') || 0.8,
        style: Number(process.env.ELEVENLABS_STYLE || '0.35') || 0.35,
        use_speaker_boost: process.env.ELEVENLABS_SPEAKER_BOOST !== 'false',
      },
      output_format:
        format === 'opus'
          ? 'opus_24000'
          : process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_192',
    };
    res.setHeader(
      'Content-Type',
      format === 'opus' ? 'audio/ogg' : 'audio/mpeg',
    );
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Transfer-Encoding', 'chunked');
    const controller = new AbortController();
    const abortHandler = () => controller.abort();
    res.on('close', abortHandler);
    try {
      const upstream = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey.trim(),
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!upstream.ok || !upstream.body) {
        const detail = await upstream.text().catch(() => '');
        res
          .status(HttpStatus.BAD_GATEWAY)
          .json({ error: `ElevenLabs error ${upstream.status}: ${detail}` });
        return;
      }
      console.log(
        `[tts-stream] elevenlabs voice=${voiceId} len=${text.length} latencyOpt=${latencyOpt}`,
      );
      type RSReader = { read(): Promise<{ value?: Uint8Array; done: boolean }> };
      type WebReadable = { getReader(): RSReader };
      const reader = (upstream.body as unknown as WebReadable).getReader?.();
      if (reader) {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value && value.length) {
            res.write(Buffer.from(value));
          }
        }
      } else {
        const buf = Buffer.from(await upstream.arrayBuffer());
        res.write(buf);
      }
    } catch (e: unknown) {
      if (!res.headersSent) {
        res
          .status(HttpStatus.BAD_GATEWAY)
          .json({ error: `Streaming error: ${String(e)}` });
      }
    } finally {
      try {
        res.end();
      } catch {
        /* noop */
      }
      res.off('close', abortHandler);
    }
  }

  @Get('local-status')
  localStatus() {
    return this.local.getStatus();
  }

  @Post('local')
  async localTranscribe(
    @Body()
    body: {
      audio?: string;
      prompt?: string;
      return_timestamps?: boolean;
    },
  ): Promise<{ text?: string }> {
    const audio = (body?.audio || body?.prompt || '').trim();
    if (!audio) {
      throw new HttpException('Missing audio', HttpStatus.BAD_REQUEST);
    }
    try {
      const out = (await this.local.generate(audio, {
        return_timestamps: body?.return_timestamps,
      })) as { text?: string };
      return { text: out?.text };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'transcription error';
      const status = /not ready|unavailable|loading/i.test(msg)
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.BAD_GATEWAY;
      throw new HttpException(`Local HF error: ${msg}`, status);
    }
  }

  @Post('ask')
  async ask(
    @Body() body: AskDto & { model?: string },
  ): Promise<{ reply: string }> {
    const prompt = typeof body?.prompt === 'string' ? body.prompt : '';
    if (!prompt.trim()) {
      throw new HttpException('Missing prompt', HttpStatus.BAD_REQUEST);
    }
    try {
      const genAI = this.getGenAI();
      const system =
        (typeof body?.system === 'string' && body.system.trim()) || '';
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        ...(system ? { systemInstruction: system } : {}),
      });
      const result = await model.generateContent(prompt);
      const reply = this.sanitizeModelText(result.response.text());
      return { reply };
    } catch (e: unknown) {
      if (e instanceof HttpException) throw e;
      const msg = e instanceof Error ? e.message : 'Google AI error';
      throw new HttpException(`Google AI error: ${msg}`, HttpStatus.BAD_GATEWAY);
    }
  }

  @Post('stream')
  async stream(
    @Body() body: AskDto & { model?: string },
    @Res() res: Response,
  ) {
    const prompt = typeof body?.prompt === 'string' ? body.prompt : '';
    if (!prompt.trim()) {
      throw new HttpException('Missing prompt', HttpStatus.BAD_REQUEST);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendDelta = (d: string) => {
      if (d) res.write(`data: ${JSON.stringify({ delta: d })}\n\n`);
    };

    try {
      const genAI = this.getGenAI();
      const system =
        (typeof body?.system === 'string' && body.system.trim()) || '';
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        ...(system ? { systemInstruction: system } : {}),
      });
      const result = await model.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) sendDelta(text);
      }
      res.write('data: {"done":true}\n\n');
      res.end();
    } catch (e: unknown) {
      if (e instanceof HttpException) {
        res.write(
          `data: ${JSON.stringify({ error: e.message })}\n\n`,
        );
      } else {
        const msg = e instanceof Error ? e.message : 'Google AI error';
        res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      }
      res.end();
    }
  }

  private sanitizeModelText(text: string): string {
    if (!text) return '';
    let out = text;
    out = out.replace(/<\s*think[^>]*>[\s\S]*?<\s*\/\s*think\s*>/gi, '');
    out = out.replace(/```(?:[a-zA-Z]+)?\s*think[\s\S]*?```/gi, '');
    out = out.replace(
      /^(\s*(?:thinking|thought|reasoning)\s*:.*(?:\r?\n|$))+?/gim,
      '',
    );
    const ansIdx = out.toLowerCase().indexOf('answer:');
    if (ansIdx !== -1) {
      out = out.slice(ansIdx + 'answer:'.length);
    }
    out = out.replace(/\n{3,}/g, '\n\n').trim();
    return out;
  }
}
