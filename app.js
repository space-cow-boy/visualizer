/* ==========================================================================
   AETHER MOTION VISUALIZER - ENGINE
   ========================================================================== */

class AetherApp {
  constructor() {
    this.initElements();
    this.initVariables();
    this.bindEvents();
    this.setupCanvases();
    this.themeChange(this.settings.theme);
    
    // Start animation loop
    this.tick();
  }

  // 1. DOM Element Bindings
  initElements() {
    // Canvas elements
    this.canvas = document.getElementById('main-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.hiddenCanvas = document.getElementById('hidden-canvas');
    this.hiddenCtx = this.hiddenCanvas.getContext('2d', { willReadFrequently: true });
    
    // Video elements
    this.hiddenVideo = document.getElementById('hidden-video');
    this.uploadedVideo = document.getElementById('uploaded-video-element');
    
    // Sidebar Controls
    this.btnCamera = document.getElementById('btn-camera');
    this.btnVideo = document.getElementById('btn-video');
    this.videoUploadArea = document.getElementById('video-upload-area');
    this.videoInput = document.getElementById('video-input');
    this.uploadZone = document.getElementById('upload-zone');
    this.videoFileInfo = document.getElementById('video-file-info');
    this.btnRemoveVideo = document.getElementById('btn-remove-video');
    
    this.selectMode = document.getElementById('select-mode');
    this.selectTheme = document.getElementById('select-theme');
    
    // Sliders
    this.sliderSensitivity = document.getElementById('slider-sensitivity');
    this.sliderDecay = document.getElementById('slider-decay');
    this.sliderDensity = document.getElementById('slider-density');
    
    this.valSensitivity = document.getElementById('val-sensitivity');
    this.valDecay = document.getElementById('val-decay');
    this.valDensity = document.getElementById('val-density');
    
    // Action Buttons
    this.btnSnapshot = document.getElementById('btn-snapshot');
    this.videoControls = document.getElementById('video-controls');
    this.btnPlayPause = document.getElementById('btn-play-pause');
    this.btnMute = document.getElementById('btn-mute');
    this.videoProgressContainer = document.getElementById('video-progress-container');
    this.videoProgressFill = document.getElementById('video-progress-fill');
    
    // Icons
    this.iconPlay = document.getElementById('icon-play');
    this.iconPause = document.getElementById('icon-pause');
    this.iconVolume = document.getElementById('icon-volume');
    this.iconMute = document.getElementById('icon-mute');
    
    // Overlays & Modals
    this.overlaySetup = document.getElementById('overlay-setup');
    this.btnSetupCamera = document.getElementById('btn-setup-camera');
    this.btnSetupVideo = document.getElementById('btn-setup-video');
    this.cameraError = document.getElementById('camera-error');
    
    this.btnHelp = document.getElementById('btn-help');
    this.btnCloseHelp = document.getElementById('btn-close-help');
    this.overlayHelp = document.getElementById('overlay-help');
    
    this.toast = document.getElementById('toast');
  }

  // 2. State & Variables Setup
  initVariables() {
    // User Settings
    this.settings = {
      source: 'camera', // 'camera' or 'video'
      mode: 'particles', // 'particles', 'hologram', 'trails', 'matrix'
      theme: 'cyberpunk',
      sensitivity: 25,
      decay: 0.15,
      density: 75
    };

    // Color definitions for UI and particles
    this.themes = {
      cyberpunk: {
        primary: '#00f0ff', // Cyan
        secondary: '#ff007f', // Magenta
        rgb: '0, 240, 255',
        palette: ['#00f0ff', '#ff007f', '#00ffd8', '#ff00a0', '#ffffff']
      },
      synthwave: {
        primary: '#ff007f', // Pink
        secondary: '#bd00ff', // Purple
        rgb: '255, 0, 127',
        palette: ['#ff007f', '#bd00ff', '#7b00ff', '#00f0ff', '#ffffff']
      },
      aurora: {
        primary: '#00ffcc', // Teal
        secondary: '#7b00ff', // Violet Purple
        rgb: '0, 255, 204',
        palette: ['#00ffcc', '#7b00ff', '#00ffaa', '#bd00ff', '#ffffff']
      },
      emerald: {
        primary: '#39ff14', // Neon Green
        secondary: '#00a896', // Emerald Teal
        rgb: '57, 255, 20',
        palette: ['#39ff14', '#00a896', '#52ff88', '#028090', '#ffffff']
      },
      gold: {
        primary: '#ffaa00', // Neon Gold
        secondary: '#ff5500', // Neon Orange/Amber
        rgb: '255, 170, 0',
        palette: ['#ffaa00', '#ff5500', '#ffcc00', '#ff3300', '#ffffff']
      },
      rainbow: {
        primary: '#ffffff',
        secondary: '#ffffff',
        rgb: '255, 255, 255',
        palette: [] // Generated programmatically
      },
      monochrome: {
        primary: '#cbd5e1', // Silver
        secondary: '#64748b', // Slate Grey
        rgb: '203, 213, 225',
        palette: ['#ffffff', '#cbd5e1', '#94a3b8', '#64748b', '#475569']
      }
    };

    // Motion Detection Configuration
    this.motionWidth = 320; // Downsampled width for analysis (increased for high definition detail)
    this.motionHeight = 240; // Downsampled height for analysis (increased for high definition detail)
    this.prevFrameData = null;
    this.streamActive = false;
    this.videoLoaded = false;
    
    // Particle Visualizer variables
    this.particles = [];
    this.maxParticles = 800;

    // Hologram Effect variables
    this.scanlineY = 0;
    
    // Matrix Code Visualizer variables
    this.matrixGrid = [];
    this.matrixColumns = 0;
    this.matrixRows = 0;
    this.matrixCellSize = 14;
    this.matrixChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@&%*+-=';
    
    // Rainbow Trail variables
    this.rainbowHue = 0;
  }

  // 3. Canvas Setup
  setupCanvases() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Initialize Downsample canvas size
    this.hiddenCanvas.width = this.motionWidth;
    this.hiddenCanvas.height = this.motionHeight;
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Clear canvas with black initially
    this.ctx.fillStyle = '#080a0f';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Re-initialize grids
    this.initMatrixGrid();
    if (this.settings && this.settings.mode === 'cloth') {
      this.initClothGrid();
    }
  }

