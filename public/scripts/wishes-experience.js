/**
 * ==============================================================================
 * SCENE 8: THE WISHES INTERACTIVE ORCHESTRATOR
 * ==============================================================================
 * 
 * Features:
 * - 15 floating 3D wish-balls with organic physics, glowing halos & depth layers.
 * - Soft pop animation, pentatonic Web Audio bell chimes, and stardust sparkle bursts.
 * - Progressive atmosphere evolution (deepening cosmic night, slower drift for final balls).
 * - Serene mystery pause: "That's all the wishes..." -> "...or is it?"
 * - Cinematic Magic Lamp entrance with converging stardust particles.
 * - Multi-touch/mouse interactive rubbing with vibration, smoke wisps & harmonic hum.
 * - Billowing magical smoke mist & Charming Magical Genie reveal.
 * - Moving graphic glowing wish orb flight from genie to center.
 * - Grand final wish card: "May you always have something beautiful to look forward to." -> "Happy Birthday ❤️".
 * - Seamless transition into Scene 9 (Cake & Candle).
 */

class WishesExperience {
  constructor(options = {}) {
    this.container = document.getElementById("scene-8");
    this.arena = document.getElementById("wishes-balls-arena");
    this.canvas = document.getElementById("wishes-particle-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.onComplete = options.onComplete || (() => {});

    // Audio synthesizer for self-contained celestial sound effects
    this.audioCtx = null;
    this.initAudioContext();

    // Wishes list
    this.wishesList = [
      "May this year bring you more happiness than you expect.",
      "May every little dream of yours find its way to you.",
      "I hope you always have a reason to smile.",
      "May this year give you beautiful moments worth remembering.",
      "May life surprise you with more good things than you imagined.",
      "May you always find happiness in the little things.",
      "May your best memories still be waiting for you.",
      "May this year be kinder to you than the last.",
      "May every new chapter bring something beautiful.",
      "May peace and warmth surround you wherever you go.",
      "May you always feel cherished and valued.",
      "May laughter follow your every step.",
      "May your courage always shine brighter than your doubts.",
      "May the stars always guide you home to joy.",
      "May you never forget how special you truly are."
    ];

    this.totalBalls = this.wishesList.length;
    this.remainingBalls = this.totalBalls;
    this.balls = [];
    this.particles = [];
    this.isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.isLowPower = (navigator.hardwareConcurrency || 4) < 4;

    // Lamp rubbing state
    this.rubProgress = 0;
    this.isRubbing = false;
    this.lastTouchPos = null;
    this.rubThreshold = 180; // Total pixel delta required to awaken genie
    this.accumulatedRubDelta = 0;
    this.genieAwakened = false;

    // Animation frame handle
    this.rafId = null;

    // Elements
    this.revealedWishBanner = document.getElementById("revealed-wish-card");
    this.revealedWishQuote = document.getElementById("revealed-wish-quote");
    this.counterBadge = document.getElementById("wishes-counter-pill");
    this.counterText = document.getElementById("wishes-remaining-count");
    this.mysteryPauseOverlay = document.getElementById("mystery-pause-overlay");
    this.mysteryPhraseText = document.getElementById("mystery-phrase-text");
    this.magicLampStage = document.getElementById("magic-lamp-stage");
    this.lampArtworkAssembly = document.getElementById("lamp-artwork-assembly");
    this.lampRubFill = document.getElementById("lamp-rub-progress-fill");
    this.magicSmokeCloud = document.getElementById("magic-smoke-cloud");
    this.genieCharacterStage = document.getElementById("genie-character-stage");
    this.genieSpeechBox = document.getElementById("genie-speech-box");
    this.genieDialoguePhrase = document.getElementById("genie-dialogue-phrase");
    this.magicalFlightOrb = document.getElementById("magical-flight-orb");
    this.finalWishCardStage = document.getElementById("final-wish-card-stage");
    this.finalWishHeart = document.getElementById("final-wish-hbd-heart");
    this.atmosphereTint = document.getElementById("wishes-atmosphere-tint");
    this.btnProceedCake = document.getElementById("btn-proceed-cake");

    this.wishBannerTimer = null;
  }

  /* ----------------------------------------------------
   * WEB AUDIO SOUND EFFECTS (SELF-CONTAINED)
   * ---------------------------------------------------- */
  initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (_) {}
  }

