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

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
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

          if (window.wishesAudio && typeof window.wishesAudio.playPopSound === "function") {
            window.wishesAudio.playPopSound(2);
          }

          if (this.confetti) {
            setTimeout(() => this.confetti.launchBurst(35), 450);
          }

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

    // Setup interactive scratch-to-reveal card for Deepak's name (Scene 15)
    this.setupScratchCard();

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
    }, 250);

    setTimeout(() => {
      if (openingText2) openingText2.classList.add("fade-in");
    }, 1100);

    setTimeout(() => {
      if (enterBtn) {
        enterBtn.classList.add("visible");
        enterBtn.classList.add("pulse-glow");
      }
    }, 1800);

    // Allow user to tap anywhere to reveal the button immediately
    const scene1 = document.getElementById("scene-1");
    if (scene1) {
      scene1.addEventListener("click", () => {
        if (openingCard) openingCard.classList.add("visible");
        if (openingText1) openingText1.classList.add("fade-in");
        if (openingText2) openingText2.classList.add("fade-in");
        if (enterBtn) {
          enterBtn.classList.add("visible");
          enterBtn.classList.add("pulse-glow");
        }
      });
    }
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

    let delivered = false;

    // 1. Try local or Vercel serverless /api/submit-wishes first
    try {
      const response = await fetch(window.APP_CONFIG.API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        if (result && result.success) delivered = true;
      }
    } catch (_) {}

    // 2. Direct Web3Forms delivery fallback (for static hosting / Vercel Drop without serverless backend)
    const w3Key = (window.APP_CONFIG.WEB3FORMS_ACCESS_KEY || "").trim();
    if (!delivered && w3Key) {
      try {
        const formPayload = {
          access_key: w3Key,
          subject: "✨ 3 Birthday Wishes from Sayandana",
          from_name: "Sayandana's Birthday Magic ✨",
          message: `✨ THREE BIRTHDAY WISHES FROM SAYANDANA ✨\n\n` +
            `🌟 First Wish:\n"${payload.wish1}"\n\n` +
            `🌟 Second Wish:\n"${payload.wish2}"\n\n` +
            `🌟 Third Wish (Quiet Star):\n"${payload.wish3}"\n\n` +
            `Submitted: ${new Date().toLocaleString()}`,
          wish_1: payload.wish1,
          wish_2: payload.wish2,
          wish_3: payload.wish3
        };

        const w3Res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(formPayload)
        });
        const w3Json = await w3Res.json();
        if (w3Json && w3Json.success) delivered = true;
      } catch (err) {
        console.warn("Direct form delivery notice:", err);
      }
    }

    // Submission completed: transition gracefully to Scene 12
    this.clearSessionDrafts();
    this.triggerHaptic([40, 50, 60]);

    if (this.sky) {
      this.sky.mergeWishStarsIntoOne();
    }

    if (statusMsg) {
      statusMsg.innerHTML = `<small style="color: rgba(255,255,255,0.7);">Your wishes have been captured in the stars 🌟</small>`;
    }

    setTimeout(() => {
      this.goToScene(12); // Email success screen
    }, 900);

    this.isSubmitting = false;
  }

  /* ----------------------------------------------------
   * INTERACTIVE SCRATCH-TO-REVEAL CARD FOR DEEPAK'S NAME
   * ---------------------------------------------------- */
  setupScratchCard() {
    const canvas = document.getElementById("scratch-canvas");
    const container = document.getElementById("scratch-name-container");
    const quickRevealBtn = document.getElementById("btn-scratch-quick-reveal");
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let isDrawing = false;
    let isRevealed = false;
    let strokeCount = 0;
    let lastX = 0;
    let lastY = 0;

    const initCanvas = () => {
      if (isRevealed) return;
      strokeCount = 0;
      canvas.classList.remove("fade-out");
      canvas.style.display = "block";
      container.classList.remove("revealed");

      const rect = canvas.getBoundingClientRect();
      const w = rect.width > 0 ? Math.round(rect.width) : 280;
      const h = rect.height > 0 ? Math.round(rect.height) : 96;

      canvas.width = w;
      canvas.height = h;

      // 1. Brilliant Radiant Gold Layer
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#c4890c");
      grad.addColorStop(0.18, "#ffd700");
      grad.addColorStop(0.38, "#fffbe8");
      grad.addColorStop(0.55, "#ffcf33");
      grad.addColorStop(0.78, "#ffd859");
      grad.addColorStop(0.92, "#f0ad18");
      grad.addColorStop(1, "#b37b0b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 2. Gloss Sheen Band
      const sheenGrad = ctx.createLinearGradient(0, 0, w, h);
      sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      sheenGrad.addColorStop(0.48, "rgba(255, 255, 255, 0.45)");
      sheenGrad.addColorStop(0.52, "rgba(255, 255, 255, 0.45)");
      sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, 0, w, h);

      // 3. Stardust Speckles
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      for (let i = 0; i < 45; i++) {
        const x = (i * 31 + 13) % w;
        const y = (i * 29 + 17) % h;
        const r = (i % 3) * 0.8 + 0.9;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Double Gold Border
      ctx.strokeStyle = "rgba(255, 245, 190, 0.9)";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(3, 3, w - 6, h - 6);

      ctx.strokeStyle = "rgba(168, 105, 10, 0.75)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(7, 7, w - 14, h - 14);

      // 5. Centered Deep Gold Stamped Lettering
      ctx.fillStyle = "#261300";
      ctx.font = "bold 13.5px 'Cinzel', Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨ SCRATCH TO REVEAL ✨", w / 2, h / 2 - 3);

      ctx.fillStyle = "rgba(45, 25, 0, 0.75)";
      ctx.font = "italic 11px sans-serif";
      ctx.fillText("swipe or tap to reveal", w / 2, h / 2 + 16);
    };

    this.initScratchCardCanvas = initCanvas;
    this.resetScratchCard = () => {
      isRevealed = false;
      initCanvas();
    };

    setTimeout(initCanvas, 100);

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        screenX: e.clientX,
        screenY: e.clientY
      };
    };

    const scratchTo = (currentX, currentY, screenX, screenY) => {
      if (isRevealed) return;

      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 36;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      lastX = currentX;
      lastY = currentY;
      strokeCount++;

      if (Math.random() < 0.35) {
        this.triggerHaptic(12);
      }

      this.spawnScratchSparkle(screenX, screenY);

      if (strokeCount > 10 || strokeCount % 4 === 0) {
        checkProgress();
      }
    };

    const checkProgress = () => {
      if (isRevealed) return;
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        let transparentPixels = 0;
        const step = 20;
        let sampled = 0;
        for (let i = 3; i < data.length; i += step) {
          sampled++;
          if (data[i] < 128) {
            transparentPixels++;
          }
        }
        const percent = transparentPixels / sampled;
        if (percent >= 0.22 || strokeCount >= 18) {
          revealEverything();
        }
      } catch (err) {
        if (strokeCount >= 14) revealEverything();
      }
    };

    const revealEverything = () => {
      if (isRevealed) return;
      isRevealed = true;
      this.triggerHaptic([30, 50]);
      canvas.classList.add("fade-out");
      container.classList.add("revealed");

      setTimeout(() => {
        canvas.style.display = "none";
      }, 500);

      if (window.wishesAudio && typeof window.wishesAudio.playPopSound === "function") {
        window.wishesAudio.playPopSound(5);
      }

      if (this.confetti) {
        this.confetti.launchBurst(40);
      }
    };

    // Pointer Events: Seamless mouse, touch, and stylus support
    canvas.addEventListener("pointerdown", (e) => {
      if (isRevealed) return;
      e.preventDefault();
      e.stopPropagation();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      }
      isDrawing = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
      scratchTo(pos.x, pos.y, pos.screenX, pos.screenY);
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!isDrawing || isRevealed) return;
      e.preventDefault();
      e.stopPropagation();
      const pos = getPos(e);
      scratchTo(pos.x, pos.y, pos.screenX, pos.screenY);
    });

    const endPointer = (e) => {
      if (!isDrawing) return;
      isDrawing = false;
      if (canvas.releasePointerCapture) {
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      }
      checkProgress();
    };

    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);

    // Direct Tap / Click fallback
    canvas.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      revealEverything();
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
