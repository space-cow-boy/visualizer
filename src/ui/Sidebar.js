import { eventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';

export class Sidebar {
  constructor(cameraSource, videoSource) {
    this.cameraSource = cameraSource;
    this.videoSource = videoSource;
    this.initElements();
    this.bindEvents();
    this.listenToEvents();
  }

  initElements() {
    this.btnCamera = document.getElementById('btn-camera');
    this.btnVideo = document.getElementById('btn-video');
    this.videoUploadArea = document.getElementById('video-upload-area');
    this.videoInput = document.getElementById('video-input');
    this.uploadZone = document.getElementById('upload-zone');
    this.videoFileInfo = document.getElementById('video-file-info');
    this.btnRemoveVideo = document.getElementById('btn-remove-video');

    this.selectMode = document.getElementById('select-mode');
    this.selectTheme = document.getElementById('select-theme');

    this.sliderSensitivity = document.getElementById('slider-sensitivity');
    this.sliderDecay = document.getElementById('slider-decay');
    this.sliderDensity = document.getElementById('slider-density');

    this.valSensitivity = document.getElementById('val-sensitivity');
    this.valDecay = document.getElementById('val-decay');
    this.valDensity = document.getElementById('val-density');

    this.btnSnapshot = document.getElementById('btn-snapshot');
    this.videoControls = document.getElementById('video-controls');
    this.btnPlayPause = document.getElementById('btn-play-pause');
    this.btnMute = document.getElementById('btn-mute');
    this.videoProgressContainer = document.getElementById('video-progress-container');
    this.videoProgressFill = document.getElementById('video-progress-fill');

    this.iconPlay = document.getElementById('icon-play');
    this.iconPause = document.getElementById('icon-pause');
    this.iconVolume = document.getElementById('icon-volume');
    this.iconMute = document.getElementById('icon-mute');
  }

  bindEvents() {
    // Source Switches
    this.btnCamera.addEventListener('click', () => this.handleSourceChange('camera'));
    this.btnVideo.addEventListener('click', () => this.handleSourceChange('video'));

    // File Drag & Drop
    this.uploadZone.addEventListener('click', () => this.videoInput.click());
    this.videoInput.addEventListener('change', (e) => this.videoSource.handleFile(e.target.files[0]));

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
        this.videoSource.handleFile(e.dataTransfer.files[0]);
      }
    });

    this.btnRemoveVideo.addEventListener('click', () => this.videoSource.remove());

    // Video Playback Controls
    this.btnPlayPause.addEventListener('click', () => this.videoSource.togglePlay());
    this.btnMute.addEventListener('click', () => this.videoSource.toggleMute());
    this.videoProgressContainer.addEventListener('click', (e) => this.seekVideo(e));

    // Dropdowns -> State
    this.selectMode.addEventListener('change', (e) => appState.setSetting('mode', e.target.value));
    this.selectTheme.addEventListener('change', (e) => appState.setSetting('theme', e.target.value));

    // Sliders -> State
    this.sliderSensitivity.addEventListener('input', (e) => {
      appState.setSetting('sensitivity', parseInt(e.target.value));
    });
    this.sliderDecay.addEventListener('input', (e) => {
      appState.setSetting('decay', parseFloat(e.target.value));
    });
    this.sliderDensity.addEventListener('input', (e) => {
      appState.setSetting('density', parseInt(e.target.value));
    });

    // Snapshot Trigger
    this.btnSnapshot.addEventListener('click', () => eventBus.publish('snapshot:request'));
  }

  listenToEvents() {
    // Sync state changes back to UI elements
    eventBus.subscribe('settings:sensitivity', (val) => {
      this.sliderSensitivity.value = val;
      this.valSensitivity.textContent = val;
    });
    eventBus.subscribe('settings:decay', (val) => {
      this.sliderDecay.value = val;
      this.valDecay.textContent = val.toFixed(2);
    });
    eventBus.subscribe('settings:density', (val) => {
      this.sliderDensity.value = val;
      this.valDensity.textContent = val + '%';
    });

    // Theme Accent updates
    eventBus.subscribe('settings:theme', (themeName) => {
      const theme = appState.getTheme(themeName);
      document.documentElement.style.setProperty('--accent-glow', theme.primary);
      document.documentElement.style.setProperty('--accent-glow-rgb', theme.rgb);
    });

    // Video Source Events
    eventBus.subscribe('video:loaded', (data) => {
      this.videoFileInfo.classList.remove('hidden');
      this.videoFileInfo.querySelector('.file-name').textContent = data.name;
      this.videoControls.classList.remove('hidden');

      this.iconPlay.classList.add('hidden');
      this.iconPause.classList.remove('hidden');
    });

    eventBus.subscribe('video:removed', () => {
      this.videoFileInfo.classList.add('hidden');
      this.videoControls.classList.add('hidden');
      this.videoInput.value = '';
    });

    eventBus.subscribe('video:play', () => {
      this.iconPlay.classList.add('hidden');
      this.iconPause.classList.remove('hidden');
    });

    eventBus.subscribe('video:pause', () => {
      this.iconPlay.classList.remove('hidden');
      this.iconPause.classList.add('hidden');
    });

    eventBus.subscribe('video:mute', (isMuted) => {
      if (isMuted) {
        this.iconVolume.classList.add('hidden');
        this.iconMute.classList.remove('hidden');
      } else {
        this.iconVolume.classList.remove('hidden');
        this.iconMute.classList.add('hidden');
      }
    });

    eventBus.subscribe('video:progress', (progress) => {
      this.videoProgressFill.style.width = `${progress}%`;
    });
  }

  handleSourceChange(source) {
    if (appState.getSetting('source') === source) return;

    appState.setSetting('source', source);

    if (source === 'camera') {
      this.btnCamera.classList.add('active');
      this.btnVideo.classList.remove('active');
      this.videoUploadArea.classList.add('hidden');
      this.videoControls.classList.add('hidden');

      this.videoSource.pause();
      this.cameraSource.enable().catch(() => { });
    } else {
      this.btnVideo.classList.add('active');
      this.btnCamera.classList.remove('active');
      this.videoUploadArea.classList.remove('hidden');

      this.cameraSource.disable();

      if (this.videoSource.isLoaded()) {
        this.videoControls.classList.remove('hidden');
        this.videoSource.play();
      }
    }
  }

  seekVideo(event) {
    if (!this.videoSource.isLoaded()) return;
    const rect = this.videoProgressContainer.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    this.videoSource.seek(percent);
  }
}
