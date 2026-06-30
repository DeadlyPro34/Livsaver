# LifeSaver AI

An AI-powered productivity and task management application that intelligently prioritizes your day.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](https://livesaver-bf71c.web.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Powered by Gemini](https://img.shields.io/badge/AI-Google_Gemini-orange.svg)](https://deepmind.google/technologies/gemini/)

---

## Project Overview

LifeSaver AI is an intelligent task management web application designed to optimize daily scheduling. 

In a world where decision fatigue prevents individuals from being productive, LifeSaver AI solves the problem of "what to do next." By leveraging Google's Gemini AI, the application analyzes your pending tasks contextually to suggest optimal workflows based on deadlines, priorities, and intelligent heuristics. 

It exists to streamline the workflow of professionals, students, and any individual feeling overwhelmed by complex to-do lists. The main objective is to reduce cognitive load and help users focus on execution rather than planning.

---

## Demo

**Live Demo:**  
https://livesaver-bf71c.web.app/

**Video Demo:**  
[Link to Video Demo Placeholder]

---

## Features

### Core Features
- Intelligent Task Management (Create, Read, Update, Delete)
- AI-Driven Task Prioritization
- Energy-based scheduling and workflow suggestions
- Gamification with user points and completion streaks

### Authentication Features
- Secure Google OAuth Login
- Anonymous guest access for immediate trial
- Session persistence

### Dashboard Features
- Real-time task synchronization across devices
- Progress tracking and analytics
- Cross-device responsive layout

### Advanced Features
- Direct integration with Google Gemini API for deep task analysis
- Razorpay Test Mode checkout integration for Pro subscriptions
- Internationalization (i18n) for multiple languages

---

## Technology Stack

**Frontend:**
- React 18
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion (Animations)
- Lucide React (Icons)

**Backend & Database (Serverless):**
- Firebase Authentication
- Firebase Firestore (NoSQL Database)
- Firebase Hosting

**Artificial Intelligence:**
- Google Gemini API (`@google/genai`)

**Third-Party Integrations:**
- Razorpay (Payment Gateway)

---

## System Architecture

```text
User 
  ↓ (Interacts with UI)
React Frontend (Vite + TypeScript)
  ↓ (API Calls & WebSocket Listeners)
----------------------------------------
|         External Services            |
| 1. Firebase Auth (Authentication)    |
| 2. Firestore (Real-time DB)          |
| 3. Gemini API (Task Analysis)        |
| 4. Razorpay (Payment Processing)     |
----------------------------------------
```

The application relies on a serverless architecture where the React frontend directly communicates with Firebase for state persistence and authentication, and calls the Gemini API securely for AI operations.

---

## Project Structure

```text
Livsaver/
│
├── src/
│   ├── components/       # React UI components (Dashboard, Profile, etc.)
│   ├── lib/              # Utility functions, Firebase setup, AI logic
│   ├── App.tsx           # Main application entry point
│   ├── main.tsx          # React DOM rendering
│   ├── index.css         # Tailwind directives and global styles
│   └── types.ts          # TypeScript interfaces and definitions
├── public/               # Static assets
├── .env.example          # Environment variables template
├── firebase.json         # Firebase hosting configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── vite.config.ts        # Vite bundler configuration
└── README.md             # Project documentation
```

---

## Installation & Setup Guide

### Step 1: Clone Repository

```bash
git clone https://github.com/DeadlyPro34/Livsaver.git
cd Livsaver
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Setup Environment Variables

Create a `.env` file in the root directory:

```bash
touch .env
```

Add the following environment variables (refer to `.env.example`):

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_test_key
```

**Variables Explanation:**
- `VITE_FIREBASE_*`: Configuration keys provided by your Firebase Project console.
- `VITE_GEMINI_API_KEY`: API key from Google AI Studio.
- `VITE_RAZORPAY_KEY_ID`: Test API key generated from the Razorpay Dashboard.

### Step 4: Start Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Usage Guide

1. **Login:** Access the application and authenticate using the "Continue with Google" button.
2. **Add Tasks:** Enter your pending tasks, including deadlines and categories.
3. **AI Prioritization:** Click the "Re-prioritize with Gemini" button to let the AI analyze and sort your tasks by urgency.
4. **Execution:** Follow the AI's suggested schedule, mark tasks as complete, and earn productivity points.
5. **Subscription:** Navigate to the Profile section to test the Razorpay payment integration by subscribing to the Pro tier.

---

## Environment Variables

| Variable | Description |
|------------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API authentication key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase authorization domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase unique project identifier |
| `VITE_GEMINI_API_KEY` | Google Gemini API secret key |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public test key |

---

## Database Schema 

**Users Collection (`users`)**
- `uid` (String): Primary key
- `email` (String): User email address
- `displayName` (String): Full name
- `points` (Number): Gamification score
- `tier` (String): 'free' or 'pro'
- `razorpay_payment_id` (String): Transaction reference

**Tasks Subcollection (`users/{uid}/tasks`)**
- `id` (String): Task ID
- `name` (String): Task title
- `deadline` (Timestamp): Due date
- `completed` (Boolean): Status
- `priority` (String): AI-assigned priority level

---

## Security Features

- **Authentication:** Managed by Google OAuth and Firebase Auth.
- **Authorization:** Firestore Security Rules ensure users can only read and write their own documents.
- **Client-Side Routing Protection:** Protected routes requiring authentication state.
- **Environment Security:** Sensitive API keys are restricted via HTTP referrers in Google Cloud Console.

---

## Performance Optimizations

- **Vite Bundler:** Extremely fast Hot Module Replacement (HMR) and optimized production builds.
- **Real-time Caching:** Firebase Firestore SDK automatically caches data locally for offline support and reduced read operations.
- **Conditional Rendering:** Heavy components and modals are lazily evaluated or conditionally rendered.

---

## Deployment

This application is configured for Firebase Hosting.

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase:**
   ```bash
   npx firebase-tools deploy --only hosting
   ```

---

## Roadmap / Future Improvements

- Implementation of Web Push Notifications for upcoming deadlines.
- Native mobile application utilizing React Native.
- Deep integration with Google Calendar and Microsoft Outlook.
- Advanced AI analytics on personal productivity trends.

---

## Contributors

| Name | Role | GitHub |
|--------|------|---------|
| DeadlyPro34 | Lead Developer | [@DeadlyPro34](https://github.com/DeadlyPro34) |

---

## Contributing Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License. See [LICENSE.md](LICENSE.md) for details.

---

## Contact

**Project Owner:**  
DeadlyPro34

**GitHub:**  
https://github.com/DeadlyPro34

---

## Acknowledgements

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/)
- [Google Gemini API](https://deepmind.google/technologies/gemini/)
- [Razorpay](https://razorpay.com/)
- [Lucide Icons](https://lucide.dev/)
- [Framer Motion](https://www.framer.com/motion/)
