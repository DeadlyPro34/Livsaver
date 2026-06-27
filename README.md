<p align="center">
  <img src="https://img.shields.io/badge/Built_with-Google_AI_Studio-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google AI Studio" />
  <img src="https://img.shields.io/badge/Hackathon-VibeCoding_2026-E8521A?style=for-the-badge&logo=codingninjas&logoColor=white" alt="VibeCoding Hackathon" />
  <img src="https://img.shields.io/badge/Powered_by-Gemini_2.0_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</p>

<h1 align="center">🧬 LifeSaver AI</h1>

<p align="center">
  <strong>Your AI-Powered Productivity Coach — Built for Humans Who Want to Finish Things.</strong>
</p>

<p align="center">
  An intelligent, full-stack productivity platform that uses <strong>Google Gemini 2.0 Flash</strong> to prioritize tasks, generate optimized schedules, track habits, prevent burnout, and coach you through focus sessions — all in real-time.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-endpoints">API Endpoints</a> •
  <a href="#-project-structure">Project Structure</a>
</p>

---

## 🏆 Hackathon

This project was built for the **VibeCoding Hackathon** by **Coding Ninjas × Google**, where participants were challenged to build innovative projects using **Google AI Studio** and the **Gemini API**.

> **Theme:** Build with Google AI Studio  
> **Model Used:** `gemini-2.0-flash`  
> **Platform:** Google AI Studio (Applets)

---

## ✨ Features

### 🤖 AI-Powered Intelligence (Gemini 2.0 Flash)

| Feature | Description |
|---|---|
| **Smart Task Prioritization** | Automatically assigns priority (`critical` / `high` / `medium` / `low`), a risk score (0–100), and an actionable AI note when you add a task. |
| **Energy-Based Schedule Generator** | Generates a full daily schedule optimized around your personal energy curve (Morning / Afternoon / Evening). Places demanding tasks during peak energy hours. |
| **AI Chat Assistant** | A conversational productivity coach ("LifeSaver AI") that knows your task list and gives context-aware advice in 2–4 sentences. |
| **Habit Formation Insights** | Analyzes your weekly habit streaks and provides 3 personalized, science-backed insights (Atomic Habits style). |
| **Focus Session Tips** | Generates ultra-specific cognitive tricks tailored to your current task and mood before each Pomodoro session. |
| **Burnout Risk Prediction** | Calculates a burnout score (0–100) based on overdue tasks, missed habits, and focus session frequency. |
| **Procrastination Analysis** | When you repeatedly miss a deadline, AI diagnoses why (task too big? unclear first step?) and suggests a fix. |
| **Weekly AI Debrief** | End-of-week honest performance review with 3 actionable changes for the next week. |

### 🎯 Core Productivity Tools

- **📋 Task Management** — Create, edit, delete, and complete tasks with categories (Work, Study, Personal, Health, Finance), deadlines, estimated time, subtasks, and notes.
- **📅 Smart Scheduling** — AI-generated daily schedules with deep focus blocks, breaks, and admin time — color-coded and tippable.
- **🔥 Habit Tracker** — Track daily habits with a 7-day grid, streak counters, and weekly auto-reset.
- **⏱️ Pomodoro Focus Timer** — Configurable timer (Focus / Short Break / Long Break) linked to specific tasks, with session history tracking.

### 🎨 User Experience

- **🌙 Dark Mode** — Full dark theme with CSS custom property switching.
- **🌐 Multi-Language** — Supports English, Hindi (हिंदी), and Spanish (Español).
- **🔊 Voice Assistant** — Draggable floating mic button with Speech Recognition + Speech Synthesis for hands-free productivity coaching.
- **🔔 Smart Notifications** — Browser notifications at 24h, 1h, and 15min before deadlines + voice alerts for urgent/overdue tasks.
- **🎵 Sound Effects** — Click sounds, success chimes, and timer-end audio feedback.
- **✨ Smooth Animations** — Framer Motion page transitions, Lenis smooth scrolling, and floating background shapes.
- **🏅 Gamification** — Earn points for completing tasks and focus sessions. Free & Pro tier system.
- **👤 Google Sign-In** — Authenticate via Google or use anonymous sessions. Profile page with points and tier display.

### 🔒 Data & Security

