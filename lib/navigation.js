import { getTwitchUserId } from "./lib.js";
import { emoteManager } from "./emotes.js";

class ChannelManager {
  static #instance = null;

  static #ALLOWED_SUBDOMAINS = new Set([
    "www", "twitch", "", "dashboard"
  ]);

  static #CHANNEL_PATTERNS = {
    standard: /^https?:\/\/(?:www\.)?twitch\.tv\/(\w+)\/?(?:\?.*)?$/,
    dashboard: /^https?:\/\/dashboard\.twitch\.tv\/(\w+)\/?(?:\?.*)?$/,
    chat: /^https?:\/\/(?:www\.)?twitch\.tv\/(?:popout\/)?(?:moderator\/)?(\w+)\/chat\/?(?:\?.*)?$/,
    userPage: /^https?:\/\/(?:www\.)?twitch\.tv\/(?:popout\/)?u\/(\w+)\/[\w-]+(?:\/chat)?\/?(?:\?.*)?$/,
    embed: /^https?:\/\/(?:www\.)?twitch\.tv\/embed\/(\w+)\/chat(?:\?.*)?$/,
  };

  static #IGNORED_PAGES = new Set([
    "settings", "payments", "inventory", "messages", "subscriptions", 
    "friends", "directory", "videos", "prime", "downloads", 
    "search", "wallet", "login", "signup", "robots.txt"
  ]);

  #originalPushState = null;
  #originalReplaceState = null;
  #isLoading = false;
  #error = null;
  #debouncedHandler = null;
  #channelChangeCallbacks = new Set();
  
  currentUsername = null;
  currentChannelId = null;

  constructor() {
    if (ChannelManager.#instance) {
      return ChannelManager.#instance;
    }
    ChannelManager.#instance = this;
    
    this.#originalPushState = window.history.pushState;
    this.#originalReplaceState = window.history.replaceState;
    this.#debouncedHandler = this.#debounce(this.urlChangeHandler, 250);
  }

  static getInstance() {
    return ChannelManager.#instance ??= new ChannelManager();
  }

  onChannelChange(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Channel change callback must be a function');
    }
    this.#channelChangeCallbacks.add(callback);
    return () => this.#channelChangeCallbacks.delete(callback);
  }

  #notifyChannelChange(oldChannelId, newChannelId) {
    for (const callback of this.#channelChangeCallbacks) {
      try {
        callback(oldChannelId, newChannelId);
      } catch (error) {
        console.error("[PEEEEP] Channel change callback error:", error);
      }
    }
  }

  #debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  };

  shouldInitialize(url) {
    const subdomainMatch = url.match(/^https?:\/\/([^.]+)\.twitch\.tv/);
    const subdomain = subdomainMatch?.[1] || "";
    return ChannelManager.#ALLOWED_SUBDOMAINS.has(subdomain);
  }

  async init() {
    await this.urlChangeHandler();

    window.history.pushState = (...args) => {
      this.#originalPushState.apply(window.history, args);
      this.#debouncedHandler();
    };

    window.history.replaceState = (...args) => {
      this.#originalReplaceState.apply(window.history, args);
      this.#debouncedHandler();
    };

    window.addEventListener("popstate", this.#debouncedHandler);
  }

  get isLoading() {
    return this.#isLoading;
  }

  get error() {
    return this.#error;
  }

  matchChannelName = (url = window.location.href) => {
    const subdomainMatch = url.match(/^https?:\/\/([^.]+)\.twitch\.tv/);
    const subdomain = subdomainMatch?.[1] || "";
    
    if (!ChannelManager.#ALLOWED_SUBDOMAINS.has(subdomain)) {
      console.log(`[PEEEEP] Ignoring non-allowed subdomain: ${subdomain}`);
      return null;
    }

    for (const pattern of Object.values(ChannelManager.#CHANNEL_PATTERNS)) {
      const match = pattern.exec(url);
      if (match?.[1]) {
        const username = match[1].toLowerCase();
        return ChannelManager.#IGNORED_PAGES.has(username) ? null : username;
      }
    }
    return null;
  };

  #updateChannel = async (userData) => {
    const oldChannelId = this.currentChannelId;
    this.currentUsername = userData.username;
    this.currentChannelId = userData.id;

    try {
      this.#notifyChannelChange(oldChannelId, userData.id);
      await emoteManager.loadChannelEmotes(userData);
    } catch (error) {
      console.error("[PEEEEP] Failed to load emotes:", error);
      throw error;
    }
  };

  urlChangeHandler = async () => {
    this.#isLoading = true;
    this.#error = null;

    try {
      const username = this.matchChannelName();
      if (!username || username === this.currentUsername) return;

      const userData = await getTwitchUserId(username);
      if (!userData?.id) {
        throw new Error(`[PEEEEP] Invalid user data for ${username}`);
      }

      if (this.currentChannelId !== userData.id) {
        await this.#updateChannel(userData);
      }
    } catch (error) {
      this.#error = error;
      this.#resetState();
      console.error("[PEEEEP] Channel change error:", error);
    } finally {
      this.#isLoading = false;
    }
  };

  #resetState = () => {
    const oldChannelId = this.currentChannelId;
    this.currentUsername = null;
    this.currentChannelId = null;
    if (oldChannelId) {
      this.#notifyChannelChange(oldChannelId, null);
    }
  };

  cleanup = () => {
    try {
      if (this.#originalPushState) {
        window.history.pushState = this.#originalPushState;
      }
      if (this.#originalReplaceState) {
        window.history.replaceState = this.#originalReplaceState;
      }
    } finally {
      window.removeEventListener("popstate", this.#debouncedHandler);
      this.#resetState();
      this.#originalPushState = null;
      this.#originalReplaceState = null;
      this.#isLoading = false;
      this.#error = null;
      this.#debouncedHandler = null;
      this.#channelChangeCallbacks.clear();
    }
  };
}

export const channelManager = ChannelManager.getInstance();