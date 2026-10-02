/**
 * Interactive Birthday Candle & Microphone Blowing System
 * 
 * Features:
 * - Method 1: Microphone blowing detection (AudioContext, FFT analysis of breath turbulence).
 *   Strict Privacy: 100% processed locally in memory. Zero recording, zero storage, zero upload.
 *   Immediate stream track shutdown upon candle extinction.
 * - Method 2: Tap the candle ("Or tap the candle ✨") - Instant fallback.
 * - Visual breath sensitivity meter.
 * - Flame extinguish animation, smoke plume, floating embers, and celestial brightening.
 */

class CandleBlower {
  constructor(options = {}) {
    this.candleElement = document.getElementById("birthday-candle");
    this.flameElement = document.getElementById("candle-flame");
    this.smokeElement = document.getElementById("candle-smoke");
    this.micButton = document.getElementById("mic-request-btn");
    this.micStatus = document.getElementById("mic-status-badge");
    this.breathMeter = document.getElementById("breath-meter-fill");
    this.tapPrompt = document.getElementById("candle-tap-hint");
    this.cakeMessage = document.getElementById("cake-status-message");

    this.onExtinguished = options.onExtinguished || (() => {});

    this.isExtinguished = false;
    this.isListening = false;
    this.audioContext = null;
    this.analyser = null;
    this.microphoneStream = null;
    this.rafId = null;

    // Breath detection tuning
    this.sustainedBlowingDuration = 0;
    this.REQUIRED_BLOW_MS = 360; // ~360ms of continuous breath
    this.lastFrameTime = performance.now();

    this.init();
  }

  init() {
    // 1. Direct Tap on Candle (Method 2 - Always active)
    if (this.candleElement) {
      this.candleElement.addEventListener("click", () => {
        if (!this.isExtinguished) {
          this.extinguishCandle("tap");
        }
      });
      // Accessible keyboard support
      this.candleElement.addEventListener("keydown", (e) => {
        if ((e.key === "Enter" || e.key === " ") && !this.isExtinguished) {
          e.preventDefault();
          this.extinguishCandle("keyboard");
        }
      });
    }

    // 2. Microphone Activation Button (Method 1)
    if (this.micButton) {
      this.micButton.addEventListener("click", () => {
        this.requestMicrophoneAccess();
      });
    }
  }

  /**
   * Method 1: Request Microphone Access with explicit consent
   */
  async requestMicrophoneAccess() {
    if (this.isExtinguished || this.isListening) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.updateMicStatus("Microphone not supported on this browser. You can tap the candle! ✨", "warning");
      return;
    }

    try {
      this.updateMicStatus("Listening for your breath... Blow gently! 💨", "active");
      if (this.micButton) {
        this.micButton.style.display = "none";
      }

      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false, // Keep breath turbulence audible to analyser
          autoGainControl: false
        }
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.microphoneStream);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);

      this.isListening = true;
      this.lastFrameTime = performance.now();
      this.detectBlowingLoop();
    } catch (err) {
      console.warn("Microphone access declined or unavailable:", err);
      this.updateMicStatus("Microphone unavailable. Tap the candle to blow it out! ✨", "warning");
      if (this.micButton) {
        this.micButton.style.display = "none";
      }
    }
  }

  detectBlowingLoop() {
    if (!this.isListening || this.isExtinguished) return;

    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate energy in lower & mid frequencies typical of breath wind against mic (60Hz - 800Hz)
    // At sampleRate 44100/48000 and fftSize 512, each bin is ~90Hz. Bins 1 to 9 capture ~90 - 850 Hz.
    let lowEnergySum = 0;
    const binCount = Math.min(10, dataArray.length);
    for (let i = 1; i < binCount; i++) {
      lowEnergySum += dataArray[i];
    }
    const averageEnergy = lowEnergySum / (binCount - 1);

    // Threshold for authentic puff of air
    const BLOW_ENERGY_THRESHOLD = 52;

    // Update live breath sensitivity meter UI
    const meterPercent = Math.min(100, (averageEnergy / BLOW_ENERGY_THRESHOLD) * 100);
    if (this.breathMeter) {
      this.breathMeter.style.width = `${meterPercent}%`;
    }

    if (averageEnergy > BLOW_ENERGY_THRESHOLD) {
      this.sustainedBlowingDuration += dt;
      // Flame flickers vigorously under breath
      if (this.flameElement) {
        this.flameElement.style.transform = `scale(${Math.max(0.4, 1.2 - (this.sustainedBlowingDuration / this.REQUIRED_BLOW_MS))}) skewX(${Math.random() * 20 - 10}deg)`;
      }

      if (this.sustainedBlowingDuration >= this.REQUIRED_BLOW_MS) {
        this.extinguishCandle("breath");
        return;
      }
    } else {
      // Decay sustained duration gently
      this.sustainedBlowingDuration = Math.max(0, this.sustainedBlowingDuration - dt * 1.5);
      if (this.flameElement) {
        this.flameElement.style.transform = "";
      }
    }

    this.rafId = requestAnimationFrame(() => this.detectBlowingLoop());
  }

  /**
   * Extinguishes the candle, stops the microphone immediately,
   * runs smoke/ember animations and triggers callback.
   */
  extinguishCandle(method = "tap") {
    if (this.isExtinguished) return;
    this.isExtinguished = true;

    // Immediately stop microphone & release audio track resources
    this.stopMicrophone();

    // Visual Flame Extinguish
    if (this.flameElement) {
      this.flameElement.classList.add("extinguished");
    }

    // Trigger curling smoke plume
    if (this.smokeElement) {
      this.smokeElement.classList.add("active");
    }

    // Candle body update
    if (this.candleElement) {
      this.candleElement.classList.add("blown");
    }

    // Hide tap prompt and mic UI
    if (this.tapPrompt) {
      this.tapPrompt.style.opacity = "0";
    }
    if (this.micStatus) {
      this.micStatus.style.display = "none";
    }

    // Display poetic transition message
    if (this.cakeMessage) {
      this.cakeMessage.innerHTML = `
        <span class="magic-sparkle-text">Your wishes are on their way... ✨</span>
      `;
      this.cakeMessage.classList.add("revealed");
    }

    // Trigger embers in the sky background if celestial system exists
    if (window.celestialSky && this.candleElement) {
      const rect = this.candleElement.getBoundingClientRect();
      window.celestialSky.burstCandleEmbers(rect.left + rect.width / 2, rect.top);
      window.celestialSky.targetSkyLuminescence = 0.55; // Peak magical sky luminescence
    }

    // Subtle haptic pattern for candle blow
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate([40, 60, 80]); } catch (_) {}
    }

    // Fire callback
    if (typeof this.onExtinguished === "function") {
      setTimeout(() => {
        this.onExtinguished(method);
      }, 1400);
    }
  }

  stopMicrophone() {
    this.isListening = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => {
        try { track.stop(); } catch (_) {}
      });
      this.microphoneStream = null;
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      try { this.audioContext.close(); } catch (_) {}
      this.audioContext = null;
    }
  }

  updateMicStatus(message, type = "info") {
    if (!this.micStatus) return;
    this.micStatus.textContent = message;
    this.micStatus.className = `mic-status-badge ${type}`;
    this.micStatus.style.display = "inline-flex";
  }
}

window.CandleBlower = CandleBlower;
