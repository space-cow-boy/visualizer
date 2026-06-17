import { eventBus } from './EventBus.js';

class AppState {
  constructor() {
    this.settings = {
      source: 'camera', // 'camera' or 'video'
      mode: 'particles', // 'particles', 'hologram', 'trails', 'matrix', 'cloth'
      theme: 'cyberpunk',
      sensitivity: 25,
      decay: 0.15,
      density: 75
    };

    this.themes = {
      cyberpunk: {
        primary: '#00f0ff',
        secondary: '#ff007f',
        rgb: '0, 240, 255',
        palette: ['#00f0ff', '#ff007f', '#00ffd8', '#ff00a0', '#ffffff']
      },
      synthwave: {
        primary: '#ff007f',
        secondary: '#bd00ff',
        rgb: '255, 0, 127',
        palette: ['#ff007f', '#bd00ff', '#7b00ff', '#00f0ff', '#ffffff']
      },
      aurora: {
        primary: '#00ffcc',
        secondary: '#7b00ff',
        rgb: '0, 255, 204',
        palette: ['#00ffcc', '#7b00ff', '#00ffaa', '#bd00ff', '#ffffff']
      },
      emerald: {
        primary: '#39ff14',
        secondary: '#00a896',
        rgb: '57, 255, 20',
        palette: ['#39ff14', '#00a896', '#52ff88', '#028090', '#ffffff']
      },
      gold: {
        primary: '#ffaa00',
        secondary: '#ff5500',
        rgb: '255, 170, 0',
        palette: ['#ffaa00', '#ff5500', '#ffcc00', '#ff3300', '#ffffff']
      },
      rainbow: {
        primary: '#ffffff',
        secondary: '#ffffff',
        rgb: '255, 255, 255',
        palette: []
      },
      monochrome: {
        primary: '#cbd5e1',
        secondary: '#64748b',
        rgb: '203, 213, 225',
        palette: ['#ffffff', '#cbd5e1', '#94a3b8', '#64748b', '#475569']
      }
    };
  }

  getSetting(key) {
    return this.settings[key];
  }

  setSetting(key, value) {
    if (this.settings[key] === value) return;
    const prevValue = this.settings[key];
    this.settings[key] = value;

    eventBus.publish(`settings:${key}`, value);
    eventBus.publish('settings:change', { key, value, prevValue });
  }

  getTheme(themeName) {
    return this.themes[themeName || this.settings.theme];
  }
}

export const appState = new AppState();
