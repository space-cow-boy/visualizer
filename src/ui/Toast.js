import { eventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';

export class Toast {
  constructor() {
    this.toastElement = document.getElementById('toast');
    this.timeoutId = null;
    this.listenToEvents();
  }

  listenToEvents() {
    eventBus.subscribe('toast', ({ message, color }) => {
      this.show(message, color);
    });
  }

  show(message, color = '') {
    this.toastElement.textContent = message;
    if (color) {
      this.toastElement.style.borderColor = color;
      this.toastElement.style.color = color;
      this.toastElement.style.boxShadow = `0 0 15px ${color}88`;
    } else {
      const themeColor = appState.getTheme().primary;
      this.toastElement.style.borderColor = themeColor;
      this.toastElement.style.color = '#fff';
      this.toastElement.style.boxShadow = `0 0 15px ${themeColor}55`;
    }
    
    this.toastElement.classList.remove('hidden');
    
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.toastElement.classList.add('hidden');
    }, 3000);
  }
}