  ensureAudioReady() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
  }

  // Soft pentatonic bell chime on ball pop
  playPopChime(ballIndex = 0) {
    if (!this.audioCtx) return;
    this.ensureAudioReady();

    try {
      const frequencies = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
      const baseFreq = frequencies[ballIndex % frequencies.length];

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      // Gentle pitch micro-bend upwards
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.02, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.85);

      // Add soft crystalline shimmer overtone
      const chimeOsc = this.audioCtx.createOscillator();
      const chimeGain = this.audioCtx.createGain();
      chimeOsc.type = "triangle";
      chimeOsc.frequency.setValueAtTime(baseFreq * 2.75, now);
      chimeGain.gain.setValueAtTime(0.001, now);
      chimeGain.gain.linearRampToValueAtTime(0.05, now + 0.03);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.audioCtx.destination);
      chimeOsc.start(now);
      chimeOsc.stop(now + 0.6);
    } catch (_) {}
  }

  // Ethereal rising hum while rubbing the magic lamp
  playRubHum(progress) {
    if (!this.audioCtx) return;
    this.ensureAudioReady();

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Pitch rises from 220Hz to 440Hz as rubbing progresses
      const startFreq = 220 + progress * 220;
      osc.type = "sine";
      osc.frequency.setValueAtTime(startFreq, now);

      gain.gain.setValueAtTime(0.02 + progress * 0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (_) {}
  }

  // Majestic chime chord when the genie appears
  playGenieChord() {
    if (!this.audioCtx) return;
    this.ensureAudioReady();

    try {
      const now = this.audioCtx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A major 9th chord

      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.8);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 1.8);
      });
    } catch (_) {}
  }

  // Starlight flight whoosh sound
  playOrbFlightSound() {
    if (!this.audioCtx) return;
    this.ensureAudioReady();

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.8);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (_) {}
  }

  /* ----------------------------------------------------
   * LIFECYCLE: MOUNT & INITIALIZE
   * ---------------------------------------------------- */
  start() {
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas(), { passive: true });

    // Reset state
    this.remainingBalls = this.totalBalls;
    this.rubProgress = 0;
    this.genieAwakened = false;
    this.updateCounter();

    // Populate the 15 floating balls
    this.spawnWishBalls();

    // Start canvas particle physics loop
    this.startParticleLoop();

    // Bind Lamp rubbing interactions
    this.bindLampRubEvents();

    // Bind Proceed button
    if (this.btnProceedCake) {
      this.btnProceedCake.addEventListener("click", () => {
        if (typeof this.onComplete === "function") {
          this.onComplete();
        }
      });
    }
  }

  resizeCanvas() {
    if (!this.canvas || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  /* ----------------------------------------------------
   * FLOATING BALLS GENERATION & SPAWN
   * ---------------------------------------------------- */
  spawnWishBalls() {
    if (!this.arena) return;
    this.arena.innerHTML = "";
    this.balls = [];

    const themes = ["gold", "lavender", "rose", "pearl", "starlight"];
    const layers = ["layer-bg", "layer-mid", "layer-fg"];
    const animations = ["floatPath1", "floatPath2", "floatPath3", "floatPath4", "floatPath5", "floatPath6"];

    // Naturally distributed coordinate grid across arena (percentages)
    // Structured so balls spread evenly on mobile without overlaps
    const positions = [
      { left: 12, top: 10 },
      { left: 45, top: 6 },
      { left: 78, top: 12 },
      { left: 28, top: 22 },
      { left: 62, top: 24 },
      { left: 8, top: 36 },
      { left: 82, top: 38 },
      { left: 42, top: 44 },
      { left: 20, top: 54 },
      { left: 72, top: 56 },
      { left: 12, top: 72 },
      { left: 48, top: 74 },
      { left: 80, top: 76 },
      { left: 32, top: 86 },
      { left: 66, top: 88 }
    ];

    // Shuffle wishes so discovery order feels organic
    const shuffledWishes = [...this.wishesList].sort(() => Math.random() - 0.5);

    positions.forEach((pos, idx) => {
      const ballEl = document.createElement("div");
      const theme = themes[idx % themes.length];
      const layer = layers[idx % layers.length];
      const animName = animations[idx % animations.length];

      // Dynamic size variations (48px to 70px)
      const sizePx = layer === "layer-bg" ? 48 : (layer === "layer-fg" ? 66 : 56);
      const floatDuration = (5.5 + (idx % 4) * 0.8).toFixed(1);
      const floatDelay = (idx * 0.35).toFixed(1);

      ballEl.className = `wish-ball-item theme-${theme} ${layer}`;
      ballEl.id = `wish-ball-${idx}`;
      ballEl.style.width = `${sizePx}px`;
      ballEl.style.height = `${sizePx}px`;
      ballEl.style.left = `${pos.left}%`;
      ballEl.style.top = `${pos.top}%`;
      ballEl.style.animation = `${animName} ${floatDuration}s ease-in-out infinite ${floatDelay}s`;
      ballEl.setAttribute("role", "button");
      ballEl.setAttribute("tabindex", "0");
      ballEl.setAttribute("aria-label", "Birthday wish ball. Tap to discover wish.");

      ballEl.innerHTML = `
        <div class="wish-ball-sphere">
          <div class="wish-ball-gloss"></div>
          <div class="wish-ball-inner-sparkle">✦</div>
        </div>
        <div class="wish-ball-thread"></div>
      `;

      // Click & Touch tap handler
      const handlePop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.popBall(ballEl, idx, shuffledWishes[idx]);
      };

      ballEl.addEventListener("pointerdown", handlePop);

      this.arena.appendChild(ballEl);
      this.balls.push({ element: ballEl, popped: false, wish: shuffledWishes[idx] });
    });
  }

  /* ----------------------------------------------------
   * BALL POPPING & WISH DISCOVERY
   * ---------------------------------------------------- */
  popBall(ballEl, index, wishText) {
    if (ballEl.classList.contains("popping")) return;
    ballEl.classList.add("popping");

    // Play sweet pentatonic bell chime
    this.playPopChime(index);

    // Haptic feedback for tactile satisfaction on mobile
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }

    // Spawn sparkling stardust burst on canvas at ball location
    const rect = ballEl.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const cx = rect.left - containerRect.left + rect.width / 2;
    const cy = rect.top - containerRect.top + rect.height / 2;
    this.spawnSparkleBurst(cx, cy);

    // Also trigger celestial sky ripple if available
    if (window.celestialSky) {
      window.celestialSky.interactiveRipples.push({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        radius: 8,
        maxRadius: 65,
        alpha: 0.85,
        color: "245, 199, 103"
      });
    }

    // Decrement remaining count
    this.remainingBalls--;
    this.updateCounter();

    // Display revealed wish banner
    this.showWishBanner(wishText);

    // Progressive Atmosphere Adjustments
    this.handleProgressiveAtmosphere();

    // Remove element from DOM after burst animation
    setTimeout(() => {
      if (ballEl.parentNode) {
        ballEl.parentNode.removeChild(ballEl);
      }
    }, 450);

    // Check if that was the final ball!
    if (this.remainingBalls === 0) {
      this.onAllBallsPopped();
    }
  }

  updateCounter() {
    if (this.counterText) {
      this.counterText.textContent = `${this.remainingBalls} wishes remain`;
    }
  }

  showWishBanner(text) {
    if (!this.revealedWishBanner || !this.revealedWishQuote) return;

    if (this.wishBannerTimer) {
      clearTimeout(this.wishBannerTimer);
    }

    this.revealedWishQuote.textContent = `“${text}”`;
    this.revealedWishBanner.classList.add("visible");

    // Auto-hide after 3.8s if no new ball popped
    this.wishBannerTimer = setTimeout(() => {
      this.revealedWishBanner.classList.remove("visible");
    }, 3800);
  }

  /* ----------------------------------------------------
   * PROGRESSIVE DISCOVERY ATMOSPHERE
   * ---------------------------------------------------- */
  handleProgressiveAtmosphere() {
    // Halfway mark (<= 7 remaining): atmosphere deepens, more stardust
    if (this.remainingBalls <= 7 && this.atmosphereTint) {
      this.atmosphereTint.classList.add("deep-magic");
      // Add subtle ambient sparkles
      this.spawnAmbientSparkles(8);
    }

    // Near the end (<= 3 remaining): slow remaining balls slightly, boost glow
    if (this.remainingBalls <= 3) {
      const remainingEls = this.arena.querySelectorAll(".wish-ball-item:not(.popping)");
      remainingEls.forEach((el) => {
        el.style.animationDuration = "7.5s";
        const sphere = el.querySelector(".wish-ball-sphere");
        if (sphere) {
          sphere.style.boxShadow = "0 0 28px rgba(245, 199, 103, 0.85), inset 0 0 10px #ffffff";
        }
      });
    }
  }

  /* ----------------------------------------------------
   * MYSTERY PAUSE: "That's all the wishes..." -> "...or is it?"
   * ---------------------------------------------------- */
  onAllBallsPopped() {
    // Hide top banner and counter
    if (this.revealedWishBanner) this.revealedWishBanner.classList.remove("visible");
    if (this.counterBadge) this.counterBadge.style.opacity = "0";

    // Pause for 1.2s before the mystery text
    setTimeout(() => {
      if (this.mysteryPauseOverlay && this.mysteryPhraseText) {
        this.mysteryPauseOverlay.classList.add("active");
        this.mysteryPhraseText.textContent = "That's all the wishes...";
        this.mysteryPhraseText.classList.add("visible");

        // Subtle music volume dip for quiet anticipation
        if (window.audioManager) {
          window.audioManager.duckVolume(800);
        }

        // Pause 2.2s, then "...or is it?"
        setTimeout(() => {
          this.mysteryPhraseText.classList.remove("visible");

          setTimeout(() => {
            this.mysteryPhraseText.textContent = "...or is it?";
            this.mysteryPhraseText.classList.add("visible");

            // Pause 2s, then introduce the Magic Lamp!
            setTimeout(() => {
              this.mysteryPauseOverlay.classList.remove("active");
              this.revealMagicLamp();
            }, 2000);
          }, 600);
        }, 2200);
      } else {
        this.revealMagicLamp();
      }
    }, 1200);
  }

  /* ----------------------------------------------------
   * MAGIC LAMP ENTRANCE & MATERIALIZATION
   * ---------------------------------------------------- */
  revealMagicLamp() {
    // 1. Swirl converging golden particles into the center of the screen
    const containerRect = this.container.getBoundingClientRect();
    const cx = containerRect.width / 2;
    const cy = containerRect.height / 2;
    this.spawnConvergingParticles(cx, cy);

    // 2. Materialize the Lamp stage smoothly
    setTimeout(() => {
      if (this.magicLampStage) {
        this.magicLampStage.classList.add("visible");
      }
      // Restore music volume smoothly
      if (window.audioManager) {
        window.audioManager.restoreVolume(1000);
      }
    }, 1000);
  }

  /* ----------------------------------------------------
   * INTERACTIVE LAMP RUBBING
   * ---------------------------------------------------- */
  bindLampRubEvents() {
    if (!this.lampArtworkAssembly) return;

    const el = this.lampArtworkAssembly;

    const startRub = (clientX, clientY) => {
      if (this.genieAwakened) return;
      this.isRubbing = true;
      this.lastTouchPos = { x: clientX, y: clientY };
      el.classList.add("rubbing");
    };

    const moveRub = (clientX, clientY) => {
      if (!this.isRubbing || this.genieAwakened || !this.lastTouchPos) return;

      const dx = clientX - this.lastTouchPos.x;
      const dy = clientY - this.lastTouchPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 6) {
        this.accumulatedRubDelta += dist;
        this.lastTouchPos = { x: clientX, y: clientY };

        // Calculate progress (0.0 to 1.0)
        this.rubProgress = Math.min(1.0, this.accumulatedRubDelta / this.rubThreshold);

        if (this.lampRubFill) {
          this.lampRubFill.style.width = `${Math.round(this.rubProgress * 100)}%`;
        }

        // Play harmonic hum
        this.playRubHum(this.rubProgress);

        // Haptic pulse on mobile
        if (navigator.vibrate) {
          navigator.vibrate(15);
        }

        // Spray sparks from lamp spout
        this.spawnSpoutEmbers();

        // Check if fully rubbed!
        if (this.rubProgress >= 1.0) {
          this.endRub();
          this.triggerGenieReveal();
        }
      }
    };

    const endRub = () => {
      this.isRubbing = false;
      this.lastTouchPos = null;
      el.classList.remove("rubbing");
    };

    // Touch events for mobile
    el.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      startRub(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!this.isRubbing) return;
      const t = e.touches[0];
      moveRub(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener("touchend", endRub, { passive: true });

    // Pointer / Mouse events for desktop & tablets
    el.addEventListener("pointerdown", (e) => {
      startRub(e.clientX, e.clientY);
    });

    window.addEventListener("pointermove", (e) => {
      if (!this.isRubbing) return;
      moveRub(e.clientX, e.clientY);
    });

    window.addEventListener("pointerup", endRub);

    // Click fallback: clicking lamp also adds rubbing progress
    el.addEventListener("click", () => {
      if (this.genieAwakened) return;
      this.accumulatedRubDelta += 45;
      this.rubProgress = Math.min(1.0, this.accumulatedRubDelta / this.rubThreshold);
      if (this.lampRubFill) {
        this.lampRubFill.style.width = `${Math.round(this.rubProgress * 100)}%`;
      }
      this.playRubHum(this.rubProgress);
      this.spawnSpoutEmbers();
      if (this.rubProgress >= 1.0) {
        this.triggerGenieReveal();
      }
    });
  }

  spawnSpoutEmbers() {
    if (!this.container) return;
    const containerRect = this.container.getBoundingClientRect();
    const spoutX = containerRect.width / 2 - 50;
    const spoutY = containerRect.height / 2 - 20;

    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: spoutX + (Math.random() - 0.5) * 14,
        y: spoutY + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.75) * 3,
        vy: -Math.random() * 4 - 1.5,
        radius: Math.random() * 3.5 + 1.8,
        alpha: 1,
        decay: Math.random() * 0.035 + 0.018,
        color: ["#00d2ff", "#38bdf8", "#f5c767", "#ffffff"][Math.floor(Math.random() * 4)]
      });
    }
  }

  /* ----------------------------------------------------
   * GENIE REVEAL SEQUENCE (CARTOON BLUE SMOKE & GENIE WITH NOTE)
   * ---------------------------------------------------- */
  triggerGenieReveal() {
    if (this.genieAwakened) return;
    this.genieAwakened = true;

    // 1. Lamp flashes with golden starlight & rumble settles
    if (this.lampArtworkAssembly) {
      this.lampArtworkAssembly.style.filter = "brightness(1.9) drop-shadow(0 0 45px #00d2ff)";
    }

    // 2. Swirling Cartoon Blue Smoke clouds billow upwards
    if (this.magicSmokeCloud) {
      this.magicSmokeCloud.classList.add("active");
    }

    // Spawn rich cartoon blue smoke billows on canvas
    const containerRect = this.container.getBoundingClientRect();
    const cx = containerRect.width / 2;
    const cy = containerRect.height / 2;
    for (let i = 0; i < 35; i++) {
      const angle = (Math.PI * 2 * i) / 35;
      this.particles.push({
        x: cx - 40 + (Math.random() - 0.5) * 40,
        y: cy + 30 + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * (Math.random() * 2.5 + 1),
        vy: -Math.random() * 4.5 - 2, // billow upward
        radius: Math.random() * 7 + 3.5,
        alpha: 0.9,
        decay: 0.012,
        color: ["#00d2ff", "#38bdf8", "#818cf8", "#ffffff"][Math.floor(Math.random() * 4)]
      });
    }

    // 3. Play majestic chime chord
    this.playGenieChord();

    // 4. Fade in Charming Magical Genie out of the blue smoke
    setTimeout(() => {
      // Hide lamp gently behind the smoke
      if (this.magicLampStage) {
        this.magicLampStage.style.opacity = "0.35";
        this.magicLampStage.style.transform = "scale(0.85)";
      }

      if (this.genieCharacterStage) {
        this.genieCharacterStage.classList.add("visible");
      }

      // 5. Genie holds up note and speaks: "You missed one wish."
      setTimeout(() => {
        this.deliverGenieDialogue();
      }, 1200);
    }, 1000);
  }

  deliverGenieDialogue() {
    if (!this.genieDialoguePhrase) return;

    this.genieDialoguePhrase.style.opacity = "0";
    setTimeout(() => {
      this.genieDialoguePhrase.textContent = "“You missed one wish.”";
      this.genieDialoguePhrase.style.opacity = "1";

      // Pause 2.2s, then "This one's from me."
      setTimeout(() => {
        this.genieDialoguePhrase.style.opacity = "0";
        setTimeout(() => {
          this.genieDialoguePhrase.textContent = "“This one's from me.”";
          this.genieDialoguePhrase.style.opacity = "1";

          // Pause 1.8s, then launch the Glowing Wish Orb!
          setTimeout(() => {
            this.launchWishOrbFlight();
          }, 1800);
        }, 400);
      }, 2200);
    }, 300);
  }

  /* ----------------------------------------------------
   * GLOWING WISH ORB FLIGHT & FINAL WISH REVEAL
   * ---------------------------------------------------- */
  launchWishOrbFlight() {
    if (!this.magicalFlightOrb || !this.container) return;

    const containerRect = this.container.getBoundingClientRect();
    // Start at the illuminated scroll note held by the genie
    const startX = containerRect.width / 2 - 35;
    const startY = containerRect.height / 2 - 30;
    // Destination: center of the scene
    const targetX = containerRect.width / 2;
    const targetY = containerRect.height / 2 - 10;

    this.magicalFlightOrb.style.left = `${startX - 24}px`;
    this.magicalFlightOrb.style.top = `${startY - 24}px`;
    this.magicalFlightOrb.classList.add("active");

    this.playOrbFlightSound();

    const startTime = performance.now();
    const flightDuration = 1400; // ms

    const animateOrb = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / flightDuration);
      // Smooth easeInOutCubic
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentX = startX + (targetX - startX) * ease;
      const currentY = startY + (targetY - startY) * ease - Math.sin(progress * Math.PI) * 35; // Gentle arc

      this.magicalFlightOrb.style.left = `${currentX - 24}px`;
      this.magicalFlightOrb.style.top = `${currentY - 24}px`;

      // Leave stardust particle trail
      this.particles.push({
        x: currentX,
        y: currentY,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 3 + 1.5,
        alpha: 0.95,
        decay: 0.03,
        color: "#fff7d6"
      });

      if (progress < 1.0) {
        requestAnimationFrame(animateOrb);
      } else {
        // Orb reaches center: flash & expand!
        this.burstOrbIntoFinalWish(targetX, targetY);
      }
    };

    requestAnimationFrame(animateOrb);
  }

  burstOrbIntoFinalWish(x, y) {
    if (this.magicalFlightOrb) {
      this.magicalFlightOrb.style.transform = "scale(2.4)";
      this.magicalFlightOrb.style.opacity = "0";
      setTimeout(() => this.magicalFlightOrb.classList.remove("active"), 400);
    }

    // Burst 35 radiant golden & rose stardust particles
    for (let i = 0; i < 35; i++) {
      const angle = (Math.PI * 2 * i) / 35;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3.5 + 2,
        alpha: 1,
        decay: 0.02,
        color: Math.random() > 0.5 ? "#f5c767" : "#ff7597"
      });
    }

    // Fade Genie smoothly into particles as the final wish blooms
    if (this.genieCharacterStage) {
      this.genieCharacterStage.style.opacity = "0.2";
      this.genieCharacterStage.style.filter = "blur(4px)";
    }

    // Reveal the Final Grand Wish Card
    setTimeout(() => {
      if (this.finalWishCardStage) {
        this.finalWishCardStage.classList.add("visible");
      }

      // Pause 2s, then show "Happy Birthday ❤️"
      setTimeout(() => {
        if (this.finalWishHeart) {
          this.finalWishHeart.classList.add("visible");
        }
      }, 2000);
    }, 600);
  }

  /* ----------------------------------------------------
   * CANVAS REAL-TIME MOVING PARTICLES ENGINE
   * ---------------------------------------------------- */
  spawnSparkleBurst(cx, cy) {
    const count = this.isLowPower ? 12 : 22;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 1.2;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2.8 + 1.2,
        alpha: 1,
        decay: Math.random() * 0.025 + 0.015,
        color: ["#f5c767", "#ffffff", "#d0c3fc", "#fca5b9"][Math.floor(Math.random() * 4)]
      });
    }
  }

  spawnAmbientSparkles(count = 5) {
    if (!this.canvas) return;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -Math.random() * 1.2 - 0.4,
        radius: Math.random() * 2 + 1,
        alpha: 0.8,
        decay: 0.012,
        color: "#fff7d6"
      });
    }
  }

  spawnConvergingParticles(targetX, targetY) {
    if (!this.canvas) return;
    const count = this.isLowPower ? 16 : 30;
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = 0; i < count; i++) {
      // Spawn at edges
      const edge = Math.floor(Math.random() * 4);
      let sx = 0, sy = 0;
      if (edge === 0) { sx = Math.random() * w; sy = 0; }
      else if (edge === 1) { sx = w; sy = Math.random() * h; }
      else if (edge === 2) { sx = Math.random() * w; sy = h; }
      else { sx = 0; sy = Math.random() * h; }

      const angle = Math.atan2(targetY - sy, targetX - sx);
      const speed = Math.random() * 3.5 + 2.5;

      this.particles.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2.8 + 1.5,
        alpha: 0.95,
        decay: 0.015,
        color: "#f5c767"
      });
    }
  }

  startParticleLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);

    const loop = () => {
      this.rafId = requestAnimationFrame(loop);

      if (!this.ctx || !this.canvas) return;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
    };

    loop();
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.wishBannerTimer) clearTimeout(this.wishBannerTimer);
  }
}

// Attach globally
window.WishesExperience = WishesExperience;
