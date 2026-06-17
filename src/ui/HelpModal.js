export class HelpModal {
  constructor() {
    this.btnHelp = document.getElementById('btn-help');
    this.btnCloseHelp = document.getElementById('btn-close-help');
    this.overlayHelp = document.getElementById('overlay-help');
    this.bindEvents();
  }

  bindEvents() {
    this.btnHelp.addEventListener('click', () => this.overlayHelp.classList.remove('hidden'));
    this.btnCloseHelp.addEventListener('click', () => this.overlayHelp.classList.add('hidden'));
    this.overlayHelp.addEventListener('click', (e) => {
      if (e.target === this.overlayHelp) this.overlayHelp.classList.add('hidden');
    });
  }
}
