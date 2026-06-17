import { RendererInterface } from './RendererInterface.js';

export class TrailRenderer extends RendererInterface {
  init(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  update(motionPoints, dt, state, rainbowHue) {
    if (!motionPoints || motionPoints.length === 0) return;

    const density = state.getSetting('density') / 100;
    const step = Math.max(1, Math.floor(10 / density));

    this.ctx.lineWidth = Math.random() * 4 + 2;
    this.ctx.lineCap = 'round';
    
    for (let i = 0; i < motionPoints.length; i += step) {
      const pt = motionPoints[i];
      
      const ptHue = (rainbowHue + (pt.x / this.canvas.width) * 120 + (pt.y / this.canvas.height) * 80) % 360;
      
      this.ctx.strokeStyle = `hsla(${ptHue}, 95%, 60%, 0.7)`;
      this.ctx.fillStyle = `hsla(${ptHue}, 95%, 60%, 0.7)`;
      
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, this.ctx.lineWidth, 0, Math.PI * 2);
      this.ctx.fill();
      
      if (i > 0 && Math.random() < 0.4) {
        const prev = motionPoints[i - 1];
        const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
        if (dist < 100) {
          this.ctx.beginPath();
          this.ctx.moveTo(prev.x, prev.y);
          this.ctx.lineTo(pt.x, pt.y);
          this.ctx.stroke();
        }
      }
    }
  }
}
