# 🚀 Deployment Guide - Blockchain UPI MVP

Complete guide to deploy your PYUSD payment app to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] ✅ All tests passing (see TESTING_GUIDE.md)
- [ ] ✅ Production build works (`npm run build`)
- [ ] ✅ No console errors in dev/prod
- [ ] ✅ Supabase project ready for production
- [ ] ✅ Environment variables documented
- [ ] ✅ Security audit completed
- [ ] ✅ Mobile responsiveness verified
- [ ] ✅ Performance optimized

---

## 🌐 Deployment Options

Choose your hosting platform:

### Option 1: Vercel (Recommended) ⭐
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Easy environment variables
- ✅ Git integration

### Option 2: Netlify
- ✅ Free tier available
- ✅ Drag & drop deploy
- ✅ Continuous deployment
- ✅ Custom domains

### Option 3: GitHub Pages
- ✅ Free
- ✅ Direct from repo
- ⚠️ Static only (works with Vite)

---

## 🚀 Deploy to Vercel (Step-by-Step)

### 1️⃣ Prepare Your Repository

```bash
# Ensure latest code is committed
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 2️⃣ Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repos

### 3️⃣ Import Project

1. Click **Add New Project**
2. Import your `ETHOnline_2025` repository
3. Configure project:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### 4️⃣ Configure Environment Variables

Add these in Vercel dashboard → Settings → Environment Variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://pftvbzvualirgpuyugzc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHZienZ1YWxpcmdwdXl1Z3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTcxMzMsImV4cCI6MjA3Njk3MzEzM30.6WqnJdEuK4FJ34rj-GvX5QPOAAEgLQD1HWHDiy4UbS0

# Encryption Key (IMPORTANT: Generate a new strong key for production!)
VITE_ENCRYPTION_SECRET_KEY=GENERATE_NEW_STRONG_32_CHAR_KEY_FOR_PRODUCTION_USE

# Arbitrum Network
VITE_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
VITE_ARBITRUM_CHAIN_ID=42161

# PYUSD Contract (Update when available)
VITE_PYUSD_CONTRACT_ADDRESS=0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
```

⚠️ **SECURITY NOTE:** 
- Generate a NEW encryption key for production
- Never use the same key as development
- Use a password generator for 32+ character random string

```bash
# Generate secure encryption key (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 5️⃣ Deploy

1. Click **Deploy**
2. Wait for build to complete (2-3 minutes)
3. Get your deployment URL: `https://your-project.vercel.app`

### 6️⃣ Configure Custom Domain (Optional)

1. Go to Vercel → Settings → Domains
2. Add your domain (e.g., `pyusd-pay.com`)
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

---

## 🌐 Deploy to Netlify

### 1️⃣ Install Netlify CLI (Optional)

```bash
npm install -g netlify-cli
```

### 2️⃣ Build for Production

```bash
npm run build
```

### 3️⃣ Deploy via Drag & Drop

1. Go to https://app.netlify.com/drop
2. Drag the `dist` folder
3. Site deployed instantly!

### 4️⃣ Deploy via CLI

```bash
# Login to Netlify
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

### 5️⃣ Configure Environment Variables

1. Go to Site Settings → Environment Variables
2. Add all variables from `.env`
3. Redeploy for changes to take effect

---

## 🔧 Post-Deployment Configuration

### 1️⃣ Update Supabase URL Allowlist

1. Go to Supabase Dashboard
2. Settings → API
3. Add your production domain to allowed origins:
   ```
   https://your-project.vercel.app
   https://your-custom-domain.com
   ```

### 2️⃣ Test Production Deployment

Visit your live URL and test:

- [ ] ✅ Login works
- [ ] ✅ Signup creates wallet
- [ ] ✅ Dashboard loads
- [ ] ✅ Balance displays
- [ ] ✅ Send payment works
- [ ] ✅ Transactions show
- [ ] ✅ No console errors

### 3️⃣ Monitor Performance

Use Vercel Analytics or Netlify Analytics:
- Page load times
- User interactions
- Error tracking
- Geographic distribution

---

## 🔐 Production Security Checklist

Before going live:

### Environment Variables
- [ ] ✅ New encryption key generated
- [ ] ✅ All secrets stored in platform (not in code)
- [ ] ✅ No `.env` file committed to repo
- [ ] ✅ Supabase service role key kept secret

### Supabase Security
- [ ] ✅ RLS policies enabled on all tables
- [ ] ✅ API keys rotated
- [ ] ✅ Only production URL in allowlist
- [ ] ✅ Email confirmations enabled (optional)

### Frontend Security
- [ ] ✅ All inputs validated
- [ ] ✅ XSS protection in place
- [ ] ✅ SQL injection prevented
- [ ] ✅ HTTPS enforced
- [ ] ✅ Content Security Policy configured

### Blockchain Security
- [ ] ✅ Private keys never sent to client
- [ ] ✅ Transactions signed server-side only
- [ ] ✅ Amount limits configured
- [ ] ✅ Rate limiting on transactions

---

## 📊 Monitoring & Analytics

### Setup Vercel Analytics

```bash
npm install @vercel/analytics
```

```typescript
// src/main.tsx
import { Analytics } from '@vercel/analytics/react';

