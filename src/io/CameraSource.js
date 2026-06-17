import { eventBus } from '../core/EventBus.js';

export class CameraSource {
  constructor(videoElement) {
    this.videoElement = videoElement; // hidden-video DOM element
    this.streamActive = false;
    this.cameraStream = null;
  }

  enable() {
    if (this.streamActive) {
      eventBus.publish('camera:active', this.cameraStream);
      return Promise.resolve(this.cameraStream);
    }

    eventBus.publish('toast', { message: 'Initializing camera stream...' });

    return navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    })
      .then((stream) => {
        this.cameraStream = stream;
        this.videoElement.srcObject = stream;

        return new Promise((resolve) => {
          this.videoElement.onloadedmetadata = () => {
            this.videoElement.play();
            this.streamActive = true;
            eventBus.publish('camera:active', stream);
            eventBus.publish('toast', { message: 'Camera stream active' });
            resolve(stream);
          };
        });
      })
      .catch((err) => {
        console.error("Camera permissions error:", err);
        eventBus.publish('camera:error', err);
        eventBus.publish('toast', { message: 'Failed to access camera', color: '#ff3366' });
        throw err;
      });
  }

  disable() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
      this.streamActive = false;
      this.cameraStream = null;
      eventBus.publish('camera:inactive');
    }
  }

  isActive() {
    return this.streamActive;
  }
}
