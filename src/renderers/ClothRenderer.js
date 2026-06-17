import { RendererInterface } from './RendererInterface.js';

export class ClothRenderer extends RendererInterface {
  init(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.initClothGrid();
  }

  resize(canvas) {
    this.initClothGrid();
  }

  initClothGrid() {
    this.clothCols = 70;
    this.clothRows = 50;
    this.clothGrid = [];
    
    for (let c = 0; c <= this.clothCols; c++) {
      this.clothGrid[c] = [];
      for (let r = 0; r <= this.clothRows; r++) {
        const x = (c / this.clothCols) * this.canvas.width;
        const y = (r / this.clothRows) * this.canvas.height;
        
        // Base drapery wave structures
        const baseZ = Math.sin(c * 0.35) * 15 + Math.cos(c * 0.15 + r * 0.08) * 8;
        
        this.clothGrid[c][r] = {
          x: x,
          y: y,
          px: x,
          py: y,
          z: 0,
          zTarget: 0,
          baseZ: baseZ
        };
      }
    }
  }

  update(motionPoints, dt, state, rainbowHue) {
    if (!this.clothGrid || this.clothGrid.length === 0) {
      this.initClothGrid();
    }

    const cols = this.clothCols;
    const rows = this.clothRows;
    const density = state.getSetting('density') / 100;
    const sensitivity = state.getSetting('sensitivity');
    const themeName = state.getSetting('theme');
    
    // 1. Apply motion push forces
    if (motionPoints && motionPoints.length > 0) {
      const step = Math.max(1, Math.floor(10 / (density * 2)));
      const radius = 110;
      
      for (let i = 0; i < motionPoints.length; i += step) {
        const pt = motionPoints[i];
        
        const colStart = Math.max(0, Math.floor(((pt.x - radius) / this.canvas.width) * cols));
        const colEnd = Math.min(cols, Math.ceil(((pt.x + radius) / this.canvas.width) * cols));
        const rowStart = Math.max(0, Math.floor(((pt.y - radius) / this.canvas.height) * rows));
        const rowEnd = Math.min(rows, Math.ceil(((pt.y + radius) / this.canvas.height) * rows));
        
        for (let c = colStart; c <= colEnd; c++) {
          for (let r = rowStart; r <= rowEnd; r++) {
            const node = this.clothGrid[c][r];
            const dx = node.x - pt.x;
            const dy = node.y - pt.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < radius) {
              const force = (1.0 - dist / radius) * 45 * (1.2 - sensitivity / 80);
              node.zTarget += force;
            }
          }
        }
      }
    }

    // 2. Physics & spring updates
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        const node = this.clothGrid[c][r];
        
        node.z += (node.zTarget - node.z) * 0.12;
        node.zTarget *= 0.88;
        
        if (c > 0 && c < cols && r > 0 && r < rows) {
          const left = this.clothGrid[c-1][r].z;
          const right = this.clothGrid[c+1][r].z;
          const up = this.clothGrid[c][r-1].z;
          const down = this.clothGrid[c][r+1].z;
          
          node.z = node.z * 0.65 + ((left + right + up + down) / 4) * 0.35;
        }

        const totalZ = node.baseZ + node.z;

        // 3D projection outward bulge
        node.px = node.x + (node.x - centerX) * (totalZ * 0.0006);
        node.py = node.y + (node.y - centerY) * (totalZ * 0.0006);
        node.totalZ = totalZ;
      }
    }

    // 3. Render shaded polygons
    this.ctx.globalCompositeOperation = 'source-over';
    
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const p00 = this.clothGrid[c][r];
        const p10 = this.clothGrid[c+1][r];
        const p01 = this.clothGrid[c][r+1];
        const p11 = this.clothGrid[c+1][r+1];

        const dzdx = p10.totalZ - p00.totalZ;
        const dzdy = p01.totalZ - p00.totalZ;

        let nx = -dzdx * 1.5;
        let ny = -dzdy * 1.5;
        let nz = 16;
        const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
        nx /= len;
        ny /= len;
        nz /= len;

        const dot = nx * 0.5 - ny * 0.4 + nz * 0.75;
        const intensity = 0.2 + 0.8 * Math.max(0, dot);
        
        let rVal, gVal, bVal;
        
        if (themeName === 'monochrome') {
          const grey = Math.floor(intensity * 180);
          rVal = grey; gVal = grey; bVal = grey;
        } else {
          const activeTheme = state.getTheme();
          let rgb;
          if (themeName === 'rainbow') {
            rgb = this.hslToRgb(rainbowHue / 360, 0.9, 0.6);
          } else {
            rgb = activeTheme.rgb.split(',').map(v => parseInt(v.trim()));
          }
          
          rVal = Math.floor(intensity * (rgb[0] * 0.55 + 90));
          gVal = Math.floor(intensity * (rgb[1] * 0.55 + 90));
          bVal = Math.floor(intensity * (rgb[2] * 0.55 + 90));
        }

        this.ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
        
        this.ctx.beginPath();
        this.ctx.moveTo(p00.px, p00.py);
        this.ctx.lineTo(p10.px, p10.py);
        this.ctx.lineTo(p11.px, p11.py);
        this.ctx.lineTo(p01.px, p01.py);
        this.ctx.closePath();
        this.ctx.fill();
      }
    }

    // 4. Thread lines
    this.ctx.lineWidth = 0.5;
    for (let c = 0; c <= cols; c += 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.clothGrid[c][0].px, this.clothGrid[c][0].py);
      for (let r = 1; r <= rows; r++) {
        this.ctx.lineTo(this.clothGrid[c][r].px, this.clothGrid[c][r].py);
      }
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      this.ctx.stroke();
    }
    
    for (let r = 0; r <= rows; r += 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.clothGrid[0][r].px, this.clothGrid[0][r].py);
      for (let c = 1; c <= cols; c++) {
        this.ctx.lineTo(this.clothGrid[c][r].px, this.clothGrid[c][r].py);
      }
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      this.ctx.stroke();
    }

    // 5. Film grain overlay
    const grainCount = 10000;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < grainCount; i++) {
      const gx = Math.random() * this.canvas.width;
      const gy = Math.random() * this.canvas.height;
      this.ctx.fillRect(gx, gy, 1, 1);
    }
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    for (let i = 0; i < grainCount; i++) {
      const gx = Math.random() * this.canvas.width;
      const gy = Math.random() * this.canvas.height;
      this.ctx.fillRect(gx, gy, 1, 1);
    }
  }

  hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
}
