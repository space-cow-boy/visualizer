import { RendererInterface } from './RendererInterface.js';

export class MatrixRenderer extends RendererInterface {
  init(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.matrixCellSize = 14;
    this.matrixChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@&%*+-=';
    this.initMatrixGrid();
  }

  resize(canvas) {
    this.initMatrixGrid();
  }

  initMatrixGrid() {
    this.matrixColumns = Math.ceil(this.canvas.width / this.matrixCellSize);
    this.matrixRows = Math.ceil(this.canvas.height / this.matrixCellSize);
    
    this.matrixGrid = [];
    for (let c = 0; c < this.matrixColumns; c++) {
      this.matrixGrid[c] = {
        y: Math.random() * -this.matrixRows, // Random starting row offset
        speed: 1 + Math.random() * 1.5,
        chars: [],
        motionHeat: new Float32Array(this.matrixRows) // Store activation heat maps
      };
      
      // Pre-fill characters for column height
      for (let r = 0; r < this.matrixRows; r++) {
        this.matrixGrid[c].chars[r] = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];
      }
    }
  }

  update(motionPoints, dt, state, rainbowHue) {
    const density = state.getSetting('density') / 100;
    const decay = state.getSetting('decay');
    const themeName = state.getSetting('theme');
    const activeTheme = state.getTheme();
    
    // 1. Inject Motion Heat into Column Grids
    if (motionPoints && motionPoints.length > 0) {
      motionPoints.forEach(pt => {
        const col = Math.floor(pt.x / this.matrixCellSize);
        const row = Math.floor(pt.y / this.matrixCellSize);
        
        if (col >= 0 && col < this.matrixColumns && row >= 0 && row < this.matrixRows) {
          // Heat level set to full intensity
          this.matrixGrid[col].motionHeat[row] = 1.0;
          
          // Spread heat subtly to neighboring grid cells
          if (row > 0) this.matrixGrid[col].motionHeat[row - 1] = Math.max(this.matrixGrid[col].motionHeat[row - 1], 0.5);
          if (row < this.matrixRows - 1) this.matrixGrid[col].motionHeat[row + 1] = Math.max(this.matrixGrid[col].motionHeat[row + 1], 0.5);
        }
      });
    }

    // 2. Render Loop Matrix Code Columns
    this.ctx.font = `600 ${this.matrixCellSize - 1}px monospace`;
    this.ctx.textAlign = 'center';

    let baseColor = activeTheme.primary;
    
    for (let c = 0; c < this.matrixColumns; c++) {
      const colData = this.matrixGrid[c];
      
      // Update vertical waterfall head position
      // Frame rate decoupled speed based on 60fps baseline
      const step = colData.speed * 27 * dt;
      colData.y += step;
      if (colData.y >= this.matrixRows) {
        colData.y = -5;
        colData.speed = 1 + Math.random() * 1.5;
      }
      
      const headIndex = Math.floor(colData.y);
      
      // Render visible column characters
      for (let r = 0; r < this.matrixRows; r++) {
        const heat = colData.motionHeat[r];
        
        // Slowly decay active grid cell heat over time
        if (colData.motionHeat[r] > 0) {
          const decayAmt = decay * 0.35 * 60 * dt;
          colData.motionHeat[r] -= decayAmt;
        }
        
        // Draw character only if it contains motion heat
        if (heat > 0.05) {
          const char = colData.chars[r];
          const x = c * this.matrixCellSize + this.matrixCellSize / 2;
          const y = r * this.matrixCellSize + this.matrixCellSize;
          
          // Matrix Color configuration
          if (themeName === 'rainbow') {
            this.ctx.fillStyle = `hsla(${(rainbowHue + c * 3 + r * 2) % 360}, 90%, 60%, ${heat})`;
          } else {
            // Bright white leading head character, colorized trails
            if (r === headIndex) {
              this.ctx.fillStyle = `rgba(255, 255, 255, ${heat})`;
            } else {
              this.ctx.fillStyle = baseColor;
              this.ctx.globalAlpha = heat * 0.85;
            }
          }

          // Randomize characters occasionally for digital feel, scaled with dt
          const changeChance = 1 - Math.pow(1 - 0.02 * density, 60 * dt);
          if (Math.random() < changeChance) {
            colData.chars[r] = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];
          }

          this.ctx.fillText(char, x, y);
          this.ctx.globalAlpha = 1.0;
        }
      }
    }
  }
}
