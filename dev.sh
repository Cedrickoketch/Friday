#!/bin/bash
# Friday — dev startup script
# Run from the project root: bash dev.sh

echo "🤖 Starting Friday dev environment..."

# ── Backend ──────────────────────────────────────────────────────────────────
echo ""
echo "▶ Setting up backend..."
cd backend
source venv/bin/activate && pip install -r requirements.txt && ollama pull gemma:2b

if [ ! -d "venv" ]; then
  echo "  Creating Python virtualenv..."
  python3 -m venv venv
fi

echo "▶ Activating virtual environment..."
source venv/bin/activate
pip install -q -r requirements.txt

# Copy .env if missing
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  ⚠️  Created backend/.env from example — fill in your API keys!"
fi

# Fallback migration check that won't panic the shell
python manage.py migrate --run-syncdb 2>/dev/null || python manage.py migrate

# Start Django in the background
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
echo "  ✅ Django running on http://localhost:8000 (PID $BACKEND_PID)"

sleep 2

cd ..

# ── Frontend ─────────────────────────────────────────────────────────────────
echo ""
echo "▶ Setting up frontend..."
cd frontend
npm install

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "  ⚠️  Created frontend/.env from example — add your VITE_GOOGLE_CLIENT_ID!"
fi

npm install --silent
echo "  ✅ Starting Vite dev server on http://localhost:5173..."
npm run dev &
FRONTEND_PID=$!

sleep 2

cd ..

# ── Ollama ────────────────────────────────────────────────────────────────────
echo ""
OLLAMA_PID=""
if command -v ollama &> /dev/null; then
  echo "▶ Starting Ollama..."
  # Start Ollama and capture its PID correctly
  ollama serve &>/dev/null &
  OLLAMA_PID=$!
  echo "  ✅ Ollama running. Make sure gemma:2b is pulled: ollama pull gemma:2b"
else
  echo "⚠️  Ollama not found. Install from https://ollama.com or set AI_PROVIDER=gemini in backend/.env"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Friday is running!"
echo "  Frontend → http://localhost:5173"
echo "  Backend  → http://localhost:8000"
echo "  Admin    → http://localhost:8000/admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services."

# Keep alive and kill ALL three processes on exit cleanly
trap "kill $BACKEND_PID $FRONTEND_PID $OLLAMA_PID 2>/dev/null; echo -e '\n👋 Stopped all Friday services cleanly.'" EXIT
wait
