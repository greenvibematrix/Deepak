# 🎂 Sayandana's Magical Birthday Website — Three Wishes ✨

A mobile-first, cinematic interactive birthday story created specifically for **Sayandana** by **Deepak**.

Theme: *"Three Wishes — A Little Birthday Magic"*

Combining Kerala & Mallu-inspired visual poetry, starry night fantasy, an interactive guardian genie, three progressive wish boxes, interactive candle-blowing, a sincere apology, and a gentle creator reveal.

---

## 🌟 Features Overview

- **Cinematic Night Sky & Canvas Physics**: Real-time canvas starfield with twinkling stars, glowing crescent moon, and interactive fireflies that react with golden ripples and flutters when tapped.
- **Living Animated Portrait**: Sayandana's cartoon illustration comes alive with an animated conic-gradient Kasavu gold halo, orbiting jasmine blossoms (*mulla poo*), and floating doodle crown (`👑`), heart (`🤍`), and sparkles (`✨`).
- **Magical Guardian Character**: A cute anime fantasy guardian inspired by Kerala aesthetics with dark hair, jasmine flowers, cream & gold Kasavu attire, and floating stardust.
- **Three Progressive Wishes & Constellations**:
  - **Wish 1 🌙**: Ignites Star 1 in the night sky.
  - **Wish 2 ✨**: Ignites Star 2 and draws a glowing constellation beam.
  - **Wish 3 👀**: Ignites Star 3, illuminating the celestial triangle with shooting stars and auroras.
  - **Draft Recovery**: Unfinished wishes are automatically preserved in `sessionStorage` in case of accidental refresh, and cleared once submitted.
- **Birthday Cake & Dual Candle-Blowing**:
  - **Method 1 (Microphone Detection)**: 100% processed client-side using Web Audio API frequency analysis of air turbulence (zero recording, zero uploading, zero storage).
  - **Method 2 (Tap Candle Fallback)**: Always available — tap the candle to extinguish the flame.
  - **Extinguish Animation**: Realistic curling smoke plume, floating golden embers, and celestial brightening.
- **Sincere Apology & Friendship**: Heartfelt, dignified, zero-pressure message respecting boundaries.
- **Wax-Sealed Envelope Reveal**: Interactive golden wax seal that opens to reveal *"Made by Deepak 🤍"*.
- **Secure Email Delivery**: Submits wishes to `greenvibematrix@gmail.com` via serverless API without exposing any API keys to frontend JavaScript.

---

## 📁 Project Folder Structure

