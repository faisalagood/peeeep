import { getEmote } from "./emotes.js";
import { LOADER_GIF } from "./loaderGif.js";

export class Tooltip {
  constructor() {
    this.tooltip = null;
    this.isActive = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.cleanupDragListeners = null;
    this.setupListeners();
  }

  createElement(type, className, textContent = "") {
    const element = document.createElement(type);
    if (className) {
      element.className = className;
    }
    if (textContent) {
      element.textContent = textContent;
    }
    return element;
  }

  createHeader() {
    const header = this.createElement("div", "tooltip-header");
    const handle = this.createElement("div", "tooltip-drag-handle", "⋮⋮");
    const close = this.createElement("div", "tooltip-close", "×");

    header.append(handle, close);
    return header;
  }

  getEmoteInfo(emoteElement) {
    const emoteInfo = getEmote(emoteElement.getAttribute("alt"));
    if (emoteInfo) {
      return emoteInfo;
    }

    if (emoteElement.dataset.officialEmote === "true") {
      const currentUrl = emoteElement.src;
      const bigUrl = currentUrl.replace("/1.0", "/3.0");

      return {
        name: emoteElement.alt,
        url: currentUrl,
        bigUrl: bigUrl,
        service: "Twitch",
      };
    }

    return null;
  }

  createEmoteContent(emote) {
    const content = this.createElement("div", "emote-content");

    const preview = this.createElement("div", "emote-preview");
    preview.style.cssText = "min-height: 112px; position: relative;";

    const imgContainer = this.createElement("div", "emote-preview-container");
    imgContainer.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 8px;
      min-height: 112px;
    `;

    const info = this.createElement("div", "emote-info");
    const name = this.createElement("div", "emote-name", emote.name);
    const service = this.createElement(
      "div",
      "emote-service",
      emote.service.toUpperCase()
    );
    info.append(name, service);

    const spinner = this.createElement("img", "emote-loading-spinner");
    spinner.src = LOADER_GIF;
    spinner.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 256px;
      height: 256px;
      object-fit: contain;
    `;
    imgContainer.appendChild(spinner);

    const img = this.createElement("img", "emote-preview-img");
    img.style.cssText = `
      opacity: 0;
      transition: opacity 0.15s ease;
      max-width: 100%;
      max-height: 112px;
      object-fit: contain;
    `;
    img.src = emote.bigUrl;
    img.alt = emote.name;

    img.onload = () => {
      img.style.opacity = "1";
      spinner.remove();
    };

    img.onerror = () => {
      spinner.remove();
      img.style.opacity = "1";
      img.src = emote.url;
    };

    imgContainer.appendChild(img);
    preview.appendChild(imgContainer);
    content.append(preview, info);

    return content;
  }

  createTooltip(emotes) {
    if (this.tooltip) {
      const content = this.tooltip.querySelector(".tooltip-content");
      content.textContent = "";
      emotes.forEach((emote) => {
        const emoteInfo = this.getEmoteInfo(emote);
        if (emoteInfo) {
          content.appendChild(this.createEmoteContent(emoteInfo));
        }
      });
      return this.tooltip;
    }

    const tooltip = this.createElement(
      "div",
      "emote-tooltip emote-tooltip-draggable"
    );
    tooltip.appendChild(this.createHeader());

    const content = this.createElement("div", "tooltip-content");
    emotes.forEach((emote) => {
      const emoteInfo = this.getEmoteInfo(emote);
      if (emoteInfo) {
        content.appendChild(this.createEmoteContent(emoteInfo));
      }
    });

    tooltip.appendChild(content);
    return tooltip;
  }

  positionTooltip(element) {
    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    const x = Math.max(0, rect.left - tooltipRect.width - 5);
    const y = Math.max(0, rect.top - tooltipRect.height - 5);

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  setupDragging(tooltip) {
    const handle = tooltip.querySelector(".tooltip-drag-handle");

    const startDrag = (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      this.isDragging = true;
      const rect = tooltip.getBoundingClientRect();
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      handle.style.cursor = "grabbing";
    };

    const stopDrag = (e) => {
      if (e) e.stopPropagation();
      this.isDragging = false;
      handle.style.cursor = "grab";
    };

    const drag = (e) => {
      if (!this.isDragging) return;
      e.stopPropagation();

      const x = e.clientX - this.dragOffset.x;
      const y = e.clientY - this.dragOffset.y;

      const rect = tooltip.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      tooltip.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
      tooltip.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
    };

    handle.addEventListener("mousedown", startDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("mousemove", drag);

    return () => {
      handle.removeEventListener("mousedown", startDrag);
      document.removeEventListener("mouseup", stopDrag);
      document.removeEventListener("mousemove", drag);
      this.isDragging = false;
    };
  }

  setupListeners() {
    const handleClick = (e) => {
      const emoteElement = e.target.closest(".simple-emote-extension");

      if (!emoteElement) {
        if (!e.target.closest(".emote-tooltip")) {
          this.hide();
        }
        return;
      }

      e.stopPropagation();
      e.preventDefault();
      this.show(emoteElement);
    };

    const handleEscape = (e) => {
      if (e.key === "Escape" && this.isActive) {
        e.stopPropagation();
        this.hide();
      }
    };

    document.body.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleEscape, true);

    this._removeListeners = () => {
      document.body.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }

  show(element) {
    this.hide();

    const modifierContainer = element.closest(".modifier-container");
    const emotes = modifierContainer
      ? [...modifierContainer.querySelectorAll(".simple-emote-extension")]
      : [element];

    this.tooltip = this.createTooltip(emotes);

    if (!this.tooltip.isConnected) {
      document.body.appendChild(this.tooltip);
    }

    this.positionTooltip(element);
    this.isActive = true;

    this.cleanupDragListeners = this.setupDragging(this.tooltip);

    const closeBtn = this.tooltip.querySelector(".tooltip-close");
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.hide();
    };
  }

  hide() {
    if (this.cleanupDragListeners) {
      this.cleanupDragListeners();
      this.cleanupDragListeners = null;
    }

    if (this.tooltip?.isConnected) {
      this.tooltip.remove();
    }

    this.tooltip = null;
    this.isActive = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
  }

  destroy() {
    this.hide();
    if (this._removeListeners) {
      this._removeListeners();
      this._removeListeners = null;
    }
  }
}