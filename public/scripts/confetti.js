/**
 * Birthday Reveal Confetti System
 * 
 * Specifically designed to fire ONLY during Scene 2 (Birthday Reveal).
 * Features elegant gold leaf flakes, cream petals, soft lavender ribbons, and stardust.
 */

class BirthdayConfetti {
  constructor(canvasId = "confetti-canvas") {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");

    this.particles = [];
    this.isActive = false;
    this.animId = null;

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.colors = [
      "#f5c767", // Warm gold
      "#ffd32a", // Bright gold
      "#d0c3fc", // Soft lavender
      "#ffcad4", // Subtle rose
      "#fffdf7", // Cream
      "#e5b84c"  // Kasavu gold
    ];

    window.addEventListener("resize", () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.ctx.scale(this.dpr, this.dpr);
    });

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  /**
   * Launch single celebratory burst of festive particles
   */
  launchBurst(count = 70) {
    this.isActive = true;
    const originX = this.width * 0.5;
    const originY = this.height * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 8 + 4;

      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5, // gentle initial upward kick
        gravity: 0.18,
        drag: 0.96,
        size: Math.random() * 7 + 4,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        shape: Math.random() > 0.4 ? "petal" : (Math.random() > 0.5 ? "circle" : "ribbon"),
        alpha: 1.0,
        decay: Math.random() * 0.007 + 0.006
      });
    }

    if (!this.animId) {
      this.render();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > this.height + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;

      if (p.shape === "petal") {
        // Jasmine petal shape
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size * 0.9, p.size * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === "ribbon") {
        this.ctx.fillRect(-p.size * 0.8, -p.size * 0.25, p.size * 1.6, p.size * 0.5);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.render());
    } else {
      this.isActive = false;
      this.animId = null;
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }
}

window.BirthdayConfetti = BirthdayConfetti;
