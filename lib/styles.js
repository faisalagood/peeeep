class StyleManager {
  static #instance = null;
  static #STYLE_ID = 'peeeep-styles';

  #styleElement = null;
  
  #tooltipStyles = `
    .modifier-container {
      display: unset;
      display: inline-grid;
      justify-items: center;
      align-items: center;
      vertical-align: middle;
    }
    .modifier-container img {
      grid-area: 1 / 1;
      width: min-content; 
      height: min-content;
    }
    .peeeep {
      vertical-align: middle;
      display: inline-block;
      cursor: pointer;
    }
    .modifier {
      z-index: 1;
    }
    .emote-tooltip {
      position: absolute;
      background-color: rgba(28, 28, 28, 0.95);
      color: white;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      min-width: 200px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transform: translateZ(0);
    }
    .tooltip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px 6px 0 0;
      user-select: none;
      vertical-align: middle;
    }
    .tooltip-drag-handle {
      cursor: grab;
      padding: 0 8px;
      color: #888;
      user-select: none;
      touch-action: none;
    }
    .tooltip-drag-handle.is-dragging {
      cursor: grabbing;
    }
    .tooltip-close {
      cursor: pointer;
      padding: 8px 12px;
      margin: -8px -12px;
      font-size: 18px;
      color: #888;
      transition: color 0.2s;
      user-select: none;
      position: relative;
      vertical-align: middle;
    }
    .tooltip-close::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      margin: -5px;
      vertical-align: middle;
    }
    .tooltip-close:hover {
      color: red;
    }
    @media (prefers-reduced-motion: reduce) {
      .tooltip-close {
        transition: none;
      }
    }
    .tooltip-content {
      padding: 12px;
      overscroll-behavior: contain;
    }
    .emote-preview {
      padding: 5px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 112px;
      position: relative;
    }
    .emote-preview-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 8px;
      min-height: 112px;
    }
    .emote-loading-spinner {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 256px;
      height: 256px;
      object-fit: contain;
    }
    .emote-preview-img {
      opacity: 0;
      transition: opacity 0.15s ease;
      max-width: 100%;
      max-height: 112px;
      object-fit: contain;
    }
    .emote-preview-img.is-loaded {
      opacity: 1;
    }
    .emote-info {
      margin-top: 5px;
      user-select: text;
    }
    .emote-name {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 2px;
    }
    .emote-service {
      font-size: 12px;
      color: #888;
    }
    .chat-scrollable-area__message-container > *:nth-child(even) {
      background-color: rgba(128, 128, 128, 0.1);
    }
    
    .mention-fragment {
      font-weight: 700 !important;
      background: transparent !important;
    }

    .chat-image, .chat-line__message--emote {
     height: 32px !important;
     width: 32px !important;
    }

  `;

  constructor() {
    if (StyleManager.#instance) {
      return StyleManager.#instance;
    }
    StyleManager.#instance = this;
  }

  static getInstance() {
    return StyleManager.#instance ??= new StyleManager();
  }

  async init() {
    this.#removeStyles();
    this.#styleElement = document.createElement('style');
    this.#styleElement.id = StyleManager.#STYLE_ID;
    this.#styleElement.textContent = this.#tooltipStyles;
    document.head.appendChild(this.#styleElement);
  }

  #removeStyles() {
    const existingStyle = document.getElementById(StyleManager.#STYLE_ID);
    if (existingStyle) {
      existingStyle.remove();
    }
    this.#styleElement = null;
  }

  cleanup() {
    this.#removeStyles();
  }
}

export const styleManager = StyleManager.getInstance();