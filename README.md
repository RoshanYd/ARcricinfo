<div align="center">
  <img width="800" alt="ARcricinfo Logo" src="https://i.postimg.cc/fRdWdn9t/20251127-224320.png" />
  <h1>ARcricinfo</h1>
  <p><strong>Professional Cricket Management & Real-time Scoring Platform</strong></p>
</div>

## 📌 Features

ARcricinfo is a comprehensive tool designed for cricket enthusiasts, tournament organizers, and players who want an authentic, digital recording of their matches. 

### 🎨 5-Theme System
- **Theme Customization:** Seamlessly switch between 5 professionally tuned visual themes with persistent settings:
  1. ☀️ **Light (Default):** Clean, crisp modern white & slate navy aesthetic.
  2. 🔴 **Red Theme:** Passionate cricket crimson with ruby accents and high-contrast rose highlights.
  3. 🟢 **Green Theme:** Turf pitch stadium green with emerald cards and mint-white typography.
  4. ⚫ **Black Theme:** Midnight dark OLED obsidian styling with cricket gold accents.
  5. 🍦 **Creamy Theme:** Vintage Lord's & Test match warm ivory parchment with mahogany leather notes.
- **Flawless Contrast:** Every batsman card, bowling card, table, modal, and badge dynamically adapts for 100% legibility in all themes.

### 🔐 Multi-Provider Authentication
- **Continue with Google:** One-tap OAuth 2.0 integration via Supabase with automatic avatar and profile provisioning.
- **Mobile & Email Sign-in:** Support for password-based, OTP verification, and account recovery flows.

### 🏏 Match Scoring & Engine
- **Advanced Match Setup:** Full configuration for total overs, squad sizes (up to 25 players), and custom team names.
- **Deep Scoring Logic:** Handles extras (wides, no-balls with run penalties), byes, leg-byes, and various dismissal types (Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket, Obstructing Field, Retired Hurt).
- **Match Dashboards:** Live visualization of Run Rate (CRR/RRR), Projected Scores, Partnerships, and Fall of Wickets.
- **Super Over Support:** Automatic Super Over resolution engine for tied matches.
- **Match Scheduling:** Plan matches for later dates and start the toss when both teams have arrived!

### 🏆 Tournament Management
- **Host Tournaments:** Create comprehensive tournaments with custom names, dates, sponsorship banners, and custom team counts.
- **Bracket & Fixtures:** Automatically or manually schedule fixtures round-by-round.
- **Tournament Analytics:** Dedicated tournament leaderboards calculating "Most Runs", "Most Wickets", and "MVP" across all fixtures!

### 👥 Team Persistence & Rosters
- **Team Vault:** Build your teams once, save them to the database, and instantly load them into future matches or tournaments.
- **Custom Logos:** Add remote URL images as team badges to make the application feel truly personal.
- **Global Players Hub:** A centralized registry of all players that tracks their global rank, total runs, batting strike rate, bowling economy, and match history.

### 🌐 Social & Broadcaster Features
- **YouTube Livestream:** Attach a livestream URL directly into the Match Setup for real-time dynamic iframe embedding inside the live-score spectator view.

---

## 🚀 Getting Started

To run the platform locally, follow these steps:

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- Firebase / Supabase (Optional, if using Auth/Realtime features)

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Variables
Ensure you have your `.env` configured for the database instances:
```bash
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### 4. Running the Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see ARcricinfo in action.

---

## 🛠️ Built With
- **Frontend Framework:** React 18 + Vite
- **Styling:** Tailwind CSS (Modern Glassmorphic styling)
- **Icons:** Lucide-React
- **Database & Auth:** Supabase
- **State Management:** React Hooks
- **Language:** TypeScript

<div align="center">
  <p>Built for the love of the game.</p>
</div>
