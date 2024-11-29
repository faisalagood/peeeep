import { emoteManager } from "./emotes.js";
import { LOADER_GIF } from "./loaderGif.js";

export class TooltipManager {
  constructor() {
    this.tooltip = null;
    this.isActive = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.cleanupDragListeners = null;
  }

  async init() {
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
    const emoteInfo = emoteManager.getEmote(emoteElement.getAttribute("alt"));
    
    if (emoteInfo) {
      return emoteInfo;
    }

    const currentUrl = emoteElement.src;

    if (currentUrl.includes("static-cdn.jtvnw.net/emoticons/v2")) {
      const bigUrl = currentUrl.replace("/1.0", "/4.0");

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
    const imgContainer = this.createElement("div", "emote-preview-container");
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

    if (LOADER_GIF.width && LOADER_GIF.height) {
      spinner.width = LOADER_GIF.width;
      spinner.height = LOADER_GIF.height;
    }

    imgContainer.appendChild(spinner);

    const img = this.createElement("img", "emote-preview-img");
    img.src = emote.bigUrl;
    img.alt = emote.name;

    if (emote.isOfficial) {
      img.width = 112;
      img.height = 112;
      imgContainer.style.width = "112px";
      imgContainer.style.height = "112px";
    }

    img.onload = () => {
      img.classList.add("is-loaded");
      spinner.remove();
    };

    img.onerror = () => {
      spinner.remove();
      img.classList.add("is-loaded");
      img.src = emote.url;

      if (emote.isOfficial) {
        img.width = 112;
        img.height = 112;
      }
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
      handle.classList.add("is-dragging");
    };

    const stopDrag = (e) => {
      if (e) e.stopPropagation();
      this.isDragging = false;
      handle.classList.remove("is-dragging");
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
      const emoteElement = e.target.closest(".peeeep");

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
      ? [...modifierContainer.querySelectorAll(".peeeep")]
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

  cleanup() {
    this.hide();
    if (this._removeListeners) {
      this._removeListeners();
      this._removeListeners = null;
    }
  }
}
