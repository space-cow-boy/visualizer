import { eventBus } from '../core/EventBus.js';

export class VideoFileSource {
  constructor(videoElement) {
    this.videoElement = videoElement; // uploaded-video-element DOM element
    this.loaded = false;
    this.setupEvents();
  }

  setupEvents() {
    this.videoElement.addEventListener('timeupdate', () => {
      if (!this.loaded) return;
      const progress = (this.videoElement.currentTime / this.videoElement.duration) * 100;
      eventBus.publish('video:progress', progress);
    });

    this.videoElement.addEventListener('ended', () => {
      this.videoElement.currentTime = 0;
      this.videoElement.play();
    });
  }

  handleFile(file) {
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      eventBus.publish('toast', { message: 'Please select a valid video file.', color: '#ff3366' });
      return;
    }

    eventBus.publish('toast', { message: `Loading: ${file.name}` });
    
    const url = URL.createObjectURL(file);
    this.videoElement.src = url;
    this.videoElement.load();
    
    this.videoElement.onloadedmetadata = () => {
      this.loaded = true;
      eventBus.publish('video:loaded', { name: file.name });
      eventBus.publish('toast', { message: 'Video loaded successfully' });
      this.play();
    };
  }

  remove() {
    this.pause();
    this.videoElement.removeAttribute('src');
    this.videoElement.load();
    this.loaded = false;
    eventBus.publish('video:removed');
    eventBus.publish('toast', { message: 'Video removed' });
  }

  play() {
    if (!this.loaded) return;
    this.videoElement.play();
    eventBus.publish('video:play');
  }

  pause() {
    if (!this.loaded) return;
    this.videoElement.pause();
    eventBus.publish('video:pause');
  }

  togglePlay() {
    if (!this.loaded) return;
    if (this.videoElement.paused) {
      this.play();
      eventBus.publish('toast', { message: 'Video playing' });
    } else {
      this.pause();
      eventBus.publish('toast', { message: 'Video paused' });
    }
  }

  toggleMute() {
    if (!this.loaded) return;
    this.videoElement.muted = !this.videoElement.muted;
    eventBus.publish('video:mute', this.videoElement.muted);
    if (this.videoElement.muted) {
      eventBus.publish('toast', { message: 'Audio muted' });
    } else {
      eventBus.publish('toast', { message: 'Audio unmuted' });
    }
  }

  seek(percent) {
    if (!this.loaded) return;
    this.videoElement.currentTime = percent * this.videoElement.duration;
  }

  isPaused() {
    return this.videoElement.paused;
  }

  isLoaded() {
    return this.loaded;
  }
}
