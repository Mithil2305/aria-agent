# Yukti Secrets Worker — Cloudflare Worker

A lightweight Cloudflare Worker that stores and serves API keys / Firebase
config as secrets. No keys are hardcoded in source control.

## Architecture

```
┌─────────────┐   Bearer token    ┌─────────────────────┐
│   Backend    │ ───────────────►  │  Cloudflare Worker   │
│  (FastAPI)   │ /keys/backend     │  yukti-secrets       │
└─────────────┘                    │                      │
                                   │  Secrets:            │
┌─────────────┐   CORS only       │  • GEMINI_API_KEY    │
│  Frontend    │ ───────────────►  │  • GROQ_API_KEY      │
│  (React)     │ /keys/firebase    │  • ANTHROPIC_API_KEY  │
└─────────────┘                    │  • FIREBASE_*         │
                                   │  • AUTH_TOKEN         │
                                   └─────────────────────┘
```

## Setup

### 1. Install wrangler

```bash
cd worker
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

### 3. Deploy the worker

```bash
npx wrangler deploy
```

This will print a URL like:
`https://yukti-secrets.<your-subdomain>.workers.dev`

### 4. Set all secrets

```bash
# Auth token (generate a strong random string)
npx wrangler secret put AUTH_TOKEN

# AI API keys
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY

# Firebase config
npx wrangler secret put FIREBASE_API_KEY
npx wrangler secret put FIREBASE_AUTH_DOMAIN
npx wrangler secret put FIREBASE_PROJECT_ID
npx wrangler secret put FIREBASE_STORAGE_BUCKET
npx wrangler secret put FIREBASE_MESSAGING_SENDER_ID
npx wrangler secret put FIREBASE_APP_ID
```

Each command will prompt you to paste the secret value.

### 5. Configure the backend

In `backend/.env`, uncomment and set:

```env
SECRETS_WORKER_URL=https://yukti-secrets.<your-subdomain>.workers.dev
SECRETS_AUTH_TOKEN=<the AUTH_TOKEN you set in step 4>
```

On startup, the backend will fetch API keys from the worker and set them
as environment variables (local `.env` values still take priority via
`os.environ.setdefault`).

### 6. Configure the frontend (optional)

In Vercel (or a local `.env`), set:

```env
VITE_SECRETS_WORKER_URL=https://yukti-secrets.<your-subdomain>.workers.dev
```

The frontend will fetch Firebase config from the worker at runtime.
If the worker is unreachable, the hardcoded fallback config is used.

## Endpoints

| Path                 | Auth Required | Description                      |
| -------------------- | ------------- | -------------------------------- |
| `GET /health`        | No            | Health check                     |
| `GET /keys/firebase` | No (CORS)     | Firebase client config           |
| `GET /keys/backend`  | Yes (Bearer)  | AI API keys (Gemini/Groq/Claude) |

## Security Notes

- **Backend keys** (`/keys/backend`) require a `Bearer` token in the
  `Authorization` header. Only your backend server knows this token.
- **Firebase config** (`/keys/firebase`) is CORS-restricted to allowed
  origins but does not require auth (Firebase config is inherently public
  — it ships in every client-side bundle).
- Secrets are stored in Cloudflare's encrypted secret store and are
  **never** returned in logs, error messages, or wrangler output.
- The `ALLOWED_ORIGINS` variable in `wrangler.toml` controls which
  domains can make CORS requests.

## Local development

```bash
cd worker
npx wrangler dev
```

This starts the worker locally at `http://localhost:8787`. You can test
with:

```bash
curl http://localhost:8787/health
curl -H "Authorization: Bearer <token>" http://localhost:8787/keys/backend
```

For local dev, create a `.dev.vars` file in `worker/`:

```env
AUTH_TOKEN=dev-token-123
GEMINI_API_KEY=your-key-here
GROQ_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
FIREBASE_API_KEY=your-key-here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123:web:abc
```
