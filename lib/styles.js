// Unique identifier for our style element
const STYLE_ID = 'simple-emote-extension-styles';

// Main styles definition
const tooltipStyles = `
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

  .simple-emote-extension {
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
    transform: translateZ(0); /* Force GPU acceleration */
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

  .tooltip-close {
    cursor: pointer;
    padding: 8px 12px;  /* Increased padding */
    margin: -8px -12px; /* Negative margin to offset padding */
    font-size: 18px;
    color: #888;
    transition: color 0.2s;
    user-select: none;
    position: relative;  /* For pseudo-element positioning */
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
  }

  .emote-preview img {
    will-change: transform, opacity;
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
    background-color: rgba(255, 255, 255, 0.05);
  }

  @media (prefers-reduced-motion: reduce) {
    .tooltip-close {
      transition: none;
    }
  }
`;

// Style injection with cleanup capability
class StyleManager {
  constructor() {
    this.styleElement = null;
  }

  injectStyles() {
    // Remove any existing style element first
    this.removeStyles();

    // Create and inject new style element
    this.styleElement = document.createElement('style');
    this.styleElement.id = STYLE_ID;
    this.styleElement.textContent = tooltipStyles;
    document.head.appendChild(this.styleElement);
  }

  removeStyles() {
    const existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle) {
      existingStyle.remove();
    }
    this.styleElement = null;
  }
}

// Create singleton instance
const styleManager = new StyleManager();

// Export functions that use the singleton
const addStyles = () => styleManager.injectStyles();
const removeStyles = () => styleManager.removeStyles();

export { tooltipStyles, addStyles, removeStyles };