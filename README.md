# Livsaver

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](https://livesaver-bf71c.web.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Powered by Gemini](https://img.shields.io/badge/AI-Google_Gemini-orange.svg)](https://deepmind.google/technologies/gemini/)

Livsaver is an intelligent, AI-powered productivity and task management web application designed to optimize daily scheduling and task prioritization. By leveraging Google's Gemini AI, Livsaver analyzes tasks contextually to suggest optimal workflows based on deadlines, task priorities, and intelligent heuristics.

## Features

- **AI-Powered Prioritization**: Integrates with Google's Gemini AI to dynamically re-evaluate and sort tasks based on urgency and context.
- **Responsive Architecture**: A modern, mobile-first user interface built with advanced layout techniques and smooth micro-animations.
- **Secure Authentication**: Implements robust user authentication via Firebase Authentication, supporting Google Sign-In.
- **Cloud Synchronization**: Ensures real-time data persistence and multi-device synchronization using Firebase Firestore.
- **Integrated Payments**: Features Razorpay checkout integration for seamless subscription management and processing.
- **Internationalization (i18n)**: Comprehensive multi-language support designed for a global user base.

## Technical Stack

- **Frontend Framework**: React (Vite), TypeScript
- **Styling**: Tailwind CSS
- **Backend Infrastructure**: Firebase (Authentication, Firestore, Hosting)
- **Artificial Intelligence**: Google Gemini API (`@google/genai`)
- **Animation Library**: Motion (Framer Motion)
- **Iconography**: Lucide React
- **Payment Gateway**: Razorpay

## Getting Started

The following instructions outline the process for setting up the project locally for development and testing.

### Prerequisites

Ensure the following dependencies are installed prior to setup:
- [Node.js](https://nodejs.org/) (v18 or higher)
- A configured Firebase project
- A valid Google Gemini API Key
- A Razorpay Test Key

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

3. **Configure environment variables**
   Create a `.env` file in the root directory and define the required credentials (refer to `.env.example` for the template):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_RAZORPAY_KEY_ID=your_razorpay_key
   ```

4. **Initialize the development server**
   ```bash
   npm run dev
   ```
   Navigate to [http://localhost:5173](http://localhost:5173) in your web browser to access the application.

## Deployment

The application is structured for streamlined deployment via Firebase Hosting.

```bash
npm run build
npx firebase-tools deploy --only hosting
```

## Security

For information regarding vulnerability reporting and supported versions, please refer to our [Security Policy](SECURITY.md).

## License

This project is distributed under the MIT License. See the [LICENSE.md](LICENSE.md) file for comprehensive details.
