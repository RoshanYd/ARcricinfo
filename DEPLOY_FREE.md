# 🚀 100% Strictly Free End-to-End Deployment Guide

ARcricinfo can be hosted **100% free forever** with zero credit card required using the following battle-tested free-tier platforms:

| Component | Platform | Plan | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend (React + Vite PWA)** | **Vercel** or **Render Static** | Free Hobby | **$0.00 / month** |
| **Backend (Express + Socket.IO)** | **Render** or **Koyeb** | Free Web Service | **$0.00 / month** |
| **Database & Auth** | **Supabase** | Free Tier | **$0.00 / month** |

---

## ⚡ Method 1: Vercel (Frontend) + Render (Backend) — *Recommended & Fastest (5 mins)*

### Step 1: Deploy Backend to Render (Free Web Service)
1. Go to [https://render.com](https://render.com) and sign up / log in with your GitHub account.
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and connect:
   `https://github.com/RoshanYd/ARcricinfo`
4. Set the following settings:
   - **Name:** `arcricinfo-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free` ($0/mo)
5. Scroll down to **Environment Variables** and add:
   - `NODE_ENV` = `production`
   - `PORT` = `4000`
   - `SUPABASE_URL` = `https://sjabhigvaouchaljfqfq.supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYWJoaWd2YW91Y2hhbGpmcWZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTQ3MzIsImV4cCI6MjA4NzU3MDczMn0.RIErfn3zCN1gqXSZkXnlGTp7F8-9mUhIFCKF4RiLTMc`
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g. `https://arcricinfo-backend.onrender.com`).

---

### Step 2: Deploy Frontend to Vercel (Free Global CDN)
1. Go to [https://vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New…** → **Project**.
3. Import your repository: `RoshanYd/ARcricinfo`.
4. Vercel will automatically detect `Vite` framework with `npm run build` and output directory `dist`.
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = `https://sjabhigvaouchaljfqfq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqYWJoaWd2YW91Y2hhbGpmcWZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTQ3MzIsImV4cCI6MjA4NzU3MDczMn0.RIErfn3zCN1gqXSZkXnlGTp7F8-9mUhIFCKF4RiLTMc`
   - `VITE_BACKEND_URL` = *(Your Render backend URL from Step 1, e.g. `https://arcricinfo-backend.onrender.com`)*
6. Click **Deploy**.
7. Within 60 seconds, your site will be live on a fast, global HTTPS domain (e.g. `https://arcricinfo.vercel.app`)!

---

### Step 3: Configure Google Auth & Supabase Redirect URLs
To ensure **"Continue with Google"** works seamlessly on your deployed URL:
1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/sjabhigvaouchaljfqfq](https://supabase.com/dashboard/project/sjabhigvaouchaljfqfq)
2. Go to **Authentication** → **URL Configuration**.
3. Set **Site URL** to your deployed Vercel domain (e.g. `https://arcricinfo.vercel.app`).
4. In **Redirect URLs**, add:
   - `https://arcricinfo.vercel.app/**`
   - `https://arcricinfo.vercel.app`
   - `http://localhost:3001/**` (keeps local dev working)
5. Click **Save**.

---

## ⚡ Method 2: All-in-One Render Blueprint (`render.yaml`)

You can also deploy both frontend and backend together on Render using the preconfigured [`render.yaml`](./render.yaml) file:

1. Go to [https://dashboard.render.com/blueprints](https://dashboard.render.com/blueprints).
2. Click **New Blueprint Instance**.
3. Select `RoshanYd/ARcricinfo`.
4. Render will parse `render.yaml` and show:
   - `arcricinfo-backend` (Node Web Service, Free Plan)
   - `arcricinfo-frontend` (Static Site, Free Plan)
5. Fill in the prompted Supabase environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Apply**. Both services will build and deploy automatically!

---

## 🔒 Security & Privacy Verification
- All sensitive files (`.env`, `.env.local`, `backend/.env`, secrets, certificates) are permanently excluded from Git by `.gitignore`.
- Production builds strip local debug traces and use HTTPS/TLS encrypted connections.
- WebSockets automatically upgrade to `wss://` over HTTPS in production.
- PWA manifest and service worker enable offline caching on mobile and desktop.
