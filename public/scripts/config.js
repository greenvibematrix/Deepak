/**
 * Sayandana Magical Birthday Website - Configuration
 * 
 * V2 Configuration:
 * - Birthday date is empty for V1/V2 (no countdown displayed).
 * - "Pavizha Mazha" from Athiran is configured as the main background music.
 * - Zero tracking / Zero email exposure in frontend code.
 */

const CONFIG = {
  // Configurable birthday date variable for future use
  BIRTHDAY_DATE: "",

  // Recipient details
  RECIPIENT_NAME: "Sayandana",
  RECIPIENT_TITLE: "Happy Birthday, Sayandana 🎂",

  // Creator details (Kept completely hidden until the final reveal)
  CREATOR_NAME: "Deepak",

  // API Endpoint for wish submission (Used when serverless backend is running)
  API_ENDPOINT: "/api/submit-wishes",

  // Web3Forms Direct Delivery Key (Works 100% on static hosting / Vercel Drop without any backend server)
  // Free key from https://web3forms.com sent to greenvibematrix@gmail.com
  WEB3FORMS_ACCESS_KEY: "d45a3d63-1bdb-48c4-a383-f0acca46fdd6",

  // Storage keys for draft recovery (cleared after submission)
  STORAGE_KEYS: {
    WISH_1: "sayandana_wish_1_draft",
    WISH_2: "sayandana_wish_2_draft",
    WISH_3: "sayandana_wish_3_draft",
    SAVED_STEP: "sayandana_story_step"
  },

  // Audio configuration: Pavizha Mazha from Athiran
  AUDIO: {
    ENABLED: true,
    AUTOPLAY: false, // Never autoplay before user clicks "Let's begin ✨"
    TRACK_SRC: "assets/audio/pavizha-mazha.mp3",
    FALLBACK_TRACKS: [
      "assets/music/pavizha-mazha.mp3",
      "assets/audio/bgm.mp3",
      "assets/music/bgm.mp3",
      "pavizha-mazha.mp3"
    ],
    SONG_TITLE: "Pavizha Mazha — Athiran",
    DURATION_SECONDS: 233, // ~3:53
    DEFAULT_VOLUME: 0.70,
    DUCKED_VOLUME: 0.32
  },

  // Animation and interaction timings (ms)
  TIMINGS: {
    OPENING_DARK_DELAY: 800,
    OPENING_STARS_REVEAL: 1500,
    TYPEWRITER_SPEED: 42,
    TRANSITION_DURATION: 600,
    CANDLE_BLOW_HOLD_MS: 380
  }
};

// Freeze configuration to prevent tampering
if (typeof Object.freeze === "function") {
  Object.freeze(CONFIG);
  Object.freeze(CONFIG.STORAGE_KEYS);
  Object.freeze(CONFIG.AUDIO);
  Object.freeze(CONFIG.TIMINGS);
}

window.APP_CONFIG = CONFIG;
