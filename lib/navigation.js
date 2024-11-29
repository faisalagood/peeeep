import { getTwitchUserId } from "./lib.js";
import { emoteManager } from "./emotes.js";

const DEBOUNCE_MS = 250;

export class ChannelManager {
  static #IGNORED_SUBDOMAINS = new Set([
    "passport",
    "help",
    "dev", 
    "blog",
    "safety",
    "appeals",
    "player",
    "m"
  ]);

  static #CHANNEL_PATTERNS = {
    standard: /^https?:\/\/(?:www\.)?twitch\.tv\/(\w+)\/?(?:\?.*)?$/,
    dashboard: /^https?:\/\/dashboard\.twitch\.tv\/(\w+)\/?(?:\?.*)?$/,
    chat: /^https?:\/\/(?:www\.)?twitch\.tv\/(?:popout\/)?(?:moderator\/)?(\w+)\/chat\/?(?:\?.*)?$/,
    userPage: /^https?:\/\/(?:www\.)?twitch\.tv\/(?:popout\/)?u\/(\w+)\/[\w-]+(?:\/chat)?\/?(?:\?.*)?$/,
    embed: /^https?:\/\/(?:www\.)?twitch\.tv\/embed\/(\w+)\/chat(?:\?.*)?$/,
  };

  static #IGNORED_PAGES = new Set([
    "settings",
    "payments",
    "inventory",
    "messages",
    "subscriptions",
    "friends",
    "directory",
    "videos",
    "prime",
    "downloads",
    "search",
    "wallet"
  ]);

  #originalPushState = null;
  #originalReplaceState = null;
  #isLoading = false;
  #error = null;
  #debouncedHandler = null;
  currentUsername = null;
  currentChannelId = null;

  shouldInitialize(url) {
    const subdomainMatch = url.match(/^https?:\/\/([^.]+)\.twitch\.tv/);
    return !(subdomainMatch && ChannelManager.#IGNORED_SUBDOMAINS.has(subdomainMatch[1]));
  }

  #debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  };

  constructor() {
    this.#originalPushState = window.history.pushState;
    this.#originalReplaceState = window.history.replaceState;
    this.#debouncedHandler = this.#debounce(this.urlChangeHandler, DEBOUNCE_MS);
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
    if (subdomainMatch && ChannelManager.#IGNORED_SUBDOMAINS.has(subdomainMatch[1])) {
      console.log(`[PEEEEP] Ignoring blocked subdomain: ${subdomainMatch[1]}`);
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
    this.currentUsername = userData.username;
    this.currentChannelId = userData.id;

    try {
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
    this.currentUsername = null;
    this.currentChannelId = null;
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
    }
  };
}