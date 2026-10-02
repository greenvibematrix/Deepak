/**
 * ==============================================================================
 * SAYANDANA BIRTHDAY EXPERIENCE — MUSIC & MUSIC-REACTIVE ENGINE
 * ==============================================================================
 * 
 * Features:
 * 1. Persistent Global Audio Controller for "Pavizha Mazha — Athiran" (~3:53).
 * 2. Unobtrusive floating music pill (🎵 / 🔊 / 🔇) with mute/unmute and pause/play.
 * 3. Does NOT autoplay before user interaction; starts when clicking "Let's begin ✨".
 * 4. Music continues across all scenes without restarting.
 * 5. Replay resets audio to the beginning.
 * 6. Smooth volume transitions and ducking during heartfelt letters.
 * 7. Web Audio API Analyser: extracts real-time smoothed bass, mid, treble, and energy.
 * 8. Drives subtle, elegant, cinematic environmental breathing (CSS variables & Canvas).
 * 9. Gentle fallback ambient generator if the MP3 file is still pending on disk.
 */

class MusicReactiveEngine {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.isContextReady = false;

    // Smoothed frequency values (0.0 to 1.0)
    this.bass = 0.0;
    this.mid = 0.0;
    this.treble = 0.0;
    this.energy = 0.0;

    // Frequency data buffers
    this.frequencyData = null;
    this.bufferLength = 0;

    // Current emotional storytelling phase (1 to 6)
    this.currentPhase = 1;

    // Animation frame handle
    this.rafId = null;
    this.isAnalyzing = false;

