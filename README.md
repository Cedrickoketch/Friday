# Friday — AI Personal Assistant

A full-stack AI personal assistant with task management, calendar, news, and voice capabilities.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Django 4.2 + Django REST Framework |
| Database | PostgreSQL |
| AI Model | Ollama (gemma:2b) locally / Google Gemini API in production |
| Auth | Google OAuth 2.0 + django-allauth |
| News | NewsAPI |
| Calendar | Google Calendar API |
| TTS | pyttsx3 (local) / Web Speech API (browser) |
| Payments | Paystack |

## Project Structure

```
friday/
├── frontend/          # React + Vite + Tailwind
└── backend/           # Django + DRF
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL
- Ollama with gemma:2b pulled (`ollama pull gemma:2b`)

### 1. Clone & configure environment

Copy the example env files and fill in your keys:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Ollama (local AI)

```bash
ollama serve
# in a separate terminal:
ollama pull gemma:2b
```

Visit `http://localhost:5173` — the backend runs on `http://localhost:8000`.

## Environment Variables

### Backend (`backend/.env`)

```
SECRET_KEY=your-django-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/friday_db

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google Calendar API
GOOGLE_CALENDAR_CREDENTIALS_JSON=

# NewsAPI
NEWS_API_KEY=

# AI — pick one
OLLAMA_BASE_URL=http://localhost:11434
GEMINI_API_KEY=                    # leave blank to use Ollama
AI_PROVIDER=ollama                 # "ollama" | "gemini"

# Paystack
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_PLAN_CODE_PRO=
PAYSTACK_PLAN_CODE_PREMIUM=
```

### Frontend (`frontend/.env`)

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=
VITE_PAYSTACK_PUBLIC_KEY=
```

## Tier System

| Feature | Free | Pro | Premium |
|---|---|---|---|
| AI Chat | 20 msg/day | Unlimited | Unlimited |
| Tasks | Up to 10 | Unlimited | Unlimited |
| News | Headlines only | Full articles | Full + personalized |
| Calendar | View only | Full CRUD | Full CRUD + reminders |
| Voice (wake word) | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

## Deploying

Recommended stack:
- **Frontend**: Vercel or Netlify
- **Backend**: Railway or Render (supports PostgreSQL add-on)
- **Switch AI provider**: Set `AI_PROVIDER=gemini` and add your `GEMINI_API_KEY` in production env
- **Payments**: Paystack natively supports Kenyan M-Pesa and card payments, so no extra swap is needed for Kenya payouts

## Notes on Kenyan Payments
Paystack supports M-Pesa and card payments in Kenya out of the box.
The Paystack integration lives in `backend/apps/subscriptions/`.
