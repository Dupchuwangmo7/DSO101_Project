#!/bin/bash
# ============================================================
# Render Setup Helper
# Run this locally to generate secrets before pasting into
# the Render dashboard environment variable section.
# ============================================================

echo ""
echo "=== AI Math Education — Render Environment Variables ==="
echo "Copy each value below into the Render dashboard"
echo ""

echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
echo ""
echo "COOKIE_SECRET=$(openssl rand -base64 32 | tr -d '\n')"
echo ""
echo "NODE_ENV=production"
echo "PORT=3001"
echo "TYPEORM_SYNC=true"
echo "BODY_LIMIT=25mb"
echo ""
echo "# --- Fill these in manually ---"
echo "DB_HOST=        (from Render PostgreSQL → Connections → Internal Host)"
echo "DB_PORT=5432"
echo "DB_USERNAME=    (from Render PostgreSQL → Connections)"
echo "DB_PASSWORD=    (from Render PostgreSQL → Connections)"
echo "DB_DATABASE=    (from Render PostgreSQL → Connections)"
echo ""
echo "FRONTEND_ORIGIN=https://YOUR-FRONTEND-NAME.onrender.com"
echo "ELEVENLABS_API_KEY=your_key_here"
echo "ELEVENLABS_VOICE_ID=your_voice_id_here"
echo "GOOGLE_AI_API_KEY=your_key_here"
