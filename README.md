# LabLens — Intelligent AR Laboratory Guide & DeepSeek Harness AI

**An AR guide & instrument-aware AI assistant for every laboratory instrument** — built for Tech Elevate 2026 by Team Humpty Dumpty (Mech-ARE).

LabLens combines live camera capture, on-device object recognition, a local equipment database, an AR-style guide overlay, and an **intelligent conversational lab assistant powered by the official DeepSeek Harness SDK and runtime**. It puts hazards and required PPE before operating steps, and provides students with immediate, verified guidance at their laboratory bench.

- **Live Website**: [https://deepak-phsyco.github.io/Humpty-Dumpty/](https://deepak-phsyco.github.io/Humpty-Dumpty/)
- **GitHub Repository**: [https://github.com/Deepak-Phsyco/Humpty-Dumpty](https://github.com/Deepak-Phsyco/Humpty-Dumpty)
- **DeepSeek Harness Reference**: [https://github.com/deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)

> **Safety note:** LabLens is an educational learning aid, not a substitute for your institution's risk assessment, equipment manual, instructor, or approved procedure. Do not rely on automated recognition to identify hazardous equipment.

---

## 🏛 System Architecture

LabLens employs a decoupled, secure full-stack architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite PWA)               │
│  - Hosted on GitHub Pages (Static SPA)                      │
│  - On-Device TensorFlow.js Object Detection                 │
│  - AR Overlay, Steps, Specs, Safety Gate                    │
│  - DeepSeek Harness AI Chatbot Interface (Modal & Embedded) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON-RPC Proxy
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Secure Backend (Node.js + Express + TS)         │
│  - Rate Limiting (express-rate-limit) & Helmet Security     │
│  - Input Validation & Sanitization                          │
│  - Server-Side Authoritative Equipment Registry             │
│  - POST /api/chat & GET /api/health                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Stdio JSON-RPC Subprocess
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          DeepSeek Harness Runtime (@deepseek-ai/dsh)        │
│  - Profile: sdk (Cordis Architecture)                       │
│  - Restricted Plugins: tool-fs, tool-jobs, tool-workflow off│
│  - Provider: deepseek-official (model: deepseek-chat)       │
│  - Credentials securely encapsulated on server              │
└─────────────────────────────────────────────────────────────┘
```

1. **Frontend (GitHub Pages)**:
   - Built with React 18, TypeScript 5, Vite 6, and Tailwind CSS.
   - Operates offline-first using IndexedDB (Dexie) and PWA Service Workers.
   - Never exposes API keys, tokens, or runtime secrets.
   - Configures the backend base URL dynamically via `VITE_API_BASE_URL` (defaults to `http://localhost:3001` in local development).

2. **Backend (Node.js + TypeScript + Express)**:
   - Houses the DeepSeek Harness runtime integration on the server (never in the client browser).
   - Validates student requests, enforces timeouts, rate limits requests, and manages conversation sessions.
   - Pulls instrument specifications, PPE requirements, safety hazards, and operating steps from a server-verified registry to ground model responses.

3. **DeepSeek Harness Runtime (`@deepseek-ai/dsh-sdk-client` & `@deepseek-ai/dsh`)**:
   - Executes the `dsh --profile sdk` subprocess.
   - Uses `server/cordis.patch.yml` to disable unnecessary shell, filesystem, job execution, and privileged tools for strict laboratory safety.
   - Interacts with DeepSeek's official conversational reasoning model (`deepseek-chat` or `deepseek-v4-flash`).

---

## 📁 Repository Structure

```
Humpty-Dumpty/
├── server/                           # Secure Node.js + TypeScript Backend
│   ├── cordis.patch.yml              # Cordis profile patch: disables dangerous tools
│   ├── package.json                  # Standalone backend dependencies
│   ├── tsconfig.json                 # Backend TypeScript configuration
│   └── src/
│       ├── index.ts                  # Express server, CORS, Helmet, Graceful Shutdown
│       ├── config.ts                 # Environment validation and configuration
│       ├── data/
│       │   └── trustedEquipment.ts   # Authoritative server-side equipment database & prompt builder
│       ├── harness/
│       │   └── harnessService.ts     # DeepSeekHarness subprocess manager & session continuity
│       ├── middleware/
│       │   ├── errorHandler.ts       # Sanitized error handler (masks stack traces and keys)
│       │   ├── rateLimiter.ts        # Rate limiter to prevent API abuse
│       │   └── validator.ts          # Request schema and length validation
│       └── routes/
│           ├── chat.ts               # POST /api/chat endpoint
│           └── health.ts             # GET /api/health diagnostic endpoint
├── src/                              # Frontend React Application
│   ├── components/
│   │   ├── LabLensChatbot.tsx        # DeepSeek Harness AI Chatbot Modal & Embedded Component
│   │   ├── AROverlay.tsx             # Live AR Guide HUD with "Ask AI" Action
│   │   ├── TopNav.tsx                # Navigation Header with "AI Guide" Button
│   │   ├── SafetyCard.tsx            # Mandatory Safety Gatekeeper
│   │   ├── StepsGuide.tsx            # Step-by-Step Interactive Operating Instructions
│   │   └── SpecsView.tsx             # Technical Specifications & Pinouts
│   ├── pages/
│   │   ├── EquipmentDetailScreen.tsx # 5-Tab Detail View (Safety, Steps, Specs, More, AI Guide)
│   │   ├── HomeScreen.tsx            # Landing Screen with AI Guide Quick-Launcher
│   │   ├── ScanScreen.tsx            # Camera Viewfinder & Object Recognition
│   │   └── LibraryScreen.tsx         # Filterable Instrument Catalog
│   ├── lib/
│   │   ├── chatApi.ts                # Client API for POST /api/chat and GET /api/health
│   │   ├── speech.ts                 # Bilingual Speech Synthesis (TTS)
│   │   └── db.ts                     # Offline Dexie IndexedDB Store
│   └── data/
│       └── equipment.json            # 15 Verified Laboratory Instruments
├── .env.example                      # Template for backend environment variables
├── .gitignore                        # Strict exclusion of .env and credentials
├── package.json                      # Root workspace scripts and dependencies
└── vite.config.ts                    # Vite build configuration with /api development proxy
```

---

## ⚙️ Prerequisites & Installation

### Prerequisites
- **Node.js**: v20.19+, v22.12+, or v24+
- **npm**: v10+
- **Operating System**: Windows, macOS, or Linux

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/Deepak-Phsyco/Humpty-Dumpty.git
cd Humpty-Dumpty

# Install all frontend and backend dependencies
npm install
```

### 2. Configure Environment Variables

Copy the example environment template:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,https://deepak-phsyco.github.io

# AI Provider: "gemini" (recommended) or "deepseek"
AI_PROVIDER=gemini

# Google Gemini Official API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite

# DeepSeek Official API Key (alternative / fallback)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat

# Security & Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
REQUEST_TIMEOUT_MS=60000
```

> **Security Warning**: Never commit `.env` or hardcode API keys in frontend code. `.gitignore` is configured to prevent accidental credential commits.

---

## 🚀 Local Development Commands

You can run both the frontend and backend concurrently or independently:

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite frontend dev server at `http://localhost:3000/Humpty-Dumpty/` (with proxy to backend) |
| `npm run server` | Starts the Node.js DeepSeek Harness backend on `http://localhost:3001` |
| `npm run server:dev` | Starts the backend in watch mode (auto-restarts on code change) |
| `npm run build` | Type-checks and builds the production frontend to `dist/` |
| `npm run server:build` | Compiles the backend TypeScript into `server/dist/` |
| `npm run preview` | Previews the production frontend bundle locally |

### Quick Start: Running Frontend and Backend Together
Open two terminal tabs:

**Terminal 1 (Backend Server):**
```bash
npm run server
```

**Terminal 2 (Frontend App):**
```bash
npm run dev
```

Open `http://localhost:3000/Humpty-Dumpty/` in your browser.

---

## 🧪 Testing & Verification Instructions

### 1. Verify Backend Health Check
Run in your terminal or browser:

```bash
curl http://localhost:3001/api/health
```

Expected response (`200 OK`):
```json
{
  "status": "ok",
  "service": "LabLens DeepSeek Harness AI Backend",
  "version": "1.0.0",
  "harness": {
    "provider": "deepseek-official",
    "model": "deepseek-chat",
    "isConfigured": true,
    "runtime": "@deepseek-ai/dsh-sdk-client (v0.2.1-rc.3)",
    "safetyProfile": "sdk (with tool-fs, tool-jobs, tool-workflow restricted)"
  },
  "trustedInstruments": {
    "total": 15
  }
}
```

### 2. Test Chatbot Endpoint
Test sending an instrument-grounded question to the API:

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I safely measure DC voltage?", "equipmentId": "digital-multimeter"}'
```

Expected response (`200 OK`):
```json
{
  "reply": "To measure DC voltage safely using the Digital Multimeter...",
  "sessionId": "session-...",
  "equipmentId": "digital-multimeter",
  "timestamp": "2026-10-24T...",
  "model": "deepseek-chat"
}
```

### 3. Verify Frontend Builds
```bash
npm run build
npm run server:build
```
Both commands must finish with `exit code 0`.

---

## 🛡 Harness Permissions & Safety Policy

To safeguard students and server infrastructure, LabLens implements strict least-privilege policies:

1. **Disabled Dangerous Subsystems**:
   In `server/cordis.patch.yml`, the runtime explicitly disables:
   - `@deepseek-ai/dsh-tool-fs`: File system write/read access.
   - `@deepseek-ai/dsh-tool-jobs`: Background subprocess job runner.
   - `@deepseek-ai/dsh-workflow-ptc`: Arbitrary workflow execution.
   - `@deepseek-ai/dsh-tool-subagent`: Subagent spawning and process forking.

2. **Server-Side Grounding**:
   - The browser never supplies arbitrary prompt rules.
   - The server validates `equipmentId` against `trustedEquipment.ts`.
   - Verified hazard levels, required PPE, step-by-step procedures, and known student errors are injected directly into the model context before execution.

3. **Rate Limiting & Timeouts**:
   - Express rate limiting restricts requests per IP (default: 30 requests / minute).
   - A strict 60-second gateway timeout prevents hanging child processes.

4. **Error Sanitization**:
   - Internal stack traces, server file paths, and potential API key echoes are masked before reaching the student.

---

## 🌐 Deployment Architecture

### 1. Frontend: GitHub Pages
The frontend is a static Progressive Web App (SPA) designed to be hosted on GitHub Pages:
- Build command: `npm run build`
- Output directory: `dist/`
- Set `VITE_API_BASE_URL` in your GitHub repository secrets or build workflow to point to your live backend (e.g., `https://lablens-backend.onrender.com`).

> **Note**: GitHub Pages only serves static files (HTML, CSS, JS). It cannot execute Node.js code or DeepSeek Harness child processes. The backend must be hosted separately.

### 2. Backend: Node.js Cloud Service (Render, Railway, Fly.io, etc.)
Deploy the `server/` directory to a cloud provider supporting Node.js subprocess execution:

**Example Deployment on Render:**
1. Create a **New Web Service** connected to your repository.
2. Set **Root Directory**: `server` (or run from root with build command).
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Configure Environment Variables:
   - `PORT`: `10000`
   - `NODE_ENV`: `production`
   - `DEEPSEEK_API_KEY`: `sk-your-real-deepseek-api-key`
   - `DEEPSEEK_MODEL`: `deepseek-chat`
   - `CORS_ORIGIN`: `https://deepak-phsyco.github.io`
6. Once deployed, copy the assigned backend URL (e.g. `https://lablens-api.onrender.com`) and configure it as `VITE_API_BASE_URL` in your frontend build.

---

## ❓ Troubleshooting & Common Errors

| Issue | Cause | Solution |
|---|---|---|
| `⚠️ Notice: DEEPSEEK_API_KEY is not configured` | The `.env` file is missing or has placeholder text. | Add your valid API key in `.env` (`DEEPSEEK_API_KEY=sk-...`) and restart the server (`npm run server`). |
| `CORS Error in Browser` | Frontend origin is blocked by backend CORS policy. | Add your frontend URL (e.g. `https://deepak-phsyco.github.io`) to `CORS_ORIGIN` in `.env`. |
| `Request timed out (GATEWAY_TIMEOUT)` | Model query took longer than `REQUEST_TIMEOUT_MS`. | Ask a more specific question, or increase `REQUEST_TIMEOUT_MS` in `.env`. |
| `Too many requests (RATE_LIMIT_EXCEEDED)` | More than 30 requests were sent within 1 minute. | Wait 60 seconds or increase `RATE_LIMIT_MAX` in `.env`. |
| `Camera unavailable in browser` | Browser requires HTTPS for camera access. | Use `localhost` for development or access through HTTPS in production. |

---

## 👥 Credits

**Team Humpty Dumpty (Mech-ARE)** — Tech Elevate 2026 Hackathon  
Built with Vite, React, TensorFlow.js, and the official **DeepSeek Harness** SDK.