- **Firebase Firestore** — Real-time cloud sync of tasks, habits, and focus sessions across devices.
- **Anonymous Auth Fallback** — Works without sign-in using Firebase Anonymous Authentication.
- **Row-Level Security** — Firestore rules ensure users can only read/write their own data.
- **Rate Limiting** — Express backend rate-limits API calls to 30 requests/minute.
- **Input Sanitization** — All user inputs are sanitized before being sent to the AI model.
- **Graceful Degradation** — If the AI API is unavailable (quota exceeded, offline), the app provides smart fallback responses.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **AI / LLM** | [Google Gemini 2.0 Flash](https://ai.google.dev/) via `@google/genai` SDK |
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion (`motion/react`) + Lenis Smooth Scroll |
| **Charts** | Recharts (Pie + Bar charts on dashboard) |
| **Icons** | Lucide React + Tabler Icons |
| **Backend** | Express.js (TypeScript) with `tsx` runtime |
| **Database** | Firebase Firestore (real-time sync) |
| **Authentication** | Firebase Auth (Google Sign-In + Anonymous) |
| **Rate Limiting** | `express-rate-limit` |
| **Voice** | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| **Build Tool** | Vite + esbuild |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Client (Browser)                     │
│                                                           │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌───────┐ ┌──────┐ │
│  │Dashboard│ │ Schedule │ │ Habits │ │ Focus │ │ Chat │ │
│  └────┬────┘ └────┬─────┘ └───┬────┘ └───┬───┘ └──┬───┘ │
│       │           │           │           │        │      │
│       └───────────┴───────────┴───────────┴────────┘      │
│                           │                               │
│              React 19 + Tailwind + Motion                 │
│                           │                               │
│              ┌────────────┴────────────┐                  │
│              │   Firebase SDK (Client)  │                  │
│              │  • Firestore (real-time) │                  │
│              │  • Auth (Google/Anon)    │                  │
│              └────────────┬────────────┘                  │
└───────────────────────────┼──────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │    Express.js Backend      │
              │                            │
              │  /api/prioritize           │
              │  /api/schedule             │
              │  /api/chat                 │
              │  /api/habit-insights       │
              │  /api/focus-tip            │
              │  /api/burnout-score        │
              │  /api/procrastination      │
              │  /api/weekly-debrief       │
              │                            │
              │  ┌──────────────────────┐  │
              │  │  Google Gemini API   │  │
              │  │  (gemini-2.0-flash)  │  │
              │  └──────────────────────┘  │
              └────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and **npm**
- **Google Gemini API Key** — Get one from [Google AI Studio](https://aistudio.google.com/apikey)
- **Firebase Project** (optional, for cloud sync) — [Firebase Console](https://console.firebase.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/DeadlyPro34/Livsaver.git
cd Livsaver
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> You can also configure a custom API key from the app's **Settings** page at runtime.

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at **`http://localhost:3000`** with Vite HMR enabled.

### 5. Build for Production

```bash
npm run build
npm start
```

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/` and rate-limited to **30 requests/minute**.

| Method | Endpoint | Description | Gemini AI |
|---|---|---|---|
| `GET` | `/api/health` | Health check — returns server status | ❌ |
| `POST` | `/api/prioritize` | AI-powered task prioritization | ✅ |
| `POST` | `/api/schedule` | Generate an optimized daily schedule | ✅ |
| `POST` | `/api/chat` | Conversational AI assistant | ✅ |
| `POST` | `/api/habit-insights` | Analyze habits and provide coaching | ✅ |
| `POST` | `/api/focus-tip` | Get a focus tip for a Pomodoro session | ✅ |
| `POST` | `/api/burnout-score` | Predict burnout risk (0–100) | ✅ |
| `POST` | `/api/procrastination-reason` | Diagnose why a task is being postponed | ✅ |
| `POST` | `/api/weekly-debrief` | Weekly performance review | ✅ |

> **Custom API Key Support:** Pass your own Gemini API key via the `x-gemini-api-key` request header to use your personal quota.

---

## 📁 Project Structure

```
Livsaver/
├── server.ts                  # Express backend with all AI API routes
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite build configuration
├── tsconfig.json              # TypeScript configuration
├── firestore.rules            # Firebase security rules
├── firebase.json              # Firebase project config
├── .env.example               # Environment variable template
│
├── src/
│   ├── main.tsx               # React app entry point
│   ├── App.tsx                # Root component — routing, state, timer, auth
│   ├── types.ts               # TypeScript interfaces (Task, Habit, etc.)
│   ├── index.css              # Global styles, Tailwind, dark mode, animations
│   │
│   ├── components/
│   │   ├── DashboardView.tsx  # Task management, AI chat, charts, overview
│   │   ├── ScheduleView.tsx   # AI-generated daily schedule display
│   │   ├── HabitsView.tsx     # Habit tracker with streaks and weekly grid
│   │   ├── FocusView.tsx      # Pomodoro timer + focus session history
│   │   ├── SettingsView.tsx   # API key, dark mode, energy profile, language
│   │   ├── ProfileView.tsx    # User profile, points, tier, Google sign-in
│   │   ├── Navbar.tsx         # Sidebar (desktop) / bottom bar (mobile)
│   │   ├── FloatingShapes.tsx # Animated background decorations
│   │   └── VoiceAssistant.tsx # Draggable voice assistant with speech I/O
│   │
│   └── lib/
│       ├── api.ts             # Custom fetch wrapper with API key injection
│       ├── firebase.ts        # Firebase app, Firestore, and Auth init
│       ├── audio.ts           # Sound effects (click, success, timer end)
│       ├── i18n.ts            # Translations (English, Hindi, Spanish)
│       └── LanguageContext.tsx # React context for language switching
│
└── assets/                    # Static assets
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Your Google Gemini API key for all AI features |
| `NODE_ENV` | ❌ | Set to `production` for production builds |
| `APP_URL` | ❌ | The hosted URL (auto-injected by AI Studio) |

---

## 🚢 Deployment

### Firebase Firestore Rules

Deploy security rules before going live:

```bash
firebase deploy --only firestore:rules
```

### Hosting (Railway / Cloud Run / Vercel)

Set environment variables on your hosting provider:

```
GEMINI_API_KEY=your_key_here
NODE_ENV=production
```

Then build and start:

```bash
npm run build
npm start
```

---

## 🙏 Acknowledgements

- **[Google AI Studio](https://aistudio.google.com/)** — For the platform and Gemini API
- **[Coding Ninjas](https://www.codingninjas.com/)** — For organizing the VibeCoding Hackathon
- **[Gemini 2.0 Flash](https://ai.google.dev/)** — The AI model powering all intelligent features
- **[Firebase](https://firebase.google.com/)** — Real-time database and authentication
- **[Vite](https://vite.dev/)** — Lightning-fast frontend tooling

---

<p align="center">
  Made with ❤️ for the <strong>VibeCoding Hackathon 2026</strong> by <strong>Coding Ninjas × Google</strong>
</p>

<p align="center">
  <sub>If this project helped or inspired you, consider giving it a ⭐</sub>
</p>
