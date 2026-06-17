import { RendererInterface } from './RendererInterface.js';
import { eventBus } from '../core/EventBus.js';

export class ParticleRenderer extends RendererInterface {
  init(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particles = [];
    this.maxParticles = 800;

    // Flush particles on theme changes
    this.unsubscribeTheme = eventBus.subscribe('settings:theme', () => {
      this.clearParticles();
    });
  }

  update(motionPoints, dt, state, rainbowHue) {
    const activeTheme = state.getTheme();
    const density = state.getSetting('density') / 100;
    const decay = state.getSetting('decay');
    const themeName = state.getSetting('theme');

    // Spawn new particles from motion points
    if (motionPoints && motionPoints.length > 0) {
      // Scale spawn chance with dt to maintain constant density per second
      const baseSpawnChance = 0.08 * density;
      const spawnChance = 1 - Math.pow(1 - baseSpawnChance, 60 * dt);
      
      motionPoints.forEach(point => {
        if (Math.random() < spawnChance && this.particles.length < this.maxParticles) {
          let color;
          if (themeName === 'rainbow') {
            color = `hsla(${rainbowHue}, 90%, 65%, 1.0)`;
          } else {
            color = activeTheme.palette[Math.floor(Math.random() * activeTheme.palette.length)];
          }
          
          this.particles.push({
            x: point.x + (Math.random() * 30 - 15),
            y: point.y + (Math.random() * 30 - 15),
            vx: (Math.random() * 2 - 1) * 1.5,
            vy: (Math.random() * 2 - 1) * 1.5 - (Math.random() * 0.8), // subtle float upwards
            color: color,
            alpha: 1.0,
            decay: decay * (0.05 + Math.random() * 0.08),
            size: Math.random() * 4 + 1.5
          });
        }
      });
    }

    // Physics Update and Canvas Draw
    this.ctx.globalCompositeOperation = 'screen';
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      // Scale velocity and decay from 60fps baseline
      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      p.alpha -= p.decay * 60 * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.globalAlpha = 1.0;
    this.ctx.globalCompositeOperation = 'source-over';
  }

  clearParticles() {
    this.particles = [];
  }

  destroy() {
    if (this.unsubscribeTheme) {
      this.unsubscribeTheme();
    }
  }
}