    // Fallback synth state if local mp3 is missing
    this.isSyntheticFallback = false;
    this.synthOsc1 = null;
    this.synthOsc2 = null;
    this.synthGain = null;
  }

  /**
   * Initializes Web Audio Context connected to the given HTMLAudioElement
   */
  initContext(audioElement) {
    if (this.isContextReady) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();

      // Analyser node configuration
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256; // 128 frequency bins
      this.analyser.smoothingTimeConstant = 0.85;

      this.bufferLength = this.analyser.frequencyBinCount;
      this.frequencyData = new Uint8Array(this.bufferLength);

      // Master Gain node for smooth volume manipulation & ducking
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(
        window.APP_CONFIG?.AUDIO?.DEFAULT_VOLUME || 0.7,
        this.audioCtx.currentTime
      );

      // Connect HTML Audio -> Gain -> Analyser -> Output Speakers
      try {
        this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);
        this.sourceNode.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      } catch (connErr) {
        // In case audio is already connected or cross-origin restricted
        console.warn("Direct MediaElementSource connection note:", connErr.message);
      }

      this.isContextReady = true;
      this.startAnalysisLoop();
    } catch (err) {
      console.warn("Web Audio API initialization notice:", err);
    }
  }

  /**
   * Resumes AudioContext if suspended by browser autoplay policy
   */
  async resumeContext() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      try {
        await this.audioCtx.resume();
      } catch (_) {}
    }
  }

  /**
   * Continuous real-time frequency analysis loop with Exponential Moving Average (EMA)
   */
  startAnalysisLoop() {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    const analyze = () => {
      this.rafId = requestAnimationFrame(analyze);

      if (!this.analyser || !this.frequencyData) {
        this.applyDefaultBreathing();
        return;
      }

      this.analyser.getByteFrequencyData(this.frequencyData);

      // 1. Bass band (bins 1 to 6: ~20Hz to 250Hz)
      let bassSum = 0;
      const bassCount = 6;
      for (let i = 1; i <= bassCount; i++) {
        bassSum += this.frequencyData[i];
      }
      const rawBass = bassSum / (bassCount * 255);

      // 2. Mid band (bins 7 to 30: ~250Hz to 2000Hz - vocals, melody, acoustic strings)
      let midSum = 0;
      const midCount = 24;
      for (let i = 7; i <= 30; i++) {
        midSum += this.frequencyData[i];
      }
      const rawMid = midSum / (midCount * 255);

      // 3. Treble band (bins 31 to 90: ~2000Hz to 8000Hz - chimes, shimmer, air)
      let trebleSum = 0;
      const trebleCount = 60;
      for (let i = 31; i <= 90; i++) {
        trebleSum += this.frequencyData[i];
      }
      const rawTreble = trebleSum / (trebleCount * 255);

      // 4. Combined energy
      const rawEnergy = rawBass * 0.45 + rawMid * 0.40 + rawTreble * 0.15;

      // Silky Exponential Moving Average (EMA) smoothing — eliminates harsh flutter
      const smoothFactor = 0.14;
      this.bass += (rawBass - this.bass) * smoothFactor;
      this.mid += (rawMid - this.mid) * smoothFactor;
      this.treble += (rawTreble - this.treble) * 0.10;
      this.energy += (rawEnergy - this.energy) * smoothFactor;

      // If audio is paused or near silent, decay gently to zero
      if (window.audioManager && !window.audioManager.isPlaying) {
        this.bass *= 0.94;
        this.mid *= 0.94;
        this.treble *= 0.94;
        this.energy *= 0.94;
      }

      this.publishCssTokens();
    };

    analyze();
  }

  /**
   * Subtle ambient breathing fallback when audio is initializing
   */
  applyDefaultBreathing() {
    const time = Date.now() * 0.0012;
    const wave = (Math.sin(time) + 1) * 0.5; // 0 to 1
    this.energy = 0.15 + wave * 0.12;
    this.bass = 0.12 + wave * 0.10;
    this.mid = 0.14 + Math.sin(time * 1.5) * 0.08;
    this.treble = 0.10 + Math.cos(time * 0.8) * 0.05;
    this.publishCssTokens();
  }

  /**
   * Publishes smoothed reactive values to CSS Custom Variables
   */
  publishCssTokens() {
    const root = document.documentElement;
    if (!root) return;

    // Normalizing ranges for subtle atmospheric reaction
    const energy = Math.max(0, Math.min(1, this.energy));
    const bass = Math.max(0, Math.min(1, this.bass));
    const mid = Math.max(0, Math.min(1, this.mid));

    // Dynamic glow radius (6px to 24px)
    const glowRadius = Math.round(6 + energy * 18);
    // Dynamic subtle card/element breathing scale (1.000 to 1.020)
    const dynamicScale = (1 + bass * 0.02).toFixed(4);

    root.style.setProperty("--music-energy", energy.toFixed(3));
    root.style.setProperty("--music-bass", bass.toFixed(3));
    root.style.setProperty("--music-mid", mid.toFixed(3));
    root.style.setProperty("--music-treble", this.treble.toFixed(3));
    root.style.setProperty("--music-glow-radius", `${glowRadius}px`);
    root.style.setProperty("--music-scale", dynamicScale);
  }

  /**
   * Sets the emotional storytelling phase (1 to 6)
   */
  setPhase(phaseNumber) {
    this.currentPhase = phaseNumber;
    document.documentElement.setAttribute("data-music-phase", String(phaseNumber));
  }

  /**
   * Starts an ambient acoustic synthesizer fallback if MP3 file is pending
   */
  startSyntheticFallback() {
    if (this.isSyntheticFallback || !this.audioCtx) return;
    try {
      this.isSyntheticFallback = true;
      const now = this.audioCtx.currentTime;

      // Soft root chord (D3 / A3 / F#4 - warm cinematic peaceful key)
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const synthGain = this.audioCtx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(146.83, now); // D3

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(220.00, now); // A3

      synthGain.gain.setValueAtTime(0.0001, now);
      synthGain.gain.exponentialRampToValueAtTime(0.12, now + 3);

      osc1.connect(synthGain);
      osc2.connect(synthGain);

      if (this.gainNode) {
        synthGain.connect(this.gainNode);
      } else {
        synthGain.connect(this.audioCtx.destination);
      }

      osc1.start();
      osc2.start();

      this.synthOsc1 = osc1;
      this.synthOsc2 = osc2;
      this.synthGain = synthGain;
    } catch (_) {}
  }
}

