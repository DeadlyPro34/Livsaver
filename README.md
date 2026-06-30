# Livsaver 🚀

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](https://livesaver-bf71c.web.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Powered by Gemini](https://img.shields.io/badge/AI-Google_Gemini-orange.svg)](https://deepmind.google/technologies/gemini/)

**Livsaver** is an intelligent, AI-powered productivity and task management web application built to help you prioritize your day effectively. Utilizing the power of Google's Gemini AI, Livsaver analyzes your tasks and automatically suggests what you should focus on next based on deadlines, priorities, and smart heuristics.

## ✨ Features

- **🧠 AI-Powered Prioritization**: Seamlessly connect to Google's Gemini AI to re-evaluate and sort your tasks based on urgency and context.
- **📱 Responsive & Beautiful UI**: A highly polished, modern, and mobile-first user interface featuring smooth micro-animations and intuitive design.
- **🔐 Authentication**: Secure user login via Firebase Authentication (Google Sign-In).
- **☁️ Cloud Sync**: Real-time task syncing and data persistence using Firebase Firestore.
- **💳 Pro Tier Mock Checkout**: Try out our simulated Google Pay integration via the native Web Payment Request API.
- **🌍 Internationalization (i18n)**: Multi-language support to cater to a global audience.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS
- **Backend & Database**: Firebase (Auth, Firestore, Hosting)
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React

## 🚀 Getting Started

Follow these instructions to run the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A Firebase project
- A Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DeadlyPro34/Livsaver.git
   cd Livsaver
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add your credentials (see `.env.example` for reference):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

## 📦 Deployment

This project is configured for easy deployment via Firebase Hosting.

```bash
npm run build
npx firebase-tools deploy --only hosting
```

## 🛡️ Security
Please review our [Security Policy](SECURITY.md) for information on how to report vulnerabilities.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