// Add to your app
<Analytics />
```

### Setup Error Tracking (Sentry)

```bash
npm install @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

### Monitor Blockchain Transactions

Use Arbiscan API to track:
- Transaction confirmations
- Failed transactions
- Gas usage
- Contract interactions

---

## 🔄 Continuous Deployment

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_ENCRYPTION_SECRET_KEY: ${{ secrets.VITE_ENCRYPTION_SECRET_KEY }}
        VITE_ARBITRUM_RPC_URL: ${{ secrets.VITE_ARBITRUM_RPC_URL }}
        VITE_ARBITRUM_CHAIN_ID: ${{ secrets.VITE_ARBITRUM_CHAIN_ID }}
        VITE_PYUSD_CONTRACT_ADDRESS: ${{ secrets.VITE_PYUSD_CONTRACT_ADDRESS }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

---

## 🐛 Troubleshooting Production Issues

### Build Fails

```bash
# Check build logs
# Common issues:
# 1. Missing dependencies
npm install

# 2. TypeScript errors
npm run build 2>&1 | grep "error"

# 3. Environment variables not set
# Verify in platform dashboard
```

### Blank Page After Deploy

1. Check browser console for errors
2. Verify environment variables set correctly
3. Check if assets are being served:
   - Open DevTools → Network tab
   - Look for 404 errors
4. Verify build output directory is `dist`

### Supabase Connection Fails

1. Verify CORS settings in Supabase
2. Check API URL is correct
3. Verify anon key is valid
4. Check browser console for specific errors

### Transactions Not Working

1. Verify Arbitrum RPC URL reachable
2. Check contract address is correct
3. Verify users have gas fees (ETH)
4. Check transaction hash on Arbiscan

---

## 🎯 Performance Optimization

### Code Splitting

```typescript
// Use dynamic imports for heavy components
const QRScanner = lazy(() => import('./components/QRScanner'));
```

### Image Optimization

```bash
# Install image optimization
npm install vite-plugin-image-optimizer
```

### Bundle Analysis

```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({ open: true })
  ]
});
```

---

## 📱 PWA Setup (Optional)

Make your app installable:

```bash
npm install vite-plugin-pwa
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'PYUSD Pay',
        short_name: 'PYUSD',
        description: 'Blockchain UPI Payment System',
        theme_color: '#667eea',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

---

## ✅ Launch Checklist

Final checks before announcing:

- [ ] ✅ All features tested in production
- [ ] ✅ Mobile experience perfect
- [ ] ✅ Performance excellent (Lighthouse score >90)
- [ ] ✅ Security audit passed
- [ ] ✅ Error tracking setup
- [ ] ✅ Analytics configured
- [ ] ✅ Custom domain configured (if applicable)
- [ ] ✅ SSL certificate active
- [ ] ✅ Documentation updated
- [ ] ✅ Demo video created
- [ ] ✅ Social media graphics ready
- [ ] ✅ Support email configured
- [ ] ✅ Terms of Service added
- [ ] ✅ Privacy Policy added

---

## 🎉 You're Live!

**Congratulations on deploying your Blockchain UPI MVP!** 🚀

Share your app:
- Tweet about it
- Post on LinkedIn
- Submit to Product Hunt
- Share in crypto communities

---

**Questions?** Check the main README.md or TESTING_GUIDE.md