```
Deepak/
├── api/
│   └── submit-wishes.js          # Secure serverless function (Vercel compatible)
├── public/
│   ├── index.html                # Semantic, accessible HTML with all 15 scenes
│   ├── styles/
│   │   ├── main.css              # Tokens, colors, typography, glassmorphism cards
│   │   ├── kerala-decor.css      # Kasavu gold borders, jasmine garlands, lamp styling
│   │   ├── scenes.css            # Layouts for Scenes 1-15, cake, candle, envelope
│   │   └── animations.css        # Living portrait, flame flicker, smoke, orbit keyframes
│   ├── scripts/
│   │   ├── config.js             # Configuration (BIRTHDAY_DATE, creator, recipient)
│   │   ├── stars-sky.js          # Starry canvas, fireflies, wish constellations
│   │   ├── candle-mic.js         # Mic breath detection + tap fallback
│   │   ├── confetti.js           # Birthday reveal confetti burst
│   │   ├── audio-manager.js      # FUTURE MUSIC COMPONENT (Clean architecture for V2)
│   │   └── app.js                # State machine, validations, draft persistence
│   └── assets/
│       └── images/
│           ├── sayandana-cartoon.png     # Cheerful portrait with doodles
│           ├── sayandana-saree-cloud.jpg # Saree portrait in thought cloud
│           ├── sayandana-tree-full.jpg   # Anime scene under Kerala sunlit tree
│           ├── magical-girl.png          # Kerala fantasy guardian genie
│           ├── kerala-lamp.png           # Traditional Kerala Nilavilakku lamp
│           └── README.md                 # Image slot replacement guide
├── server.js                     # Local Express development server
├── vercel.json                   # Vercel deployment routing configuration
├── package.json                  # Dependencies (Express, CORS, Dotenv)
├── .env.example                  # Environment template
├── .env                          # Local environment variables
└── README.md                     # Documentation
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 2. Installation
Open your terminal in the project directory and install dependencies:
```bash
npm install
```

### 3. Run Development Server
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser or phone browser.

> **Note on Local Email Simulation:**
> When running locally without an external email API key, the server operates in **Simulation Mode**. Submitted wishes will be formatted and logged directly to your terminal console, allowing you to test the full flow end-to-end without signing up for third-party services.

---

## 🔐 Backend Process & Email Delivery Setup

The backend process securely receives Sayandana's wishes, stores them persistently so nothing is ever lost, and delivers them directly to Deepak's email (`greenvibematrix@gmail.com`).

**Zero Tracking Guarantee:** NO IP addresses, NO geolocations, and NO browser/device fingerprints are ever recorded or emailed.

### Backend Architecture Overview:
1. **Persistent Vault (`data/wishes-vault.json`)**: Every submission is immediately preserved on the server disk.
2. **Multi-Provider Dispatcher**:
   - **Option A (Recommended & Free): Direct Gmail via Google App Password**
   - **Option B (Serverless-Native): Resend API**
   - **Option C (Simulation): Local Terminal Output**
3. **Health Check**: `GET /api/health`
4. **Vault Viewer**: `npm run view:wishes`
5. **Automated Test Runner**: `npm run test:backend`

---

### Delivery Option 1: Direct Gmail (Free & Quick)
You can deliver wishes directly from your own Gmail to `greenvibematrix@gmail.com`:
1. Log into your Google Account.
2. Go to: **Manage your Google Account** > **Security** > **2-Step Verification** > **App passwords**.
3. Create a new App Password named `Birthday Website`.
4. In your `.env` file, add:
   ```env
   OWNER_EMAIL=greenvibematrix@gmail.com
   GMAIL_USER=greenvibematrix@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```
   *(Spaces are automatically handled)*

---

### Delivery Option 2: Resend API (Best for Vercel)
1. Go to [https://resend.com](https://resend.com) and create a free account (3,000 emails/month free).
2. Generate an API Key under **API Keys**.
3. In your `.env` file, add:
   ```env
   OWNER_EMAIL=greenvibematrix@gmail.com
   RESEND_API_KEY=re_123456789abcdef
   ```

---

### Testing & Verifying the Backend Process:
You can verify the entire backend pipeline at any time with one command:
```bash
npm run test:backend
```
To view all captured wishes stored in the vault:
```bash
npm run view:wishes
```

---

## 💌 Email Delivery Format

When Sayandana submits her wishes, Deepak receives both a styled HTML card and clean plaintext:

```text
Subject: 🎂 Sayandana's Birthday Wishes

Someone left three wishes on your birthday page.

🌙 WISH ONE:
[Sayandana's First Wish]

✨ WISH TWO:
[Sayandana's Second Wish]

💫 WISH THREE:
[Sayandana's Third Wish]

Submission time:
Friday, October 2, 2026 at 12:41:54 PM (IST)
```

---

## 🌐 Deployment Instructions

### Deploying to Vercel (Recommended)
1. Push this repository to GitHub or GitLab.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your repository.
4. Under **Environment Variables**, add:
   - `OWNER_EMAIL`: `greenvibematrix@gmail.com`
   - `RESEND_API_KEY`: *(Your Resend API key)* OR `GMAIL_USER` and `GMAIL_APP_PASSWORD`
5. Click **Deploy**. Vercel will automatically serve `/public` as static frontend and `/api/submit-wishes.js` as the serverless function.

---

## 🔮 Future Enhancements (Ready for V2)

### 1. Adding the Birthday Date Later
The birthday date is configured in `public/scripts/config.js`:
```javascript
const CONFIG = {
  // Add date when ready (e.g. "2026-10-15"):
  BIRTHDAY_DATE: "",
  ...
};
```
When left empty (`""`), no date or countdown is displayed.

### 2. Adding Background Music Later
A decoupled music manager is implemented in `public/scripts/audio-manager.js`:
```javascript
// 1. Place your licensed audio file in public/assets/music/bgm.mp3
// 2. In public/scripts/config.js, enable audio:
AUDIO: {
  ENABLED: true,
  AUTOPLAY: false, // Always requires user interaction to conform with browser policies
  TRACK_SRC: "assets/music/bgm.mp3"
}
// 3. Uncomment the #music-toggle-btn in public/index.html
```

### 3. Replacing or Adding Cartoon Assets
All illustrations are stored in `public/assets/images/`:
- `sayandana-cartoon.png`: Primary avatar for Scene 2 (Birthday Reveal).
- `sayandana-saree-cloud.jpg`: Thoughtful portrait for Scene 13 (Apology & Friendship).
- `sayandana-tree-full.jpg`: Full anime painting for Scene 15 (Final Birthday Wish).
- `magical-girl.png`: Magical birthday guardian genie.
- `kerala-lamp.png`: Traditional Kerala bronze oil lamp.

To replace any image, overwrite the file in `public/assets/images/` with your own image keeping the same filename.