  // 4. Event Binding
  bindEvents() {
    // Source Switches
    this.btnCamera.addEventListener('click', () => this.setSource('camera'));
    this.btnVideo.addEventListener('click', () => this.setSource('video'));
    
    // Setup Screen Buttons
    this.btnSetupCamera.addEventListener('click', () => this.enableCamera());
    this.btnSetupVideo.addEventListener('click', () => {
      this.overlaySetup.classList.add('fade-out');
      this.setSource('video');
    });

    // File Drag & Drop
    this.uploadZone.addEventListener('click', () => this.videoInput.click());
    this.videoInput.addEventListener('change', (e) => this.handleVideoFile(e.target.files[0]));
    
    this.uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadZone.classList.add('dragover');
    });
    this.uploadZone.addEventListener('dragleave', () => {
      this.uploadZone.classList.remove('dragover');
    });
    this.uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this.handleVideoFile(e.dataTransfer.files[0]);
      }
    });

    this.btnRemoveVideo.addEventListener('click', () => this.removeVideo());

    // Video Playback Controls
    this.btnPlayPause.addEventListener('click', () => this.toggleVideoPlay());
    this.btnMute.addEventListener('click', () => this.toggleVideoMute());
    
    this.uploadedVideo.addEventListener('timeupdate', () => this.updateVideoProgress());
    this.videoProgressContainer.addEventListener('click', (e) => this.seekVideo(e));
    this.uploadedVideo.addEventListener('ended', () => {
      this.uploadedVideo.currentTime = 0;
      this.uploadedVideo.play();
    });

    // Style Adjustments
    this.selectMode.addEventListener('change', (e) => {
      this.settings.mode = e.target.value;
      if (this.settings.mode === 'matrix') {
        this.initMatrixGrid();
      } else if (this.settings.mode === 'cloth') {
        this.initClothGrid();
      }
    });

    this.selectTheme.addEventListener('change', (e) => this.themeChange(e.target.value));

    // Tuning Sliders
    this.sliderSensitivity.addEventListener('input', (e) => {
      this.settings.sensitivity = parseInt(e.target.value);
      this.valSensitivity.textContent = this.settings.sensitivity;
    });

    this.sliderDecay.addEventListener('input', (e) => {
      this.settings.decay = parseFloat(e.target.value);
      this.valDecay.textContent = this.settings.decay.toFixed(2);
    });

    this.sliderDensity.addEventListener('input', (e) => {
      this.settings.density = parseInt(e.target.value);
      this.valDensity.textContent = this.settings.density + '%';
    });

    // Global Actions
    this.btnSnapshot.addEventListener('click', () => this.takeSnapshot());
    
    // Help Modal Triggers
    this.btnHelp.addEventListener('click', () => this.overlayHelp.classList.remove('hidden'));
    this.btnCloseHelp.addEventListener('click', () => this.overlayHelp.classList.add('hidden'));
    this.overlayHelp.addEventListener('click', (e) => {
      if (e.target === this.overlayHelp) this.overlayHelp.classList.add('hidden');
    });
  }

  // 5. Input Source Operations
  setSource(source) {
    if (this.settings.source === source) return;
    
    this.settings.source = source;
    
    if (source === 'camera') {
      this.btnCamera.classList.add('active');
      this.btnVideo.classList.remove('active');
      this.videoUploadArea.classList.add('hidden');
      this.videoControls.classList.add('hidden');
      
      // Stop video file playback
      this.uploadedVideo.pause();
      
      // Restart camera stream
      this.enableCamera();
    } else {
      this.btnVideo.classList.add('active');
      this.btnCamera.classList.remove('active');
      this.videoUploadArea.classList.remove('hidden');
      
      // Stop live camera to turn off the user's camera LED (Privacy check)
      this.stopCameraStream();
      
      if (this.videoLoaded) {
        this.videoControls.classList.remove('hidden');
        this.uploadedVideo.play();
        this.iconPlay.classList.add('hidden');
        this.iconPause.classList.remove('hidden');
      }
    }
  }

  // Camera Management
  enableCamera() {
    if (this.streamActive) {
      this.overlaySetup.classList.add('fade-out');
      return;
    }

    this.showToast('Initializing camera stream...');

    navigator.mediaDevices.getUserMedia({
      video: { 
        width: { ideal: 1280 }, 
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    })
    .then((stream) => {
      this.cameraStream = stream;
      this.hiddenVideo.srcObject = stream;
      this.hiddenVideo.onloadedmetadata = () => {
        this.hiddenVideo.play();
        this.streamActive = true;
        this.overlaySetup.classList.add('fade-out');
        this.cameraError.classList.add('hidden');
        this.showToast('Camera stream active');
      };
    })
    .catch((err) => {
      console.error("Camera permissions error:", err);
      this.cameraError.classList.remove('hidden');
      this.showToast('Failed to access camera', '#ff3366');
      this.setSource('video');
    });
  }

  stopCameraStream() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.hiddenVideo.srcObject = null;
      this.streamActive = false;
    }
  }

  // Video File Upload Management
  handleVideoFile(file) {
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      this.showToast('Please select a valid video file.', '#ff3366');
      return;
    }

    this.showToast(`Loading: ${file.name}`);
    
    const url = URL.createObjectURL(file);
    this.uploadedVideo.src = url;
    this.uploadedVideo.load();
    
    this.uploadedVideo.onloadedmetadata = () => {
      this.videoLoaded = true;
      this.videoFileInfo.classList.remove('hidden');
      this.videoFileInfo.querySelector('.file-name').textContent = file.name;
      this.videoControls.classList.remove('hidden');
      
      this.uploadedVideo.play();
      this.iconPlay.classList.add('hidden');
      this.iconPause.classList.remove('hidden');
      
      this.showToast('Video loaded successfully');
      this.overlaySetup.classList.add('fade-out');
    };
  }

  removeVideo() {
    this.uploadedVideo.pause();
    this.uploadedVideo.src = '';
    this.videoLoaded = false;
    this.videoFileInfo.classList.add('hidden');
    this.videoControls.classList.add('hidden');
    this.videoInput.value = '';
    this.showToast('Video removed');
  }

  toggleVideoPlay() {
    if (!this.videoLoaded) return;
    if (this.uploadedVideo.paused) {
      this.uploadedVideo.play();
      this.iconPlay.classList.add('hidden');
      this.iconPause.classList.remove('hidden');
      this.showToast('Video playing');
    } else {
      this.uploadedVideo.pause();
      this.iconPlay.classList.remove('hidden');
      this.iconPause.classList.add('hidden');
      this.showToast('Video paused');
    }
  }

  toggleVideoMute() {
    if (!this.videoLoaded) return;
    this.uploadedVideo.muted = !this.uploadedVideo.muted;
    if (this.uploadedVideo.muted) {
      this.iconVolume.classList.add('hidden');
      this.iconMute.classList.remove('hidden');
      this.showToast('Audio muted');
    } else {
      this.iconVolume.classList.remove('hidden');
      this.iconMute.classList.add('hidden');
      this.showToast('Audio unmuted');
    }
  }

  updateVideoProgress() {
    if (!this.videoLoaded) return;
    const progress = (this.uploadedVideo.currentTime / this.uploadedVideo.duration) * 100;
    this.videoProgressFill.style.width = `${progress}%`;
  }

  seekVideo(event) {
    if (!this.videoLoaded) return;
    const rect = this.videoProgressContainer.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    this.uploadedVideo.currentTime = percent * this.uploadedVideo.duration;
  }

  // 6. UI Theming
  themeChange(themeName) {
    this.settings.theme = themeName;
    const theme = this.themes[themeName];
    
    // Set variables on document element for glassmorphic component accents
    document.documentElement.style.setProperty('--accent-glow', theme.primary);
    document.documentElement.style.setProperty('--accent-glow-rgb', theme.rgb);
    
    // Clear existing particles to match theme color seamlessly
    this.particles = [];
  }

  // 7. Motion Detection Engine (Core Algorithm)
  detectMotion() {
    let sourceElement = null;
    
    if (this.settings.source === 'camera' && this.streamActive) {
      sourceElement = this.hiddenVideo;
    } else if (this.settings.source === 'video' && this.videoLoaded && !this.uploadedVideo.paused) {
      sourceElement = this.uploadedVideo;
    }

    if (!sourceElement) return null;

    // 1. Draw source frame downsampled to small offscreen canvas
    this.hiddenCtx.drawImage(sourceElement, 0, 0, this.motionWidth, this.motionHeight);
    
    // 2. Fetch pixel details of downsampled frame
    const imgData = this.hiddenCtx.getImageData(0, 0, this.motionWidth, this.motionHeight);
    const pixels = imgData.data;
    
    const motionCoords = [];

    // 3. Pixel Differencing Loop
    if (this.prevFrameData) {
      const sensitivity = this.settings.sensitivity;
      const step = 4; // Check every pixel red channel, green channel, blue channel

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
          const x = pixelIndex % this.motionWidth;
          const y = Math.floor(pixelIndex / this.motionWidth);
          
          // Map to main canvas scale (flipping horizontal coordinate if it's webcam for mirror effect)
          let mappedX = (x / this.motionWidth) * this.canvas.width;
          if (this.settings.source === 'camera') {
            // Mirror live camera stream for standard webcam expectation
            mappedX = this.canvas.width - mappedX;
          }
          const mappedY = (y / this.motionHeight) * this.canvas.height;
          
          motionCoords.push({ x: mappedX, y: mappedY, val: diff });
        }
      }
    }

    // Cache current frame pixels for comparison in subsequent cycle
    this.prevFrameData = pixels;
    return motionCoords;
  }

  // 8. Visualizer Systems

  // Particles / Neon Dust
  updateParticles(motionPoints) {
    const activeTheme = this.themes[this.settings.theme];
    const density = this.settings.density / 100;

    // Spawn new particles from motion points
    if (motionPoints && motionPoints.length > 0) {
      const spawnChance = 0.08 * density;
      
      motionPoints.forEach(point => {
        if (Math.random() < spawnChance && this.particles.length < this.maxParticles) {
          // Color choice: Cycle through active theme palette or compute HSL for rainbow
          let color;
          if (this.settings.theme === 'rainbow') {
            color = `hsla(${this.rainbowHue}, 90%, 65%, 1.0)`;
          } else {
            color = activeTheme.palette[Math.floor(Math.random() * activeTheme.palette.length)];
          }
          
          // Spawn particle
          this.particles.push({
            x: point.x + (Math.random() * 30 - 15),
            y: point.y + (Math.random() * 30 - 15),
            vx: (Math.random() * 2 - 1) * 1.5,
            vy: (Math.random() * 2 - 1) * 1.5 - (Math.random() * 0.8), // subtle float upwards
            color: color,
            alpha: 1.0,
            decay: this.settings.decay * (0.05 + Math.random() * 0.08),
            size: Math.random() * 4 + 1.5
          });
        }
      });
    }

    // Physics Update and Canvas Draw
    this.ctx.globalCompositeOperation = 'screen';
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      
      // Radial glow particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.globalAlpha = 1.0;
    this.ctx.globalCompositeOperation = 'source-over';
  }

  // Hologram Effect
  drawHologram(motionPoints) {
    const theme = this.themes[this.settings.theme];
    let color;
    if (this.settings.theme === 'rainbow') {
      color = `hsla(${this.rainbowHue}, 90%, 60%, 0.8)`;
    } else {
      color = theme.primary;
    }

    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;

    // Draw active scan lines inside motion zones
    if (motionPoints && motionPoints.length > 0) {
      const density = this.settings.density / 100;
      const step = Math.max(1, Math.floor(25 / density)); // density regulates outlines count
      
      this.ctx.lineWidth = 1.5;
      
      for (let i = 0; i < motionPoints.length; i += step) {
        const point = motionPoints[i];
        
        // Horizontal scanned glow nodes
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, Math.random() * 3 + 1, 0, Math.PI * 2);
        this.ctx.fill();

        // High tech vector outlines (connect adjacent nodes)
        if (i > 0 && Math.random() < 0.15) {
          const prev = motionPoints[i - 1];
          // Ensure vector connects point proximity
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
    
    this.scanlineY = (this.scanlineY + 3) % this.canvas.height;
    this.ctx.globalAlpha = 1.0;
  }

  // Rainbow Trails / Fluid Painting
  drawRainbowTrails(motionPoints) {
    if (!motionPoints || motionPoints.length === 0) return;

    const density = this.settings.density / 100;
    const step = Math.max(1, Math.floor(10 / density));

    this.ctx.lineWidth = Math.random() * 4 + 2;
    this.ctx.lineCap = 'round';
    
    for (let i = 0; i < motionPoints.length; i += step) {
      const pt = motionPoints[i];
      
      // Compute dynamic color spectrum mapping coordinate and global phase
      const ptHue = (this.rainbowHue + (pt.x / this.canvas.width) * 120 + (pt.y / this.canvas.height) * 80) % 360;
      
      this.ctx.strokeStyle = `hsla(${ptHue}, 95%, 60%, 0.7)`;
      this.ctx.fillStyle = `hsla(${ptHue}, 95%, 60%, 0.7)`;
      
      // Draw smooth splats and vectors
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

  // Matrix Code Grid Management
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

  drawMatrixCode(motionPoints) {
    const density = this.settings.density / 100;
    
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

    const activeTheme = this.themes[this.settings.theme];
    let baseColor = activeTheme.primary;
    let customHue = this.rainbowHue;
    
    for (let c = 0; c < this.matrixColumns; c++) {
      const colData = this.matrixGrid[c];
      
      // Update vertical waterfall head position
      colData.y += colData.speed * 0.45;
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
          colData.motionHeat[r] -= this.settings.decay * 0.35;
        }
        
        // Draw character only if it contains motion heat
        if (heat > 0.05) {
          const char = colData.chars[r];
          const x = c * this.matrixCellSize + this.matrixCellSize / 2;
          const y = r * this.matrixCellSize + this.matrixCellSize;
          
          // Matrix Color configuration
          if (this.settings.theme === 'rainbow') {
            this.ctx.fillStyle = `hsla(${(customHue + c * 3 + r * 2) % 360}, 90%, 60%, ${heat})`;
          } else {
            // Bright white leading head character, colorized trails
            if (r === headIndex) {
              this.ctx.fillStyle = `rgba(255, 255, 255, ${heat})`;
            } else {
              this.ctx.fillStyle = baseColor;
              this.ctx.globalAlpha = heat * 0.85;
            }
          }

          // Randomize characters occasionally for digital feel
          if (Math.random() < 0.02 * density) {
            colData.chars[r] = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];
          }

          this.ctx.fillText(char, x, y);
          this.ctx.globalAlpha = 1.0;
        }
      }
    }
  }

  // 9. Snapshot Download Feature
  takeSnapshot() {
    this.showToast('Generating snapshot...');
    
    // Add visual flash effect
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100vw';
    flash.style.height = '100vh';
    flash.style.backgroundColor = '#ffffff';
    flash.style.zIndex = '9999';
    flash.style.opacity = '0.8';
    flash.style.transition = 'opacity 0.6s ease-out';
    document.body.appendChild(flash);
    
    setTimeout(() => {
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 600);
    }, 50);

    try {
      const dataUrl = this.canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/T|:/g, "-");
      
      link.download = `AETHER-motion-${this.settings.mode}-${timestamp}.png`;
      link.href = dataUrl;
      link.click();
      this.showToast('Snapshot downloaded successfully!');
    } catch (e) {
      console.error(e);
      this.showToast('Capture blocked: Canvas security restriction', '#ff3366');
    }
  }

  // Toast System
  showToast(message, color = '') {
    this.toast.textContent = message;
    if (color) {
      this.toast.style.borderColor = color;
      this.toast.style.color = color;
      this.toast.style.boxShadow = `0 0 15px ${color}88`;
    } else {
      const themeColor = this.themes[this.settings.theme].primary;
      this.toast.style.borderColor = themeColor;
      this.toast.style.color = '#fff';
      this.toast.style.boxShadow = `0 0 15px ${themeColor}55`;
    }
    
    this.toast.classList.remove('hidden');
    
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 3000);
  }

  // 9.5. Liquid Cloth Simulation Methods
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

  updateAndDrawCloth(motionPoints) {
    if (!this.clothGrid || this.clothGrid.length === 0) {
      this.initClothGrid();
    }

    const cols = this.clothCols;
    const rows = this.clothRows;
    const density = this.settings.density / 100;
    const sensitivity = this.settings.sensitivity;
    
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
        
        if (this.settings.theme === 'monochrome') {
          const grey = Math.floor(intensity * 180);
          rVal = grey; gVal = grey; bVal = grey;
        } else {
          const activeTheme = this.themes[this.settings.theme];
          const rgb = activeTheme.rgb.split(',').map(v => parseInt(v.trim()));
          
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

  // 10. Central Loop (Tick Frame Handler)
  tick() {
    // 1. Run motion detection algorithm
    const motionPoints = this.detectMotion();
    
    // 2. Slow trail decay using screen overlays
    // This allows visual elements to slowly disappear or leave long-exposure trails
    this.ctx.fillStyle = `rgba(8, 10, 15, ${this.settings.decay})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Update global rainbow color cycling
    this.rainbowHue = (this.rainbowHue + 0.8) % 360;

    // 3. Delegate rendering to selected mode
    switch (this.settings.mode) {
      case 'particles':
        this.updateParticles(motionPoints);
        break;
      case 'hologram':
        this.drawHologram(motionPoints);
        break;
      case 'trails':
        this.drawRainbowTrails(motionPoints);
        break;
      case 'matrix':
        this.drawMatrixCode(motionPoints);
        break;
      case 'cloth':
        this.updateAndDrawCloth(motionPoints);
        break;
    }

    // Loop
    requestAnimationFrame(() => this.tick());
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AetherApp();
});
