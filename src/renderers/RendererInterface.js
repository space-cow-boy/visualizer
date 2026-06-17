export class RendererInterface {
  /**
   * Initializes the renderer.
   * @param {HTMLCanvasElement} canvas 
   * @param {CanvasRenderingContext2D} ctx 
   */
  init(canvas, ctx) {
    throw new Error("init() must be implemented");
  }

  /**
   * Updates and draws the visualization.
   * @param {Array} motionPoints - Detected motion coordinates
   * @param {number} dt - Delta time in seconds
   * @param {Object} state - AppState instance
   * @param {number} rainbowHue - The active rainbow cycle hue value
   */
  update(motionPoints, dt, state, rainbowHue) {
    throw new Error("update() must be implemented");
  }

  /**
   * Resizes internal grids or parameters.
   * @param {HTMLCanvasElement} canvas 
   */
  resize(canvas) {
    // Optional, can be overridden
  }

  /**
   * Cleans up renderer state if necessary.
   */
  destroy() {
    // Optional, can be overridden
  }
}
