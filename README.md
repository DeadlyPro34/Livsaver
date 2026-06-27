## Deployment

### Firebase Firestore Rules
Deploy rules before publishing:
```
firebase deploy --only firestore:rules
```

### Environment Variables
Set in your hosting provider (Railway / Cloud Run / Vercel):
- `GEMINI_API_KEY` — your Google Gemini API key
- `NODE_ENV=production`

### Build & Start
```
npm run build
npm start
```
