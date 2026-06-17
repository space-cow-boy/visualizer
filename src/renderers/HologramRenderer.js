import { RendererInterface } from './RendererInterface.js';

export class HologramRenderer extends RendererInterface {
  init(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.scanlineY = 0;
  }

  update(motionPoints, dt, state, rainbowHue) {
    const theme = state.getTheme();
    const themeName = state.getSetting('theme');
    const density = state.getSetting('density') / 100;
    
    let color;
    if (themeName === 'rainbow') {
      color = `hsla(${rainbowHue}, 90%, 60%, 0.8)`;
    } else {
      color = theme.primary;
    }

    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;

    // Draw active scan lines inside motion zones
    if (motionPoints && motionPoints.length > 0) {
      const step = Math.max(1, Math.floor(25 / density));
      this.ctx.lineWidth = 1.5;
      
      for (let i = 0; i < motionPoints.length; i += step) {
        const point = motionPoints[i];
        
        // Horizontal scanned glow nodes
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, Math.random() * 3 + 1, 0, Math.PI * 2);
        this.ctx.fill();

        // High tech vector outlines
        if (i > 0 && Math.random() < 0.15) {
          const prev = motionPoints[i - 1];
          const dist = Math.hypot(point.x - prev.x, point.y - prev.y);
          if (dist < 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(prev.x, prev.y);
            this.ctx.lineTo(point.x, point.y);
            this.ctx.globalAlpha = 0.3;
            this.ctx.stroke();
            this.ctx.globalAlpha = 1.0;
          }
        }
      }
    }

    // Global scanning line overlay
    this.ctx.strokeStyle = color;
    this.ctx.globalAlpha = 0.08;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.scanlineY);
    this.ctx.lineTo(this.canvas.width, this.scanlineY);
    this.ctx.stroke();
    
    // Scale scanline speed
    const speed = dt ? dt * 180 : 3;
    this.scanlineY = (this.scanlineY + speed) % this.canvas.height;
    this.ctx.globalAlpha = 1.0;
  }
}
