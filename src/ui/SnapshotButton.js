import { eventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';

export class SnapshotButton {
  constructor(canvas) {
    this.canvas = canvas;
    this.listenToEvents();
  }

  listenToEvents() {
    eventBus.subscribe('snapshot:request', () => this.takeSnapshot());
  }

  takeSnapshot() {
    eventBus.publish('toast', { message: 'Generating snapshot...' });
    
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
      const mode = appState.getSetting('mode');
      
      link.download = `AETHER-motion-${mode}-${timestamp}.png`;
      link.href = dataUrl;
      link.click();
      eventBus.publish('toast', { message: 'Snapshot downloaded successfully!' });
    } catch (e) {
      console.error(e);
      eventBus.publish('toast', { message: 'Capture blocked: Canvas security restriction', color: '#ff3366' });
    }
  }
}
