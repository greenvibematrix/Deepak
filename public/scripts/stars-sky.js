/**
 * Starry Sky, Fireflies, Music-Reactive Canvas & Constellation System
 * 
 * Features:
 * 1. Deep cinematic starry night sky with multi-depth twinkling stars.
 * 2. Subtle music-reactivity: sky luminescence, star twinkling, and fireflies
 *    breathe gently with "Pavizha Mazha" via window.musicEngine.
 * 3. Soft celestial ripples on musical swells without jarring screen flashes.
 * 4. Three major wish stars that ignite progressively and connect with starlight trails.
 * 5. Star merging sequences:
 *    - On "FINISH ✨" in Scene 11, the 3 stars merge into one glowing light.
 *    - In Scene 14, the 3 stars return sequentially and merge before the final wish.
 * 6. Background momentary peaceful brightening for the final signature in Scene 15.
 */

class CelestialSky {
  constructor(canvasId = "sky-canvas") {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.stars = [];
    this.fireflies = [];
    this.shootingStars = [];
    this.interactiveRipples = [];
    this.activeEmbers = [];

    // Wish constellation stars (Wish 1, 2, 3)
    this.initialWishCoords = [
      { id: 1, xPct: 0.28, yPct: 0.22, name: "Wish 1", color: "#ffeaa7" },
      { id: 2, xPct: 0.72, yPct: 0.18, name: "Wish 2", color: "#fdcb6e" },
      { id: 3, xPct: 0.52, yPct: 0.34, name: "Wish 3", color: "#f3a683" }
    ];

    this.wishStars = this.initialWishCoords.map(s => ({
      ...s,
      lit: false,
      glow: 0,
      targetGlow: 0,
      currentXPct: s.xPct,
      currentYPct: s.yPct,
      isMerging: false,
      mergedAlpha: 0
    }));

    this.mergedSingleStar = {
      active: false,
      xPct: 0.50,
      yPct: 0.24,
      glow: 0,
      targetGlow: 0
    };

    this.allWishesLit = false;
    this.starsAscending = false;
    this.skyLuminescence = 0.15;
    this.targetSkyLuminescence = 0.15;

    // Music reactivity state
    this.lastSwellTime = 0;
    this.isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.animFrameId = null;

    this.init();
  }

  init() {
    this.resize();
    this.createStars(this.isReducedMotion ? 60 : 130);
    this.createFireflies(this.isReducedMotion ? 8 : 20);

    window.addEventListener("resize", () => this.resize(), { passive: true });

    // Tap/Click interaction for fireflies and ripples
    const handleTap = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.triggerTapInteraction(clientX, clientY);
    };

    window.addEventListener("pointerdown", handleTap, { passive: true });

