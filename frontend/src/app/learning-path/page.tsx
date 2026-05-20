'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

const pathSteps = [
  {
    color: 'bg-pink-100 border-pink-300',
    icon: '🧮',
    title: 'Fun with Numbers!',
    desc: 'Add, subtract, multiply, and divide with games and stories.',
    bullets: ['Counting games', 'Easy sums', 'Math stories'],
  },
  {
    color: 'bg-yellow-100 border-yellow-300',
    icon: '�',
    title: 'Shape Adventure!',
    desc: 'Find circles, squares, and triangles all around you.',
    bullets: ['Shape hunt', 'Draw & color shapes', 'Guess the shape!'],
  },
  {
    color: 'bg-blue-100 border-blue-300',
    icon: '🧩',
    title: 'Patterns & Puzzles!',
    desc: 'Spot patterns and solve simple puzzles.',
    bullets: ['What comes next?', 'Color patterns', 'Puzzle time'],
  },
  {
    color: 'bg-green-100 border-green-300',
    icon: '📊',
    title: 'Math in Life!',
    desc: 'See how math helps us every day.',
    bullets: ['Sorting & matching', 'Easy charts', 'Math at the store'],
  },
  {
    color: 'bg-purple-100 border-purple-300',
    icon: '🌟',
    title: 'Super Problem Solver!',
    desc: 'Use your math powers to solve fun word problems.',
    bullets: ['Story problems', 'Math riddles', 'Team up & solve!'],
  },
];

export default function MathLearningPath() {
  const clickAudioRef = useRef<HTMLAudioElement>(null);
  const playClick = () => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play();
    }
  };
  return (
    <>
      {/* Font link moved to _document.tsx for global usage */}
      <audio
        ref={clickAudioRef}
        src="/button-click.mp3"
        preload="auto"
        style={{ display: 'none' }}
      />
      <div
        className="font-quicksand min-h-screen flex flex-col transition-colors duration-500"
        style={{
          background: 'transparent',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Nebula/star field overlay */}
        <div
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background:
              'radial-gradient(ellipse at 60% 20%, rgba(59,7,100,0.58) 0%, rgba(24,26,42,0) 80%)',
          }}
        />
        <nav
          className="fixed top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-30 select-none"
          style={{ background: 'transparent' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl select-none">🦉</span>
            <span className="text-base font-semibold tracking-wide text-white">
              Math Quest
            </span>
          </div>
          <Link href="/">
            <Button
              size="sm"
              className="relative rounded-full px-5 py-2 text-sm font-semibold tracking-wide text-white overflow-hidden group focus-visible:outline-none"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600/70 via-cyan-500/70 to-fuchsia-500/70 backdrop-blur-md" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
              <span className="relative">Home</span>
            </Button>
          </Link>
        </nav>
        <main className="flex-1 flex flex-col items-center justify-center px-4 z-10 relative">
          <h1
            className="text-5xl md:text-6xl font-extrabold mt-12 mb-10 text-center"
            style={{
              fontFamily: 'Luckiest Guy, cursive',
              background:
                'linear-gradient(90deg, #f472b6 10%, #38bdf8 60%, #a3e635 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow:
                '0 4px 16px rgba(59,130,246,0.18), 0 2px 4px rgba(236,72,153,0.12)',
              letterSpacing: '0.04em',
            }}
          >
            Your Math Adventure
          </h1>
          <div className="w-full max-w-2xl mx-auto pb-10 flex flex-col items-center">
            <ol className="relative pl-6">
              {pathSteps.map((step, i) => (
                <li
                  key={step.title}
                  className="mb-20 last:mb-0 flex flex-row items-start gap-4 relative group"
                  tabIndex={0}
                  aria-label={step.title}
                >
                  <Link
                    href={`/math?path=${encodeURIComponent(step.title)}`}
                    className="flex flex-row items-start gap-4 w-full group"
                    onClick={playClick}
                    tabIndex={-1}
                    style={{ textDecoration: 'none' }}
                  >
                    {/* Wavy Connector */}
                    {i !== 0 && (
                      <span className="absolute left-7 -top-14 flex flex-col items-center z-0">
                        <svg
                          width="32"
                          height="64"
                          viewBox="0 0 32 64"
                          fill="none"
                        >
                          <path
                            d="M16 0 C16 24, 0 24, 16 48 C32 72, 16 40, 16 64"
                            stroke="#818cf8"
                            strokeWidth="4"
                            fill="none"
                          />
                        </svg>
                      </span>
                    )}
                    {/* Avatar with brighter border, larger and rounder for kids */}
                    <Avatar
                      className={`border-4 ${step.color.replace('100', '400').replace('300', '500')} shadow-xl w-24 h-24 flex items-center justify-center text-5xl bg-white/95 z-10`}
                    >
                      <AvatarFallback>{step.icon}</AvatarFallback>
                    </Avatar>
                    {/* Card with background blur and gradient overlay, larger and rounder for kids */}
                    <div className="relative w-full">
                      <div
                        className="absolute inset-0 rounded-[2.5rem] backdrop-blur-md bg-white/60 z-0"
                        style={{ filter: 'blur(3px)' }}
                      ></div>
                      <div
                        className={`absolute inset-0 rounded-[2.5rem] z-0 pointer-events-none`}
                        style={{
                          background:
                            'linear-gradient(120deg, rgba(236,72,153,0.10) 0%, rgba(59,130,246,0.10) 100%)',
                        }}
                      ></div>
                      <Card
                        className={`rounded-[2.5rem] w-full hover:scale-[1.07] hover:-rotate-1 transition-transform duration-300 relative z-10 border-0`}
                        style={{
                          background: 'rgba(20, 24, 56, 0.88)',
                          boxShadow:
                            '0 0 32px 8px #1a237e99, 0 0 64px 0 #00e5ff33',
                          border: 'none',
                          outline: '3px solid #536dfe',
                          outlineOffset: '-8px',
                          backdropFilter: 'blur(6px)',
                        }}
                      >
                        <CardContent className="py-10 px-10">
                          <div
                            className="font-extrabold text-2xl md:text-3xl text-white mb-3 drop-shadow-sm font-quicksand tracking-wide"
                            style={{
                              textShadow: '0 0 16px #fff, 0 0 32px #1a237e',
                            }}
                          >
                            {step.title}
                          </div>
                          <div
                            className="text-white/90 mb-3 text-lg md:text-xl font-medium font-quicksand"
                            style={{ textShadow: '0 0 8px #000' }}
                          >
                            {step.desc}
                          </div>
                          <ul className="list-disc ml-5 text-white/90 text-lg md:text-xl font-quicksand">
                            {step.bullets.map((bp) => (
                              <li key={bp}>{bp}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </main>
      </div>
    </>
  );
}
