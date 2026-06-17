import './style.css'; // Bundle styles via Vite!

import { eventBus } from './core/EventBus.js';
import { appState } from './core/AppState.js';
import { MotionDetector } from './core/MotionDetector.js';

import { CameraSource } from './io/CameraSource.js';
import { VideoFileSource } from './io/VideoFileSource.js';

import { ParticleRenderer } from './renderers/ParticleRenderer.js';
import { HologramRenderer } from './renderers/HologramRenderer.js';
import { TrailRenderer } from './renderers/TrailRenderer.js';
import { MatrixRenderer } from './renderers/MatrixRenderer.js';
import { ClothRenderer } from './renderers/ClothRenderer.js';

import { Sidebar } from './ui/Sidebar.js';
import { Toast } from './ui/Toast.js';
import { HelpModal } from './ui/HelpModal.js';
import { SnapshotButton } from './ui/SnapshotButton.js';

class AetherApp {
  constructor() {
    this.initCanvas();
    this.initSources();
    this.initRenderers();
    this.initUI();
    this.initLoopVariables();

    // Initial theme setup
    this.applyTheme(appState.getSetting('theme'));

    this.bindGlobalEvents();

    // Start loop
    this.lastTime = performance.now();
    this.tick();
  }

  initCanvas() {
    this.canvas = document.getElementById('main-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Clear canvas with black initially
    this.ctx.fillStyle = '#080a0f';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Notify active renderer of resize
    if (this.activeRenderer) {
      this.activeRenderer.resize(this.canvas);
    }
  }

  initSources() {
    const hiddenVideo = document.getElementById('hidden-video');
    const uploadedVideo = document.getElementById('uploaded-video-element');

    this.cameraSource = new CameraSource(hiddenVideo);
    this.videoFileSource = new VideoFileSource(uploadedVideo);

    this.motionDetector = new MotionDetector(320, 240);
  }

  initRenderers() {
    this.renderers = {
      particles: new ParticleRenderer(),
      hologram: new HologramRenderer(),
      trails: new TrailRenderer(),
      matrix: new MatrixRenderer(),
      cloth: new ClothRenderer()
    };

    // Initialize all renderers
    Object.values(this.renderers).forEach(renderer => {
      renderer.init(this.canvas, this.ctx);
    });

    // Active renderer setup
    const initialMode = appState.getSetting('mode');
    this.activeRenderer = this.renderers[initialMode];
  }

  initUI() {
    this.sidebar = new Sidebar(this.cameraSource, this.videoFileSource);
    this.toast = new Toast();
    this.helpModal = new HelpModal();
    this.snapshotButton = new SnapshotButton(this.canvas);

    // Setup welcome overlay elements
    this.overlaySetup = document.getElementById('overlay-setup');
    this.btnSetupCamera = document.getElementById('btn-setup-camera');
    this.btnSetupVideo = document.getElementById('btn-setup-video');
    this.cameraError = document.getElementById('camera-error');
  }

  initLoopVariables() {
    this.rainbowHue = 0;
  }

  applyTheme(themeName) {
    const theme = appState.getTheme(themeName);
    document.documentElement.style.setProperty('--accent-glow', theme.primary);
    document.documentElement.style.setProperty('--accent-glow-rgb', theme.rgb);
  }

  bindGlobalEvents() {
    // Listen to source/mode updates from settings
    eventBus.subscribe('settings:mode', (mode) => {
      this.activeRenderer = this.renderers[mode];
      if (this.activeRenderer) {
        this.activeRenderer.resize(this.canvas);
      }
    });

    eventBus.subscribe('settings:source', () => {
      this.motionDetector.clear();
    });

    // Welcome Screen triggers
    this.btnSetupCamera.addEventListener('click', () => {
      this.cameraSource.enable().catch((err) => {
        this.cameraError.classList.remove('hidden');
      });
    });

    this.btnSetupVideo.addEventListener('click', () => {
      this.overlaySetup.classList.add('fade-out');
      appState.setSetting('source', 'video');
    });

    eventBus.subscribe('camera:active', () => {
      this.overlaySetup.classList.add('fade-out');
      this.cameraError.classList.add('hidden');
    });
  }

  tick() {
    const now = performance.now();
    // Clamp dt for tab-switch spikes
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    // 1. Run motion detection algorithm
    let sourceElement = null;
    const currentSource = appState.getSetting('source');

    if (currentSource === 'camera' && this.cameraSource.isActive()) {
      sourceElement = this.cameraSource.videoElement;
    } else if (currentSource === 'video' && this.videoFileSource.isLoaded() && !this.videoFileSource.isPaused()) {
      sourceElement = this.videoFileSource.videoElement;
    }

    const motionPoints = this.motionDetector.detect(
      sourceElement,
      currentSource === 'camera',
      this.canvas.width,
      this.canvas.height,
      appState.getSetting('sensitivity')
    );

    // 2. Decouple trail decay from frame rate
    // Each frame fades the screen by multiplying existing pixels by (1 - decay).
    // Over time dt, the effective fade multiplier is (1 - decay)^(60 * dt).
    const decay = appState.getSetting('decay');
    const effectiveDecay = 1 - Math.pow(1 - decay, 60 * dt);
    this.ctx.fillStyle = `rgba(8, 10, 15, ${effectiveDecay})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Update global rainbow color cycling (48 degrees per second, equivalent to 0.8 at 60fps)
    this.rainbowHue = (this.rainbowHue + 48 * dt) % 360;

    // 3. Delegate rendering to selected mode
    if (this.activeRenderer) {
      this.activeRenderer.update(motionPoints, dt, appState, this.rainbowHue);
    }

    requestAnimationFrame(() => this.tick());
  }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AetherApp();
});
