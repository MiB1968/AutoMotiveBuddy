# Railway Deployment Guide

## Quick Start

### 1. Prerequisites
- GitHub account (already connected)
- Railway account (free tier available)
- Firebase credentials (Service Account JSON)

### 2. Deploy to Railway

#### Step 1: Connect Railway to GitHub
1. Go to [Railway.app](https://railway.app)
2. Sign up / Login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Select `MiB1968/AutoMotiveBuddy`
6. Railway auto-detects the Node.js + Docker setup

#### Step 2: Configure Environment Variables
In Railway Dashboard, add these variables:

```
FIREBASE_CONFIG = <Your Firebase Service Account JSON (as string)>
JWT_SECRET = <Generate a random 32+ char string>
NODE_ENV = production
GEMINI_API_KEY = <Your Gemini API Key>
```

**How to get Firebase Service Account:**
1. Go to Firebase Console
2. Project Settings → Service Accounts
3. Generate new private key
4. Copy the JSON (or stringify it)

#### Step 3: Deploy
- Railway automatically deploys on `git push` to `main`
- Monitor logs in Railway Dashboard
- App URL: `https://<railway-generated-url>.railway.app`

---

## Environment Setup

### Generate Firebase Config
```bash
# Copy your Firebase service account JSON
# Stringify it (remove newlines, escape quotes)
# Add as FIREBASE_CONFIG env var
```

### Generate JWT Secret
```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

---

## Monitoring

### View Logs
- Railway Dashboard → Select Service → Logs tab
- Real-time logs from your app

### Health Check
- Endpoint: `/api/health`
- Railway monitors this automatically

### Metrics
- CPU, Memory, Network usage visible in Railway Dashboard

---

## Database (Optional)

### PostgreSQL with Railway
1. In Railway Dashboard, click "+" → Add PostgreSQL
2. Railway auto-creates connection string
3. Add `DATABASE_URL` env var
4. Update `server.ts` to connect

### Or use Firebase Firestore (recommended)
- Already configured in your app
- No additional setup needed

---

## Troubleshooting

### Deploy Fails
- Check build logs in Railway
- Ensure `package.json` `start` script is correct
- Verify all env vars are set

### App crashes after deploy
- Check `/api/health` endpoint
- View real-time logs in Railway
- Common: Missing env vars or Firebase connection

### Cold start slow
- Railway free tier has ~30s boot time
- Consider upgrading to paid plan for consistent performance

---

## Cost

**Railway Pricing:**
- Free tier: $5/month credit (usually covers 1 app)
- Paid: $7/month base + usage
- Much cheaper than AWS for hobby projects

---

## Next Steps

1. ✅ Create Railway account
2. ✅ Connect GitHub repo
3. ✅ Set environment variables
4. ✅ Deploy
5. ✅ Test at `https://<your-url>.railway.app`

**Need help?** Check Railway docs: https://railway.app/docs