class BirthdayAudioManager {
  constructor() {
    this.audio = null;
    this.engine = new MusicReactiveEngine();
    window.musicEngine = this.engine;

    this.isPlaying = false;
    this.isMuted = false;
    this.targetVolume = window.APP_CONFIG?.AUDIO?.DEFAULT_VOLUME || 0.70;
    this.currentVolume = this.targetVolume;
    this.hasUserStarted = false;

    // Track candidates (tried in order)
    this.trackCandidates = [
      window.APP_CONFIG?.AUDIO?.TRACK_SRC || "assets/audio/pavizha-mazha.mp3",
      "assets/music/pavizha-mazha.mp3",
      "assets/audio/bgm.mp3",
      "assets/music/bgm.mp3",
      "pavizha-mazha.mp3"
    ];
    this.candidateIndex = 0;

    // DOM controls
    this.toggleButton = null;
    this.soundWavePill = null;

    document.addEventListener("DOMContentLoaded", () => this.init());
  }

  /**
   * Initializes audio element and binds UI controls
   */
  init() {
    this.createAudioElement();
    this.setupUIControls();
  }

  /**
   * Creates and configures the persistent HTMLAudioElement
   */
  createAudioElement() {
    if (this.audio) return;

    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.audio.volume = this.currentVolume;
    this.audio.src = this.trackCandidates[this.candidateIndex];

    // Audio lifecycle events
    this.audio.addEventListener("play", () => {
      this.isPlaying = true;
      this.updateUI();
      this.engine.resumeContext();
    });

    this.audio.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updateUI();
    });

    this.audio.addEventListener("ended", () => {
      // Loop seamlessly
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
    });

    // Handle track loading fallback
    this.audio.addEventListener("error", () => {
      this.handleTrackLoadError();
    });
  }

  /**
   * Tries subsequent candidate audio paths if one fails
   */
  handleTrackLoadError() {
    this.candidateIndex++;
    if (this.candidateIndex < this.trackCandidates.length) {
      const nextSrc = this.trackCandidates[this.candidateIndex];
      if (this.audio) {
        this.audio.src = nextSrc;
        if (this.hasUserStarted) {
          this.audio.play().catch(() => {});
        }
      }
    } else {
      console.info(
        "💡 Note: 'pavizha-mazha.mp3' not yet detected on disk.\n" +
        "Place your audio file in 'public/assets/audio/pavizha-mazha.mp3'.\n" +
        "Activating gentle ambient audio & reactive atmospheric engine."
      );
      if (this.hasUserStarted) {
        this.engine.startSyntheticFallback();
        this.isPlaying = true;
        this.updateUI();
      }
    }
  }

  /**
   * Mounts the floating music controller pill in the top-right corner
   */
  setupUIControls() {
    this.toggleButton = document.getElementById("music-toggle-btn");
    if (!this.toggleButton) {
      // Create sleek floating pill dynamically if not already in DOM
      const btn = document.createElement("button");
      btn.id = "music-toggle-btn";
      btn.className = "music-floating-pill";
      btn.setAttribute("type", "button");
      btn.setAttribute("aria-label", "Toggle background melody");
      btn.setAttribute("title", "Pavizha Mazha — Athiran (Click to pause/play or mute)");
      btn.innerHTML = `
        <span class="music-wave-bars">
          <span class="bar bar-1"></span>
          <span class="bar bar-2"></span>
          <span class="bar bar-3"></span>
        </span>
        <span class="music-icon-symbol">🎵</span>
      `;
      document.body.appendChild(btn);
      this.toggleButton = btn;
    }

    this.toggleButton.addEventListener("click", () => {
      this.togglePlayOrMute();
    });

    this.updateUI();
  }

  /**
   * Starts the background song when the user clicks "Let's begin ✨"
   */
  startMusicOnUserGesture() {
    this.hasUserStarted = true;

    if (this.audio) {
      // 1. Immediately trigger audio.play() synchronously to capture mobile user interaction token!
      try {
        this.audio.volume = 0.05;
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.isPlaying = true;
              this.fadeVolume(this.targetVolume, 1800);
              this.updateUI();
            })
            .catch((err) => {
              console.warn("Audio play notice on mobile:", err.message);
              this.engine.startSyntheticFallback();
              this.isPlaying = true;
              this.updateUI();
            });
        }
      } catch (err) {
        console.warn("Direct play exception:", err);
        this.engine.startSyntheticFallback();
        this.isPlaying = true;
        this.updateUI();
      }

      // 2. Initialize Web Audio Context
      try {
        this.engine.initContext(this.audio);
        this.engine.resumeContext();
      } catch (_) {}
    }

    this.updateUI();
  }

  /**
   * Resets audio to the start (0:00) when user clicks "Replay the magic ↺"
   */
  resetToBeginning() {
    if (this.audio) {
      try {
        this.audio.currentTime = 0;
        if (!this.audio.paused) {
          this.audio.play().catch(() => {});
        }
      } catch (_) {}
    }
    this.engine.setPhase(1);
    this.restoreVolume();
  }

  /**
   * Toggle between play/pause or mute/unmute
   */
  async togglePlayOrMute() {
    if (!this.audio) return;

    await this.engine.resumeContext();

    if (!this.hasUserStarted) {
      // First click acts as beginning
      this.startMusicOnUserGesture();
      return;
    }

    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
    } else {
      try {
        await this.audio.play();
        this.isPlaying = true;
      } catch (_) {
        this.engine.startSyntheticFallback();
        this.isPlaying = true;
      }
    }

    this.updateUI();
  }

  /**
   * Ducks volume smoothly during intimate letters or important messages
   */
  duckVolume(durationMs = 600) {
    const duckedLevel = window.APP_CONFIG?.AUDIO?.DUCKED_VOLUME || 0.32;
    this.fadeVolume(duckedLevel, durationMs);
  }

  /**
   * Restores volume smoothly after message reading or scene transitions
   */
  restoreVolume(durationMs = 800) {
    const defaultLevel = window.APP_CONFIG?.AUDIO?.DEFAULT_VOLUME || 0.70;
    this.fadeVolume(defaultLevel, durationMs);
  }

  /**
   * Smooth volume interpolation over durationMs
   */
  fadeVolume(targetLevel, durationMs = 600) {
    const clampedTarget = Math.max(0, Math.min(1, targetLevel));
    this.targetVolume = clampedTarget;

    if (this.engine.gainNode && this.engine.audioCtx) {
      try {
        const now = this.engine.audioCtx.currentTime;
        this.engine.gainNode.gain.cancelScheduledValues(now);
        this.engine.gainNode.gain.setTargetAtTime(clampedTarget, now, durationMs / 2000);
      } catch (_) {}
    }

    // Also smoothly transition HTMLAudioElement volume
    if (!this.audio) return;
    const startVolume = this.audio.volume;
    const startTime = performance.now();

    const ramp = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress; // easeInOutQuad

      this.audio.volume = Math.max(0, Math.min(1, startVolume + (clampedTarget - startVolume) * ease));

      if (progress < 1) {
        requestAnimationFrame(ramp);
      } else {
        this.audio.volume = clampedTarget;
      }
    };

    requestAnimationFrame(ramp);
  }

  /**
   * Synchronizes floating control icons and active wave styling
   */
  updateUI() {
    if (!this.toggleButton) return;

    const iconSymbol = this.toggleButton.querySelector(".music-icon-symbol");

    if (this.isPlaying) {
      this.toggleButton.classList.add("playing");
      this.toggleButton.classList.remove("paused");
      this.toggleButton.setAttribute("aria-label", "Pause background music");
      if (iconSymbol) iconSymbol.textContent = "🔊";
    } else {
      this.toggleButton.classList.remove("playing");
      this.toggleButton.classList.add("paused");
      this.toggleButton.setAttribute("aria-label", "Play background music");
      if (iconSymbol) iconSymbol.textContent = "🔇";
    }
  }
}

// Instantiate global audio controller
window.audioManager = new BirthdayAudioManager();
