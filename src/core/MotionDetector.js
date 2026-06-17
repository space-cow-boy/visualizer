export class MotionDetector {
  constructor(width = 320, height = 240) {
    this.width = width;
    this.height = height;
    
    this.hiddenCanvas = document.createElement('canvas');
    this.hiddenCanvas.width = this.width;
    this.hiddenCanvas.height = this.height;
    this.hiddenCtx = this.hiddenCanvas.getContext('2d', { willReadFrequently: true });
    
    this.prevFrameData = null;
  }

  detect(sourceElement, isCamera, canvasWidth, canvasHeight, sensitivity) {
    if (!sourceElement) return null;

    // 1. Draw source frame downsampled to small offscreen canvas
    this.hiddenCtx.drawImage(sourceElement, 0, 0, this.width, this.height);
    
    // 2. Fetch pixel details of downsampled frame
    const imgData = this.hiddenCtx.getImageData(0, 0, this.width, this.height);
    const pixels = imgData.data;
    
    const motionCoords = [];

    // 3. Pixel Differencing Loop
    if (this.prevFrameData) {
      const step = 4; // Check every pixel red, green, blue channels

      for (let i = 0; i < pixels.length; i += step) {
        const r1 = pixels[i];
        const g1 = pixels[i + 1];
        const b1 = pixels[i + 2];
        
        const r2 = this.prevFrameData[i];
        const g2 = this.prevFrameData[i + 1];
        const b2 = this.prevFrameData[i + 2];

        // Total absolute difference
        const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

        if (diff > sensitivity) {
          const pixelIndex = i / 4;
          const x = pixelIndex % this.width;
          const y = Math.floor(pixelIndex / this.width);
          
          // Map to main canvas scale (mirror if source is webcam)
          let mappedX = (x / this.width) * canvasWidth;
          if (isCamera) {
            mappedX = canvasWidth - mappedX;
          }
          const mappedY = (y / this.height) * canvasHeight;
          
          motionCoords.push({ x: mappedX, y: mappedY, val: diff });
        }
      }
    }

    // Cache current frame pixels for comparison in subsequent cycle
    this.prevFrameData = pixels;
    return motionCoords;
  }

  clear() {
    this.prevFrameData = null;
  }
}
