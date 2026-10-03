/**
 * Main Application Orchestrator for Sayandana's Magical Birthday Story
 * 
 * Manages scene transitions, progressive storytelling, character dialogues,
 * form validation, draft persistence, and secure backend submission.
 */

class BirthdayApp {
  constructor() {
    this.currentSceneIndex = 1;
    this.totalScenes = 15;

    // Wish text state
    this.wishes = {
      wish1: "",
      wish2: "",
      wish3: ""
    };

    // Subsystems
    this.sky = null;
    this.confetti = null;
    this.candleBlower = null;
    this.wishesExperience = null;

    // Guardian dialogue element
    this.guardianSpeech = null;
    this.isSubmitting = false;

    document.addEventListener("DOMContentLoaded", () => this.init());
  }

  init() {
    // 1. Initialize Celestial Background & Canvas systems
    this.sky = new CelestialSky("sky-canvas");
    window.celestialSky = this.sky;
    this.confetti = new BirthdayConfetti("confetti-canvas");

    // 2. Restore any unfinished draft wishes from sessionStorage
    this.restoreDraftWishes();

    // 3. Attach UI Scene Event Listeners
    this.bindEvents();

    // 4. Direct hash navigation support (e.g. #wishes, #cake, #memory, #envelope, #final for instant preview)
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === "#wishes" || hash === "#scene-8") {
        this.goToScene(8);
      } else if (hash === "#cake" || hash === "#scene-9") {
        this.goToScene(9);
      } else if (hash === "#memory" || hash === "#scene-13") {
        this.goToScene(13);
      } else if (hash === "#envelope" || hash === "#scene-14") {
        this.goToScene(14);
      } else if (hash === "#final" || hash === "#scene-15") {
        this.goToScene(15);
      }
    };

    window.addEventListener("hashchange", handleHash);

    const initialHash = window.location.hash.toLowerCase();
    if (initialHash === "#wishes" || initialHash === "#scene-8") {
      this.goToScene(8);
      return;
    } else if (initialHash === "#cake" || initialHash === "#scene-9") {
      this.goToScene(9);
      return;
    } else if (initialHash === "#memory" || initialHash === "#scene-13") {
      this.goToScene(13);
      return;
    } else if (initialHash === "#envelope" || initialHash === "#scene-14") {
      this.goToScene(14);
      return;
    } else if (initialHash === "#final" || initialHash === "#scene-15") {
      this.goToScene(15);
      return;
    }

    // 5. Start Scene 1 (Opening Screen with dark reveal)
    this.startOpeningScene();
  }

  /* ----------------------------------------------------
   * EVENT BINDINGS
   * ---------------------------------------------------- */
  bindEvents() {
    // Scene 1: Enter the magic
    const btnEnter = document.getElementById("btn-enter-magic");
    if (btnEnter) {
      btnEnter.addEventListener("click", () => {
        this.triggerHaptic(20);
        this.goToScene(2);
      });
    }

    // Scene 2: Birthday Reveal -> Flower Pop -> Fairy Tale Grove
    const btnBegin = document.getElementById("btn-reveal-begin");
    if (btnBegin) {
      btnBegin.addEventListener("click", () => {
        this.triggerHaptic([30, 40]);
        // Start background music smoothly on this first user interaction
        if (window.audioManager) {
          window.audioManager.startMusicOnUserGesture();
        }
        // Trigger flower pop, and after the pop of flowers, change to the fairy tale theme!
        this.playFlowerPopTransition(() => {
          this.goToScene(3);
        });
      });
    }

    // Scene 2: Interactive Avatar Sparkle Burst on Tap
    const avatarWrapper = document.getElementById("sayandana-animated-avatar");
    if (avatarWrapper) {
      avatarWrapper.addEventListener("click", (e) => {
        this.triggerHaptic([30, 30]);
        avatarWrapper.classList.add("sparkling");
        setTimeout(() => avatarWrapper.classList.remove("sparkling"), 1000);

        // Burst confetti or celestial ripples
        if (this.sky) {
          const rect = avatarWrapper.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              this.sky.interactiveRipples.push({
                x: cx + (Math.random() - 0.5) * 40,
                y: cy + (Math.random() - 0.5) * 40,
                radius: 6,
                maxRadius: 60 + i * 20,
                alpha: 0.9,
                color: "255, 182, 193" // Soft rose & gold
              });
            }, i * 120);
          }
        }
      });
    }

    // Scene 3: Wake the magic (Fairy flower interaction)
    const btnWakeLamp = document.getElementById("btn-wake-lamp");
    const fairyFlower = document.getElementById("interactive-fairy-flower");
    if (btnWakeLamp) {
      btnWakeLamp.addEventListener("click", () => this.wakeFairyBlossomAndProceed());
    }
    if (fairyFlower) {
      fairyFlower.addEventListener("click", () => this.wakeFairyBlossomAndProceed());
    }

    // Scene 4: Genie dialogue -> Proceed to Wish 1
    const btnStartWishes = document.getElementById("btn-start-wishes");
    if (btnStartWishes) {
      btnStartWishes.addEventListener("click", () => {
        this.triggerHaptic(20);
        this.goToScene(5);
      });
    }

    // Scene 5: Wish 1 Form
    this.setupWishForm(1, "wish1-input", "btn-submit-wish1", 6);

    // Scene 6: Wish 2 Form
    this.setupWishForm(2, "wish2-input", "btn-submit-wish2", 7);

    // Scene 7: Wish 3 Form -> Transitions to Scene 8 (The Wishes)
    this.setupWishForm(3, "wish3-input", "btn-submit-wish3", 8);

    // Scene 9 & 10: Initialize Candle Blower
    this.candleBlower = new CandleBlower({
      onExtinguished: (method) => {
        setTimeout(() => {
          this.goToScene(11); // Proceed to Finish button
        }, 1600);
      }
    });

    // Scene 11: Final Finish & Submit button
    const btnFinish = document.getElementById("btn-final-finish");
    if (btnFinish) {
      btnFinish.addEventListener("click", () => this.submitWishesToBackend());
    }

    // Scene 12: Success -> Continue to Friendship & Apology
    const btnContinueApology = document.getElementById("btn-continue-apology");
    if (btnContinueApology) {
      btnContinueApology.addEventListener("click", () => {
        this.triggerHaptic(20);
        this.goToScene(13);
      });
    }

    // Scene 13: Open Memory Letter
    const btnOpenMemory = document.getElementById("btn-open-memory-letter");
    const toggleMemory = document.getElementById("memory-letter-toggle");
    const unfoldedCard = document.getElementById("memory-unfolded-content");
    const closedHint = document.getElementById("memory-closed-hint");

    const openMemoryLetter = () => {
      this.triggerHaptic([30, 40]);
      if (unfoldedCard) {
        unfoldedCard.classList.add("visible");
      }
      if (btnOpenMemory) {
        btnOpenMemory.style.display = "none";
      }
      if (closedHint) {
        closedHint.style.display = "none";
      }
      if (toggleMemory) {
        toggleMemory.style.transform = "scale(0.85)";
        toggleMemory.style.opacity = "0.7";
      }

      // Smoothly lower music volume for intimate reading
      if (window.audioManager) {
        window.audioManager.duckVolume(600);
      }

      // Floating stardust ripple
      if (this.sky && toggleMemory) {
        const rect = toggleMemory.getBoundingClientRect();
        this.sky.interactiveRipples.push({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          radius: 10,
          maxRadius: 80,
          alpha: 0.9,
          color: "255, 234, 167"
        });
      }
    };

    if (btnOpenMemory) btnOpenMemory.addEventListener("click", openMemoryLetter);
    if (toggleMemory) toggleMemory.addEventListener("click", openMemoryLetter);

    // Scene 13: Friendship & Apology -> Continue to Creator Reveal
    const btnContinueReveal = document.getElementById("btn-continue-reveal");
    if (btnContinueReveal) {
      btnContinueReveal.addEventListener("click", () => {
        this.triggerHaptic(20);
        this.goToScene(14);
      });
    }

    // Scene 14: Interactive Wax-Sealed Envelope & 3 Returning Stars
    const envelope = document.getElementById("magical-envelope");
    const starsContainer = document.getElementById("stars-return-container");
    const starsMemoryText = document.getElementById("stars-memory-text");
    const finalPromptContainer = document.getElementById("final-wish-prompt-container");
    const btnToFinal = document.getElementById("btn-to-final-screen");

    if (envelope) {
      envelope.addEventListener("click", () => {
        if (!envelope.classList.contains("opened")) {
          this.triggerHaptic([30, 40]);
          envelope.classList.add("opened");

          // Sincere, gentle reveal sequence
          setTimeout(() => {
            if (starsContainer) {
              starsContainer.style.display = "flex";
            }
            if (this.sky) {
              this.sky.returnThreeStarsAndMerge(
                (starNum) => {
                  const el = document.getElementById(`ret-star-${starNum}`);
                  if (el) el.classList.add("active");
                },
                () => {
                  // Stars merged into one brighter star
                  if (starsMemoryText) starsMemoryText.classList.add("visible");
                  [1, 2, 3].forEach(n => {
                    const el = document.getElementById(`ret-star-${n}`);
                    if (el) el.classList.add("merged");
                  });

                  // Display the prompt: "Ready for your final birthday wish? ✨"
                  setTimeout(() => {
                    if (finalPromptContainer) {
                      finalPromptContainer.style.display = "block";
                    }
                  }, 1200);
                }
              );
            } else {
              if (finalPromptContainer) finalPromptContainer.style.display = "block";
            }
          }, 1400);
        }
      });
    }

    if (btnToFinal) {
      btnToFinal.addEventListener("click", () => {
        this.triggerHaptic(20);
        this.goToScene(15);
      });
    }

    // Setup interactive scratch-to-reveal card for Deepak's name
    this.setupScratchCard();
    this.setupEnvelopeScratch();

    // Scene 15: Replay Button
    const btnReplay = document.getElementById("btn-replay-magic");
    if (btnReplay) {
      btnReplay.addEventListener("click", () => this.replayStory());
    }
  }

  /* ----------------------------------------------------
   * WISH FORMS & DRAFT RECOVERY
   * ---------------------------------------------------- */
  setupWishForm(wishNum, inputId, buttonId, nextSceneIndex) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    const feedback = document.getElementById(`wish${wishNum}-validation-msg`);

    if (!input || !button) return;

    // Real-time draft auto-save on typing
    input.addEventListener("input", (e) => {
      const val = e.target.value;
      this.wishes[`wish${wishNum}`] = val;
      this.saveDraft(`WISH_${wishNum}`, val);

      // Validate non-empty
      if (val.trim().length > 0) {
        button.removeAttribute("disabled");
        button.classList.add("active");
        if (feedback) feedback.textContent = "";
      } else {
        if (wishNum !== 3) { // Wish 3 is gentle/reflective
          button.setAttribute("disabled", "true");
          button.classList.remove("active");
        }
      }
    });

    // Submit wish
    button.addEventListener("click", () => {
      const val = input.value.trim();
      if (wishNum !== 3 && val.length === 0) {
        if (feedback) feedback.textContent = "Please write a few words for your wish ✨";
        this.triggerHaptic([50, 50]);
        input.focus();
        return;
      }

      this.wishes[`wish${wishNum}`] = val || "A quiet wish in her heart ✨";
      this.triggerHaptic([30, 30]);

      // Progressively illuminate Star in the sky!
      if (this.sky) {
        this.sky.lightWishStar(wishNum);
      }

      // Update progress indicator badges
      this.updateProgressIndicator(wishNum);

      // Guardian character sparkles with delight
      this.triggerGuardianSparkle();

      // Proceed to next scene
      setTimeout(() => {
        this.goToScene(nextSceneIndex);
      }, 650);
    });
  }

  saveDraft(keyName, value) {
    try {
      const storageKey = window.APP_CONFIG.STORAGE_KEYS[keyName];
      if (storageKey) {
        sessionStorage.setItem(storageKey, value);
      }
    } catch (_) {}
  }

  restoreDraftWishes() {
    try {
      const w1 = sessionStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.WISH_1);
      const w2 = sessionStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.WISH_2);
      const w3 = sessionStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.WISH_3);

      if (w1) {
        this.wishes.wish1 = w1;
        const inp1 = document.getElementById("wish1-input");
        if (inp1) {
          inp1.value = w1;
          const btn1 = document.getElementById("btn-submit-wish1");
          if (btn1) {
            btn1.removeAttribute("disabled");
            btn1.classList.add("active");
          }
        }
      }
      if (w2) {
        this.wishes.wish2 = w2;
        const inp2 = document.getElementById("wish2-input");
        if (inp2) {
          inp2.value = w2;
          const btn2 = document.getElementById("btn-submit-wish2");
          if (btn2) {
            btn2.removeAttribute("disabled");
            btn2.classList.add("active");
          }
        }
      }
      if (w3) {
        this.wishes.wish3 = w3;
        const inp3 = document.getElementById("wish3-input");
        if (inp3) {
          inp3.value = w3;
          const btn3 = document.getElementById("btn-submit-wish3");
          if (btn3) {
            btn3.removeAttribute("disabled");
            btn3.classList.add("active");
          }
        }
      }
    } catch (_) {}
  }

  clearSessionDrafts() {
    try {
      sessionStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.WISH_1);
      sessionStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.WISH_2);
      sessionStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.WISH_3);
    } catch (_) {}
  }

  /* ----------------------------------------------------
   * PROGRESS INDICATOR
   * ---------------------------------------------------- */
  updateProgressIndicator(step) {
    for (let i = 1; i <= 3; i++) {
      const badge = document.getElementById(`prog-wish-${i}`);
      if (badge) {
        if (i <= step) {
          badge.classList.add("completed");
          badge.innerHTML = `Wish ${i} <span class="star-icon">✦</span>`;
        }
      }
    }
  }

  /* ----------------------------------------------------
   * SCENE MANAGEMENT & TRANSITIONS
   * ---------------------------------------------------- */
  goToScene(sceneNumber) {
    const currentSceneEl = document.querySelector(`.story-scene.active`);
    const nextSceneEl = document.getElementById(`scene-${sceneNumber}`);

    if (!nextSceneEl) return;

    if (currentSceneEl) {
      currentSceneEl.classList.remove("active");
      currentSceneEl.classList.add("fade-out");
      setTimeout(() => {
        currentSceneEl.classList.remove("fade-out");
      }, 500);
    }

    nextSceneEl.classList.add("active");
    this.currentSceneIndex = sceneNumber;

    // Handle scene-specific triggers
    this.handleSceneEnter(sceneNumber);

    // Scroll to top smoothly on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  handleSceneEnter(sceneNumber) {
    // Notify music engine of emotional story phase
    if (window.musicEngine) {
      if (sceneNumber <= 2) window.musicEngine.setPhase(1);
      else if (sceneNumber <= 4) window.musicEngine.setPhase(2);
      else if (sceneNumber <= 7) window.musicEngine.setPhase(3);
      else if (sceneNumber <= 11) window.musicEngine.setPhase(4);
      else if (sceneNumber <= 13) window.musicEngine.setPhase(5);
      else window.musicEngine.setPhase(6);
    }

    // Restore music volume if moving away from letter
    if (sceneNumber !== 13 && window.audioManager) {
      window.audioManager.restoreVolume(600);
    }

    switch (sceneNumber) {
      case 2:
        // Birthday Reveal: Fire celebratory confetti burst!
        setTimeout(() => {
          if (this.confetti) {
            this.confetti.launchBurst(80);
          }
        }, 400);
        break;

      case 3:
        // Enchanted Fairy Grove dialogue
        this.runTypewriter("garden-dialogue-text", "Every birthday comes with wishes...\nAnd tonight, fairy magic blooms for you.");
        break;

      case 4:
        // Genie intro typewriter dialogue
        this.runTypewriter("genie-dialogue-text", "You have three wishes.\n\nBut these aren't wishes for me to grant...\n\nThey're yours to write.");
        break;

      case 8:
        // Scene 8: The Wishes — Floating wish-balls, Magic Lamp & Genie
        if (!this.wishesExperience) {
          this.wishesExperience = new WishesExperience({
            onComplete: () => {
              this.triggerHaptic(20);
              this.goToScene(9);
            }
          });
        }
        this.wishesExperience.start();
        break;

      case 9:
        // Cake scene entrance
        break;

      case 12:
        // Success screen: wishes ascend as stars
        if (this.sky) {
          this.sky.ascendWishStars();
        }
        break;

      case 14:
        // Scene 14: Envelope creator reveal
        if (typeof this.initEnvelopeScratchCanvas === "function") {
          setTimeout(() => this.initEnvelopeScratchCanvas(), 80);
        }
        break;

      case 15:
        // Final birthday wish: initialize scratch card and gentle brightening
        if (typeof this.initScratchCardCanvas === "function") {
          setTimeout(() => this.initScratchCardCanvas(), 60);
        }
        setTimeout(() => {
          if (this.sky) {
            this.sky.brightenBackgroundMomentarily(3200);
          }
        }, 1600);
        break;

      default:
        break;
    }
  }

  startOpeningScene() {
    const openingCard = document.getElementById("opening-card-content");
    const openingText1 = document.getElementById("opening-line-1");
    const openingText2 = document.getElementById("opening-line-2");
    const enterBtn = document.getElementById("btn-enter-magic");

    setTimeout(() => {
      if (openingCard) openingCard.classList.add("visible");
      if (openingText1) openingText1.classList.add("fade-in");
    }, 800);

    setTimeout(() => {
      if (openingText2) openingText2.classList.add("fade-in");
    }, 2800);

    setTimeout(() => {
      if (enterBtn) {
        enterBtn.classList.add("visible");
        enterBtn.classList.add("pulse-glow");
      }
    }, 4200);
  }

  /**
   * Flower Pop Transition: Pops animated blossoms across the screen,
   * then transitions to the new Fairy Tale theme!
   */
  playFlowerPopTransition(callback) {
    const overlay = document.getElementById("flower-pop-overlay");
    if (!overlay) {
      if (typeof callback === "function") callback();
      return;
    }

    overlay.innerHTML = "";
    const flowerIcons = ["🌸", "🌺", "🌼", "🌷", "✨", "💐", "🌸", "🌺", "✨"];
    const flowerCount = 22;

    for (let i = 0; i < flowerCount; i++) {
      const flower = document.createElement("div");
      flower.className = "pop-flower-item";
      flower.textContent = flowerIcons[i % flowerIcons.length];

      // Random position across viewport
      const x = Math.random() * 85 + 7.5; // 7.5% to 92.5%
      const y = Math.random() * 80 + 10;  // 10% to 90%
      const size = Math.random() * 1.5 + 1.8; // 1.8rem to 3.3rem
      const delay = Math.random() * 0.35; // 0 to 0.35s

      flower.style.left = `${x}%`;
      flower.style.top = `${y}%`;
      flower.style.fontSize = `${size}rem`;
      flower.style.animationDelay = `${delay}s`;

      overlay.appendChild(flower);
    }

    // Trigger celestial ripple burst
    if (this.sky) {
      for (let j = 0; j < 3; j++) {
        setTimeout(() => {
          this.sky.interactiveRipples.push({
            x: Math.random() * this.sky.width,
            y: Math.random() * (this.sky.height * 0.6),
            radius: 8,
            maxRadius: 75 + j * 20,
            alpha: 0.85,
            color: "255, 182, 193"
          });
        }, j * 150);
      }
    }

    // After flower pop flourish, transition smoothly to the fairy tale theme!
    setTimeout(() => {
      if (typeof callback === "function") callback();
    }, 750);

    // Clean up overlay after animation completes
    setTimeout(() => {
      overlay.innerHTML = "";
    }, 1800);
  }

  /**
   * Awakens the Enchanted Fairy Tale Blossom
   */
  wakeFairyBlossomAndProceed() {
    const blossom = document.getElementById("fairy-blossom");
    const wakeBtn = document.getElementById("btn-wake-lamp");

    this.triggerHaptic([40, 60]);

    if (blossom) {
      blossom.classList.add("bloomed");
    }
    if (wakeBtn) {
      wakeBtn.innerHTML = "Magic Awakened ✨";
      wakeBtn.setAttribute("disabled", "true");
    }

    // Sparkle ripples from the blossoming fairy flower
    if (this.sky && blossom) {
      const rect = blossom.getBoundingClientRect();
      const lx = rect.left + rect.width / 2;
      const ly = rect.top + rect.height / 2;
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          this.sky.interactiveRipples.push({
            x: lx,
            y: ly,
            radius: 10,
            maxRadius: 90 + i * 25,
            alpha: 0.95,
            color: "255, 234, 167"
          });
        }, i * 130);
      }
    }

    setTimeout(() => {
      this.goToScene(4);
    }, 1200);
  }

  runTypewriter(elementId, text) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.innerHTML = "";
    el.classList.add("typing");
    let i = 0;

    const typeChar = () => {
      if (i < text.length) {
        if (text[i] === "\n") {
          el.innerHTML += "<br>";
        } else {
          el.innerHTML += text[i];
        }
        i++;
        setTimeout(typeChar, window.APP_CONFIG.TIMINGS.TYPEWRITER_SPEED);
      } else {
        el.classList.remove("typing");
      }
    };

    setTimeout(typeChar, 300);
  }

  triggerGuardianSparkle() {
    const guardians = document.querySelectorAll(".magical-girl-avatar");
    guardians.forEach(g => {
      g.classList.add("sparkling");
      setTimeout(() => g.classList.remove("sparkling"), 1400);
    });
  }

  triggerHaptic(pattern) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (_) {}
    }
  }

  /* ----------------------------------------------------
   * SECURE BACKEND SUBMISSION
   * ---------------------------------------------------- */
  async submitWishesToBackend() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const btnFinish = document.getElementById("btn-final-finish");
    const statusMsg = document.getElementById("submission-status-msg");

    if (btnFinish) {
      btnFinish.setAttribute("disabled", "true");
      btnFinish.innerHTML = `
        <span class="spinner-dot"></span>
        Sending your wishes to the stars... ✨
      `;
    }

    const payload = {
      wish1: this.wishes.wish1 || "No wish entered",
      wish2: this.wishes.wish2 || "No wish entered",
      wish3: this.wishes.wish3 || "A quiet thought kept in heart",
      clientTimestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(window.APP_CONFIG.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Submission success! Clear local session drafts for privacy
        this.clearSessionDrafts();
        this.triggerHaptic([40, 50, 60]);

        // Merge the three stars into one glowing light
        if (this.sky) {
          this.sky.mergeWishStarsIntoOne();
        }

        setTimeout(() => {
          this.goToScene(12); // Email success screen
        }, 800);
      } else {
        throw new Error(result.error || "Unable to send wishes");
      }
    } catch (err) {
      console.warn("Backend wish submission notice:", err);
      // Friendly fallback: Even if offline/local, don't break the magical illusion
      this.clearSessionDrafts();
      if (this.sky) {
        this.sky.mergeWishStarsIntoOne();
      }
      if (statusMsg) {
        statusMsg.innerHTML = `<small style="color: rgba(255,255,255,0.7);">Your wishes have been captured in the stars 🌟</small>`;
      }
      setTimeout(() => {
        this.goToScene(12);
      }, 1000);
    } finally {
      this.isSubmitting = false;
    }
  }

  /* ----------------------------------------------------
   * INTERACTIVE SCRATCH-TO-REVEAL CARD FOR DEEPAK'S NAME
   * ---------------------------------------------------- */
  setupScratchCard() {
    const canvas = document.getElementById("scratch-canvas");
    const container = document.getElementById("scratch-name-container");
    const quickRevealBtn = document.getElementById("btn-scratch-quick-reveal");
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    let isDrawing = false;
    let isRevealed = false;

    const initCanvas = () => {
      isRevealed = false;
      canvas.classList.remove("fade-out");
      container.classList.remove("revealed");

      const rect = canvas.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : 280;
      const h = rect.height > 0 ? rect.height : 96;

      canvas.width = w;
      canvas.height = h;

      // 1. Gold foil metallic gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#9e6f15");
      grad.addColorStop(0.2, "#f7d579");
      grad.addColorStop(0.48, "#fff6cc");
      grad.addColorStop(0.72, "#dfa932");
      grad.addColorStop(0.9, "#8a5808");
      grad.addColorStop(1, "#f3ce6d");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 2. Subtle decorative stardust speckles on the gold coating
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      for (let i = 0; i < 40; i++) {
        const x = (i * 31 + 13) % w;
        const y = (i * 29 + 17) % h;
        const r = (i % 3) * 0.7 + 0.8;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Delicate gold border stroke inside
      ctx.strokeStyle = "rgba(255, 240, 180, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(3, 3, w - 6, h - 6);

      // 4. Centered prompt label
      ctx.fillStyle = "#331f04";
      ctx.font = "bold 13px 'Cinzel', Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨ SCRATCH TO REVEAL ✨", w / 2, h / 2 - 4);

      ctx.fillStyle = "rgba(60, 36, 6, 0.75)";
      ctx.font = "italic 11px sans-serif";
      ctx.fillText("swipe or drag to reveal Deepak", w / 2, h / 2 + 16);
    };

    this.initScratchCardCanvas = initCanvas;
    this.resetScratchCard = initCanvas;

    // Initialize once DOM is ready or visible
    setTimeout(initCanvas, 100);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        screenX: clientX,
        screenY: clientY
      };
    };

    const scratch = (pos) => {
      if (isRevealed) return;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fill();

      // Trigger soft haptic
      if (Math.random() < 0.3) {
        this.triggerHaptic(12);
      }

      // Spawn gold sparkle particles
      this.spawnScratchSparkle(pos.screenX, pos.screenY);
    };

    const checkProgress = () => {
      if (isRevealed) return;
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        let transparentPixels = 0;
        const step = 20; // Sample every 5th pixel
        let sampled = 0;
        for (let i = 3; i < data.length; i += step) {
          sampled++;
          if (data[i] < 128) {
            transparentPixels++;
          }
        }
        const percent = transparentPixels / sampled;
        if (percent >= 0.35) {
          revealEverything();
        }
      } catch (err) {}
    };

    const revealEverything = () => {
      if (isRevealed) return;
      isRevealed = true;
      this.triggerHaptic([30, 50]);
      canvas.classList.add("fade-out");
      container.classList.add("revealed");

      // Play soft chime audio if available
      if (window.wishesAudio && typeof window.wishesAudio.playPopSound === "function") {
        window.wishesAudio.playPopSound(5);
      }

      // Launch celebratory confetti burst
      if (this.confetti) {
        this.confetti.launchBurst(40);
      }
    };

    canvas.addEventListener("mousedown", (e) => {
      isDrawing = true;
      scratch(getPos(e));
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDrawing) return;
      scratch(getPos(e));
    });

    window.addEventListener("mouseup", () => {
      if (isDrawing) {
        isDrawing = false;
        checkProgress();
      }
    });

    canvas.addEventListener("touchstart", (e) => {
      isDrawing = true;
      scratch(getPos(e));
    }, { passive: true });

    canvas.addEventListener("touchmove", (e) => {
      if (!isDrawing) return;
      scratch(getPos(e));
    }, { passive: true });

    canvas.addEventListener("touchend", () => {
      if (isDrawing) {
        isDrawing = false;
        checkProgress();
      }
    });

    if (quickRevealBtn) {
      quickRevealBtn.addEventListener("click", () => revealEverything());
    }
  }

  spawnScratchSparkle(screenX, screenY) {
    const sparkle = document.createElement("span");
    sparkle.innerText = Math.random() < 0.5 ? "✦" : "✨";
    sparkle.style.position = "fixed";
    sparkle.style.left = `${screenX + (Math.random() - 0.5) * 16}px`;
    sparkle.style.top = `${screenY + (Math.random() - 0.5) * 16}px`;
    sparkle.style.color = Math.random() < 0.5 ? "#ffd700" : "#ffffff";
    sparkle.style.fontSize = `${10 + Math.random() * 8}px`;
    sparkle.style.pointerEvents = "none";
    sparkle.style.zIndex = "9999";
    sparkle.style.transition = "all 0.5s ease-out";
    sparkle.style.transform = "translate(0, 0) scale(1)";
    sparkle.style.textShadow = "0 0 6px #ffd700";
    document.body.appendChild(sparkle);

    requestAnimationFrame(() => {
      const dx = (Math.random() - 0.5) * 36;
      const dy = -16 - Math.random() * 24;
      sparkle.style.transform = `translate(${dx}px, ${dy}px) scale(0)`;
      sparkle.style.opacity = "0";
    });

    setTimeout(() => {
      if (sparkle.parentNode) sparkle.parentNode.removeChild(sparkle);
    }, 550);
  }

  /* ----------------------------------------------------
   * INTERACTIVE SCRATCH-TO-REVEAL FOR ENVELOPE (SCENE 14)
   * ---------------------------------------------------- */
  setupEnvelopeScratch() {
    const canvas = document.getElementById("envelope-scratch-canvas");
    const container = document.getElementById("envelope-scratch-container");
    const hint = document.getElementById("envelope-scratch-hint");
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    let isDrawing = false;
    let isRevealed = false;

    const initCanvas = () => {
      isRevealed = false;
      canvas.classList.remove("fade-out");
      container.classList.remove("revealed");
      if (hint) {
        hint.innerHTML = `<span>✨ Scratch the gold to reveal ✨</span>`;
        hint.style.display = "block";
      }

      const rect = canvas.getBoundingClientRect();
      const w = rect.width > 0 ? rect.width : 210;
      const h = rect.height > 0 ? rect.height : 44;

      canvas.width = w;
      canvas.height = h;

      // 1. Lustrous metallic gold scratch layer
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#9e6f15");
      grad.addColorStop(0.25, "#f7d579");
      grad.addColorStop(0.5, "#fff8d6");
      grad.addColorStop(0.75, "#dfa932");
      grad.addColorStop(1, "#8a5808");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 2. Delicate decorative stardust speckles
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      for (let i = 0; i < 30; i++) {
        const x = (i * 27 + 11) % w;
        const y = (i * 19 + 7) % h;
        const r = (i % 3) * 0.6 + 0.8;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Delicate gold border stroke inside
      ctx.strokeStyle = "rgba(255, 240, 180, 0.75)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(2, 2, w - 4, h - 4);

      // 4. Centered prompt label
      ctx.fillStyle = "#331f04";
      ctx.font = "bold 11.5px 'Cinzel', Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨ SCRATCH TO REVEAL ✨", w / 2, h / 2);
    };

    this.initEnvelopeScratchCanvas = initCanvas;
    this.resetEnvelopeScratch = initCanvas;

    setTimeout(initCanvas, 100);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        screenX: clientX,
        screenY: clientY
      };
    };

    const scratch = (pos) => {
      if (isRevealed) return;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
      ctx.fill();

      // Trigger soft haptic
      if (Math.random() < 0.3) {
        this.triggerHaptic(12);
      }

      // Spawn gold sparkle particles
      this.spawnScratchSparkle(pos.screenX, pos.screenY);
    };

    const checkProgress = () => {
      if (isRevealed) return;
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        let transparentPixels = 0;
        const step = 16;
        let sampled = 0;
        for (let i = 3; i < data.length; i += step) {
          sampled++;
          if (data[i] < 128) {
            transparentPixels++;
          }
        }
        const percent = transparentPixels / sampled;
        if (percent >= 0.32) {
          revealName();
        }
      } catch (err) {}
    };

    const revealName = () => {
      if (isRevealed) return;
      isRevealed = true;
      this.triggerHaptic([30, 40]);
      canvas.classList.add("fade-out");
      container.classList.add("revealed");

      if (hint) {
        hint.innerHTML = `<span style="color: #6a4d0c; font-weight: 500;">✨ Revealed with warmth & care ✨</span>`;
      }

      // Play soft chime sound
      if (window.wishesAudio && typeof window.wishesAudio.playPopSound === "function") {
        window.wishesAudio.playPopSound(5);
      }

      if (this.confetti) {
        this.confetti.launchBurst(35);
      }
    };

    // Events on canvas (prevent envelope click bubbling)
    canvas.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      isDrawing = true;
      scratch(getPos(e));
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDrawing) return;
      scratch(getPos(e));
    });

    window.addEventListener("mouseup", () => {
      if (isDrawing) {
        isDrawing = false;
        checkProgress();
      }
    });

    canvas.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      isDrawing = true;
      scratch(getPos(e));
    }, { passive: true });

    canvas.addEventListener("touchmove", (e) => {
      if (!isDrawing) return;
      scratch(getPos(e));
    }, { passive: true });

    canvas.addEventListener("touchend", () => {
      if (isDrawing) {
        isDrawing = false;
        checkProgress();
      }
    });

    // Also tap hint to reveal fallback
    if (hint) {
      hint.style.cursor = "pointer";
      hint.addEventListener("click", (e) => {
        e.stopPropagation();
        revealName();
      });
    }

    // When envelope is opened, re-initialize canvas after slide animation
    const envelope = document.getElementById("magical-envelope");
    if (envelope) {
      envelope.addEventListener("click", () => {
        setTimeout(initCanvas, 350);
      });
    }
  }

  /* ----------------------------------------------------
   * REPLAY STORY
   * ---------------------------------------------------- */
  replayStory() {
    this.triggerHaptic(30);

    // Reset background music to beginning
    if (window.audioManager) {
      window.audioManager.resetToBeginning();
    }

    // Reset wish text states
    this.wishes = { wish1: "", wish2: "", wish3: "" };
    this.clearSessionDrafts();

    // Reset inputs
    ["wish1-input", "wish2-input", "wish3-input"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    // Reset envelope & Scene 14 elements
    const envelope = document.getElementById("magical-envelope");
    if (envelope) envelope.classList.remove("opened");
    if (typeof this.resetEnvelopeScratch === "function") {
      this.resetEnvelopeScratch();
    }
    const btnToFinal = document.getElementById("btn-to-final-screen");
    if (btnToFinal) {
      btnToFinal.style.display = "none";
      btnToFinal.classList.remove("visible");
    }
    const starsContainer = document.getElementById("stars-return-container");
    if (starsContainer) starsContainer.style.display = "none";
    const starsMemoryText = document.getElementById("stars-memory-text");
    if (starsMemoryText) starsMemoryText.classList.remove("visible");
    [1, 2, 3].forEach(n => {
      const el = document.getElementById(`ret-star-${n}`);
      if (el) {
        el.classList.remove("active");
        el.classList.remove("merged");
      }
    });
    const finalPromptContainer = document.getElementById("final-wish-prompt-container");
    if (finalPromptContainer) finalPromptContainer.style.display = "none";

    // Reset candle
    const candle = document.getElementById("birthday-candle");
    const flame = document.getElementById("candle-flame");
    const smoke = document.getElementById("candle-smoke");
    if (candle) candle.classList.remove("blown");
    if (flame) flame.classList.remove("extinguished");
    if (smoke) smoke.classList.remove("active");
    if (this.candleBlower) this.candleBlower.isExtinguished = false;

    // Reset progress indicator
    for (let i = 1; i <= 3; i++) {
      const badge = document.getElementById(`prog-wish-${i}`);
      if (badge) {
        badge.classList.remove("completed");
        badge.innerHTML = `Wish ${i}`;
      }
    }

    // Reset Scene 3 Fairy Tale Blossom
    const blossom = document.getElementById("fairy-blossom");
    if (blossom) blossom.classList.remove("bloomed");
    const wakeBtn = document.getElementById("btn-wake-lamp");
    if (wakeBtn) {
      wakeBtn.innerHTML = "Wake the Magic ✨";
      wakeBtn.removeAttribute("disabled");
    }

    // Reset Scene 13 Memory Letter
    const unfoldedCard = document.getElementById("memory-unfolded-content");
    if (unfoldedCard) unfoldedCard.classList.remove("visible");
    const btnOpenMemory = document.getElementById("btn-open-memory-letter");
    if (btnOpenMemory) btnOpenMemory.style.display = "inline-flex";
    const closedHint = document.getElementById("memory-closed-hint");
    if (closedHint) closedHint.style.display = "block";
    const toggleMemory = document.getElementById("memory-letter-toggle");
    if (toggleMemory) {
      toggleMemory.style.transform = "";
      toggleMemory.style.opacity = "";
    }

    // Reset Scene 8 Wishes Experience
    if (this.wishesExperience) {
      this.wishesExperience.destroy();
      this.wishesExperience = null;
    }
    const lampStage = document.getElementById("magic-lamp-stage");
    if (lampStage) {
      lampStage.classList.remove("visible");
      lampStage.style.opacity = "";
      lampStage.style.transform = "";
    }
    const smokeCloud = document.getElementById("magic-smoke-cloud");
    if (smokeCloud) smokeCloud.classList.remove("active");
    const genieStage = document.getElementById("genie-character-stage");
    if (genieStage) {
      genieStage.classList.remove("visible");
      genieStage.style.opacity = "";
      genieStage.style.filter = "";
    }
    const finalWishStage = document.getElementById("final-wish-card-stage");
    if (finalWishStage) finalWishStage.classList.remove("visible");
    const finalHeart = document.getElementById("final-wish-hbd-heart");
    const pauseOverlay = document.getElementById("mystery-pause-overlay");
    if (pauseOverlay) pauseOverlay.classList.remove("active");
    const tint = document.getElementById("wishes-atmosphere-tint");
    if (tint) tint.classList.remove("deep-magic");
    // Reset Scene 15 Scratch Card
    if (typeof this.resetScratchCard === "function") {
      this.resetScratchCard();
    }

    // Go back to scene 1
    this.goToScene(1);
    this.startOpeningScene();
  }
}

// Instantiate App
window.birthdayApp = new BirthdayApp();