    this.startLoop();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  createStars(count) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 1.5 + 0.5,
        baseAlpha: Math.random() * 0.7 + 0.3,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.8 ? 260 : (Math.random() > 0.5 ? 45 : 210)
      });
    }
  }

  createFireflies(count) {
    this.fireflies = [];
    for (let i = 0; i < count; i++) {
      this.fireflies.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.8) + (this.height * 0.15),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1.4,
        alpha: Math.random() * 0.8 + 0.2,
        pulseSpeed: Math.random() * 0.04 + 0.02,
        pulseOffset: Math.random() * Math.PI * 2,
        wanderTimer: Math.floor(Math.random() * 120),
        glowColor: Math.random() > 0.3 ? "245, 208, 112" : "198, 246, 213"
      });
    }
  }

  triggerTapInteraction(x, y) {
    let hitFirefly = false;
    this.fireflies.forEach(f => {
      const dx = f.x - x;
      const dy = f.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 90) {
        hitFirefly = true;
        const angle = Math.atan2(dy, dx);
        f.vx += Math.cos(angle) * 2.2;
        f.vy += Math.sin(angle) * 2.2;
        f.alpha = 1.0;
      }
    });

    this.interactiveRipples.push({
      x,
      y,
      radius: 4,
      maxRadius: hitFirefly ? 50 : 35,
      alpha: 0.65,
      color: hitFirefly ? "245, 208, 112" : "200, 182, 255"
    });

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate(12); } catch (_) {}
    }
  }

  /**
   * Star Progression: Activate celestial star when wish is finished
   */
  lightWishStar(wishNumber) {
    const star = this.wishStars.find(s => s.id === wishNumber);
    if (!star) return;

    star.lit = true;
    star.targetGlow = 1.0;

    const sx = star.currentXPct * this.width;
    const sy = star.currentYPct * this.height;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.interactiveRipples.push({
          x: sx,
          y: sy,
          radius: 5,
          maxRadius: 70 + i * 20,
          alpha: 0.85,
          color: "255, 234, 167"
        });
      }, i * 150);
    }

    this.targetSkyLuminescence += 0.08;

    if (wishNumber === 3) {
      this.allWishesLit = true;
      this.spawnConstellationShootingStar();
    }
  }

  /**
   * Merges the 3 wish stars into 1 single bright glowing light
   */
  mergeWishStarsIntoOne(callback) {
    const targetX = 0.50;
    const targetY = 0.24;

    const startTime = performance.now();
    const duration = 1600; // ms

    const animateMerge = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;

      this.wishStars.forEach((star, idx) => {
        const init = this.initialWishCoords[idx];
        star.currentXPct = init.xPct + (targetX - init.xPct) * ease;
        star.currentYPct = init.yPct + (targetY - init.yPct) * ease;
        if (progress > 0.85) {
          star.glow = Math.max(0, 1 - (progress - 0.85) / 0.15);
        }
      });

      if (progress < 1) {
        requestAnimationFrame(animateMerge);
      } else {
        // Activate merged single star with soft golden bloom
        this.mergedSingleStar.active = true;
        this.mergedSingleStar.xPct = targetX;
        this.mergedSingleStar.yPct = targetY;
        this.mergedSingleStar.glow = 1.4;
        this.mergedSingleStar.targetGlow = 1.0;

        // Radiate golden celebration ripple
        this.interactiveRipples.push({
          x: targetX * this.width,
          y: targetY * this.height,
          radius: 10,
          maxRadius: 100,
          alpha: 0.9,
          color: "255, 235, 175"
        });

        if (typeof callback === "function") callback();
      }
    };

    requestAnimationFrame(animateMerge);
  }

  /**
   * Scene 14: Sequentially brings back the three stars, then merges them
   */
  returnThreeStarsAndMerge(onStarStep, onComplete) {
    // Reset positions
    this.mergedSingleStar.active = false;
    this.wishStars.forEach((star, idx) => {
      const init = this.initialWishCoords[idx];
      star.currentXPct = init.xPct;
      star.currentYPct = init.yPct;
      star.lit = false;
      star.glow = 0;
      star.targetGlow = 0;
    });

    // Step 1: Star 1 appears
    setTimeout(() => {
      this.wishStars[0].lit = true;
      this.wishStars[0].targetGlow = 1.0;
      if (typeof onStarStep === "function") onStarStep(1);
    }, 400);

    // Step 2: Star 2 appears
    setTimeout(() => {
      this.wishStars[1].lit = true;
      this.wishStars[1].targetGlow = 1.0;
      if (typeof onStarStep === "function") onStarStep(2);
    }, 1400);

    // Step 3: Star 3 appears
    setTimeout(() => {
      this.wishStars[2].lit = true;
      this.wishStars[2].targetGlow = 1.0;
      if (typeof onStarStep === "function") onStarStep(3);
    }, 2400);

    // Step 4: Stars merge into one brighter star at musical swell
    setTimeout(() => {
      this.mergeWishStarsIntoOne(() => {
        if (typeof onComplete === "function") onComplete();
      });
    }, 3800);
  }

  /**
   * Final Scene: Gently brightens background for a moment, then settles peacefully
   */
  brightenBackgroundMomentarily(durationMs = 2800) {
    const original = this.targetSkyLuminescence;
    this.targetSkyLuminescence = 0.42;

    setTimeout(() => {
      this.targetSkyLuminescence = original;
    }, durationMs);
  }

  spawnConstellationShootingStar() {
    this.shootingStars.push({
      x: Math.random() * (this.width * 0.6),
      y: Math.random() * (this.height * 0.3),
      length: Math.random() * 80 + 50,
      speed: Math.random() * 6 + 7,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
      alpha: 1.0,
      decay: 0.02
    });
  }

  burstCandleEmbers(originX, originY) {
    const count = 35;
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) - Math.PI;
      const speed = Math.random() * 3 + 1.5;
      this.activeEmbers.push({
        x: originX + (Math.random() - 0.5) * 16,
        y: originY,
        vx: Math.cos(angle) * speed * 0.8,
        vy: Math.sin(angle) * speed - 1.2,
        radius: Math.random() * 2.2 + 0.8,
        alpha: 1.0,
        decay: Math.random() * 0.015 + 0.008,
        color: Math.random() > 0.3 ? "255, 215, 0" : "255, 160, 122"
      });
    }
  }

  ascendWishStars() {
    this.starsAscending = true;
  }

  startLoop() {
    const render = () => {
      this.update();
      this.draw();
      this.animFrameId = requestAnimationFrame(render);
    };
    render();
  }

  update() {
    // Read smoothed music variables from window.musicEngine
    const musicEnergy = window.musicEngine ? window.musicEngine.energy : 0;
    const musicBass = window.musicEngine ? window.musicEngine.bass : 0;
    const musicMid = window.musicEngine ? window.musicEngine.mid : 0;
    const musicTreble = window.musicEngine ? window.musicEngine.treble : 0;

    // Atmospheric luminescence breathing gently with bass energy
    const dynamicBaseLumi = this.targetSkyLuminescence + musicBass * 0.08;
    this.skyLuminescence += (dynamicBaseLumi - this.skyLuminescence) * 0.05;

    // Check for gentle musical swell to trigger subtle light ripple
    const now = performance.now();
    if (musicEnergy > 0.45 && now - this.lastSwellTime > 4000) {
      this.lastSwellTime = now;
      this.interactiveRipples.push({
        x: this.width * (0.3 + Math.random() * 0.4),
        y: this.height * (0.15 + Math.random() * 0.25),
        radius: 10,
        maxRadius: 110,
        alpha: 0.35,
        color: "235, 220, 255"
      });
    }

    // Twinkle background stars reacting softly to treble/air frequencies
    if (!this.isReducedMotion) {
      this.stars.forEach(s => {
        s.twinklePhase += s.twinkleSpeed * (1 + musicTreble * 0.8);
        s.alpha = s.baseAlpha + Math.sin(s.twinklePhase) * (0.22 + musicTreble * 0.15);
      });
    }

    // Update fireflies reacting to melody & mid-range frequencies
    this.fireflies.forEach(f => {
      if (!this.isReducedMotion) {
        f.wanderTimer--;
        if (f.wanderTimer <= 0) {
          f.vx += (Math.random() - 0.5) * 0.4;
          // Float slightly more upward on melodic phrases
          f.vy += (Math.random() - 0.5) * 0.3 - musicMid * 0.06;
          const maxSpd = 1.1 + musicMid * 0.4;
          f.vx = Math.max(-maxSpd, Math.min(maxSpd, f.vx));
          f.vy = Math.max(-maxSpd, Math.min(maxSpd, f.vy));
          f.wanderTimer = Math.floor(Math.random() * 100) + 40;
        }

        f.x += f.vx;
        f.y += f.vy;

        if (f.x < -20) f.x = this.width + 20;
        if (f.x > this.width + 20) f.x = -20;
        if (f.y < -20) f.y = this.height + 20;
        if (f.y > this.height + 20) f.y = -20;

        f.pulseOffset += f.pulseSpeed;
        const pulse = Math.sin(f.pulseOffset) * 0.7 + 0.3;
        f.currentAlpha = Math.max(0.15, Math.min(1.0, pulse + musicMid * 0.35));
      } else {
        f.currentAlpha = 0.6;
      }
    });

    // Update wish constellation stars
    this.wishStars.forEach(ws => {
      // Gentle breathing pulse with melody
      const musicPulse = ws.lit ? musicEnergy * 0.22 : 0;
      ws.glow += (ws.targetGlow + musicPulse - ws.glow) * 0.08;

      if (this.starsAscending) {
        ws.currentYPct -= 0.003;
        if (ws.currentYPct < -0.2) ws.glow = 0;
      }
    });

    // Update single merged star if active
    if (this.mergedSingleStar.active) {
      const mergedPulse = musicEnergy * 0.28;
      this.mergedSingleStar.glow += (this.mergedSingleStar.targetGlow + mergedPulse - this.mergedSingleStar.glow) * 0.08;
    }

    // Shooting stars
    if (this.allWishesLit && Math.random() < 0.005 && this.shootingStars.length < 2) {
      this.spawnConstellationShootingStar();
    }

    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.alpha -= ss.decay;
      if (ss.alpha <= 0 || ss.x > this.width + 100 || ss.y > this.height + 100) {
        this.shootingStars.splice(i, 1);
      }
    }

    // Interactive ripples
    for (let i = this.interactiveRipples.length - 1; i >= 0; i--) {
      const r = this.interactiveRipples[i];
      r.radius += 1.3;
      r.alpha -= 0.016;
      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.interactiveRipples.splice(i, 1);
      }
    }

    // Embers
    for (let i = this.activeEmbers.length - 1; i >= 0; i--) {
      const em = this.activeEmbers[i];
      em.x += em.vx;
      em.y += em.vy;
      em.vy -= 0.02;
      em.alpha -= em.decay;
      if (em.alpha <= 0) {
        this.activeEmbers.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Soft atmospheric night glow (modulated by skyLuminescence)
    const skyGrad = this.ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.2, 50,
      this.width * 0.5, this.height * 0.5, this.height * 0.95
    );
    skyGrad.addColorStop(0, `rgba(45, 27, 85, ${this.skyLuminescence})`);
    skyGrad.addColorStop(0.5, `rgba(18, 14, 46, ${this.skyLuminescence * 0.65})`);
    skyGrad.addColorStop(1, "rgba(7, 10, 30, 0)");
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. Crescent Moon
    this.drawMoon();

    // 3. Regular Stars
    this.stars.forEach(s => {
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${s.hue}, 80%, 92%, ${s.alpha})`;
      this.ctx.fill();
    });

    // 4. Wish Constellation Lines & Stars
    this.drawWishConstellations();

    // 5. Merged Single Star (if active)
    if (this.mergedSingleStar.active) {
      this.drawMergedStar();
    }

    // 6. Shooting stars
    this.shootingStars.forEach(ss => {
      const tailX = ss.x - Math.cos(ss.angle) * ss.length;
      const tailY = ss.y - Math.sin(ss.angle) * ss.length;
      const grad = this.ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      grad.addColorStop(0, "rgba(255, 255, 255, 0)");
      grad.addColorStop(1, `rgba(255, 245, 215, ${ss.alpha})`);
      this.ctx.beginPath();
      this.ctx.moveTo(tailX, tailY);
      this.ctx.lineTo(ss.x, ss.y);
      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });

    // 7. Interactive / Musical Ripples
    this.interactiveRipples.forEach(r => {
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(${r.color}, ${r.alpha})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    });

    // 8. Fireflies
    this.fireflies.forEach(f => {
      const alpha = f.currentAlpha || 0.5;
      const aura = this.ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 4.5);
      aura.addColorStop(0, `rgba(${f.glowColor}, ${alpha * 0.7})`);
      aura.addColorStop(1, `rgba(${f.glowColor}, 0)`);
      this.ctx.fillStyle = aura;
      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.radius * 4.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(f.x, f.y, f.radius * 0.8, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      this.ctx.fill();
    });

    // 9. Candle Smoke Embers
    this.activeEmbers.forEach(em => {
      this.ctx.beginPath();
      this.ctx.arc(em.x, em.y, em.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${em.color}, ${em.alpha})`;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = `rgba(${em.color}, ${em.alpha})`;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }

  drawMoon() {
    const mx = this.width * 0.84;
    const my = Math.min(this.height * 0.12, 110);
    const mRadius = Math.min(this.width * 0.08, 36);

    const moonGlow = this.ctx.createRadialGradient(mx, my, mRadius * 0.5, mx, my, mRadius * 2.8);
    moonGlow.addColorStop(0, "rgba(255, 248, 220, 0.22)");
    moonGlow.addColorStop(1, "rgba(255, 248, 220, 0)");
    this.ctx.fillStyle = moonGlow;
    this.ctx.beginPath();
    this.ctx.arc(mx, my, mRadius * 2.8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.save();
    this.ctx.fillStyle = "#fffbf0";
    this.ctx.beginPath();
    this.ctx.arc(mx, my, mRadius, 0, Math.PI * 2, true);
    this.ctx.fill();

    this.ctx.globalCompositeOperation = "destination-out";
    this.ctx.beginPath();
    this.ctx.arc(mx - mRadius * 0.45, my - mRadius * 0.2, mRadius * 0.95, 0, Math.PI * 2, true);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawWishConstellations() {
    const pts = this.wishStars.map(s => ({
      x: s.currentXPct * this.width,
      y: s.currentYPct * this.height,
      glow: s.glow,
      lit: s.lit,
      color: s.color,
      name: s.name
    }));

    // Connect with thin magical trails if lit
    if (pts[0].glow > 0.1 && pts[1].glow > 0.1) {
      const beamAlpha = Math.min(pts[0].glow, pts[1].glow) * 0.55;
      this.ctx.beginPath();
      this.ctx.moveTo(pts[0].x, pts[0].y);
      this.ctx.lineTo(pts[1].x, pts[1].y);
      this.ctx.strokeStyle = `rgba(245, 208, 112, ${beamAlpha})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([4, 4]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    if (pts[1].glow > 0.1 && pts[2].glow > 0.1) {
      const beamAlpha = Math.min(pts[1].glow, pts[2].glow) * 0.55;
      this.ctx.beginPath();
      this.ctx.moveTo(pts[1].x, pts[1].y);
      this.ctx.lineTo(pts[2].x, pts[2].y);
      this.ctx.strokeStyle = `rgba(245, 208, 112, ${beamAlpha})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([4, 4]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    if (pts[2].glow > 0.1 && pts[0].glow > 0.1) {
      const beamAlpha = Math.min(pts[2].glow, pts[0].glow) * 0.55;
      this.ctx.beginPath();
      this.ctx.moveTo(pts[2].x, pts[2].y);
      this.ctx.lineTo(pts[0].x, pts[0].y);
      this.ctx.strokeStyle = `rgba(245, 208, 112, ${beamAlpha})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([4, 4]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // Draw individual Wish Stars
    pts.forEach(p => {
      if (p.glow <= 0.05) return;

      const aura = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 35 * p.glow);
      aura.addColorStop(0, `rgba(255, 240, 180, ${p.glow * 0.9})`);
      aura.addColorStop(0.4, `rgba(245, 208, 112, ${p.glow * 0.45})`);
      aura.addColorStop(1, "rgba(245, 208, 112, 0)");
      this.ctx.fillStyle = aura;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 35 * p.glow, 0, Math.PI * 2);
      this.ctx.fill();

      // 4-point Diamond Star Flare
      this.ctx.fillStyle = `rgba(255, 255, 255, ${p.glow * 0.95})`;
      const fl = 12 * p.glow;
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y - fl);
      this.ctx.lineTo(p.x + fl * 0.25, p.y);
      this.ctx.lineTo(p.x, p.y + fl);
      this.ctx.lineTo(p.x - fl * 0.25, p.y);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(p.x - fl, p.y);
      this.ctx.lineTo(p.x, p.y + fl * 0.25);
      this.ctx.lineTo(p.x + fl, p.y);
      this.ctx.lineTo(p.x, p.y - fl * 0.25);
      this.ctx.closePath();
      this.ctx.fill();

      // Bright nucleus
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3.5 * p.glow, 0, Math.PI * 2);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fill();
    });
  }

  drawMergedStar() {
    const mx = this.mergedSingleStar.xPct * this.width;
    const my = this.mergedSingleStar.yPct * this.height;
    const glow = this.mergedSingleStar.glow;

    // Radiant outer halo
    const halo = this.ctx.createRadialGradient(mx, my, 0, mx, my, 55 * glow);
    halo.addColorStop(0, `rgba(255, 245, 200, ${glow * 0.95})`);
    halo.addColorStop(0.35, `rgba(255, 215, 120, ${glow * 0.5})`);
    halo.addColorStop(1, "rgba(255, 215, 120, 0)");
    this.ctx.fillStyle = halo;
    this.ctx.beginPath();
    this.ctx.arc(mx, my, 55 * glow, 0, Math.PI * 2);
    this.ctx.fill();

    // Radiant Diamond flares
    this.ctx.fillStyle = "#ffffff";
    const fl = 20 * glow;

    this.ctx.beginPath();
    this.ctx.moveTo(mx, my - fl);
    this.ctx.lineTo(mx + fl * 0.2, my);
    this.ctx.lineTo(mx, my + fl);
    this.ctx.lineTo(mx - fl * 0.2, my);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(mx - fl, my);
    this.ctx.lineTo(mx, my + fl * 0.2);
    this.ctx.lineTo(mx + fl, my);
    this.ctx.lineTo(mx, my - fl * 0.2);
    this.ctx.closePath();
    this.ctx.fill();

    // Center jewel core
    this.ctx.beginPath();
    this.ctx.arc(mx, my, 5 * glow, 0, Math.PI * 2);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fill();
  }
}

window.CelestialSky = CelestialSky;
