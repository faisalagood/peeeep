import { observer } from "./observer.js";

class UsernameColorManager {
  static #instance = null;
  static #DEFAULT_COLORS = [
    "#FF4545",
    "#4DBEFF",
    "#00E600",
    "#FF8324",
    "#FF6BFF",
    "#FFB000",
    "#00CFBB",
    "#FF6E6E",
    "#BC85FF",
    "#00B5FF",
    "#38DB48",
    "#FF8ED4",
    "#7F7FFF",
    "#FF9B2F",
    "#00C5BC",
  ];

  #colorIndex = 0;
  #displayNameColors = new Map();
  #unsubscribeUsername = null;
  #unsubscribeMention = null;

  constructor() {
    if (UsernameColorManager.#instance) {
      return UsernameColorManager.#instance;
    }
    UsernameColorManager.#instance = this;
  }

  static getInstance() {
    return (UsernameColorManager.#instance ??= new UsernameColorManager());
  }
  async init() {
    document
      .querySelectorAll(".chat-author__display-name")
      .forEach(this.#processUsername);
    document
      .querySelectorAll('span[data-a-target="chat-message-mention"]')
      .forEach(this.#processMention);

    this.#unsubscribeUsername = observer.subscribe(
      ".chat-author__display-name",
      this.#processUsername
    );
    this.#unsubscribeMention = observer.subscribe(
      'span[data-a-target="chat-message-mention"]',
      this.#processMention
    );
  }

  #getNextDefaultColor = () => {
    const color = UsernameColorManager.#DEFAULT_COLORS[this.#colorIndex];
    this.#colorIndex =
      (this.#colorIndex + 1) % UsernameColorManager.#DEFAULT_COLORS.length;
    return color;
  };

  #processUsername = (element) => {
    if (!element?.isConnected) return;

    const displayName = element.textContent;
    const color = element.style.color;

    if (displayName && color) {
      this.#displayNameColors.set(displayName.toLowerCase(), color);
    }
  };

  #processMention = (element) => {
    if (
      !element?.isConnected ||
      element.classList.contains("mention_processed")
    )
      return;

    const text = element.textContent;
    const mention = text.startsWith("@")
      ? text.slice(1).toLowerCase()
      : text.toLowerCase();
    if (!mention) return;

    const userColor =
      this.#displayNameColors.get(mention) || this.#getNextDefaultColor();
    element.style.color = userColor;
    element.classList.add("mention_processed");
  };

  cleanupChannel() {
    this.#colorIndex = 0;
    this.#displayNameColors.clear();
  }

  cleanup() {
    this.#unsubscribeUsername?.();
    this.#unsubscribeMention?.();
    this.#unsubscribeUsername = null;
    this.#unsubscribeMention = null;
    this.cleanupChannel();
  }
}

export const usernameColorManager = UsernameColorManager.getInstance();
