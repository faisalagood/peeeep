import { getTwitchUserId } from "./lib.js";
import { loadChannelEmotes } from "./emotes.js";

class ChannelHandler {
  // Static class properties
  static CHANNEL_REGEX = /^https?:\/\/(?:(?:www|dashboard)\.)?twitch\.tv\/(?:(?:popout\/)?(\w+)(?:\/chat)?|(?:popout\/)?u\/(\w+)\/[\w-]+(?:\/chat)?)\/?(?:\?.*)?$/;
  static IGNORED_PAGES = new Set([
    'settings',
    'payments',
    'inventory',
    'messages',
    'subscriptions',
    'friends',
    'directory',
    'videos',
    'prime',
    'downloads'
  ]);

  constructor() {
    this.currentUsername = null;
    this.currentChannelId = null;
    this.abortController = null;
  }

  matchChannelName(url) {
    if (!url) return null;
    const match = ChannelHandler.CHANNEL_REGEX.exec(url);
    if (!match) return null;
    
    const username = match[1] || match[2];
    if (username && !ChannelHandler.IGNORED_PAGES.has(username)) {
      return username;
    }
    return null;
  }

  async urlChangeHandler(newUsername) {
    if (!newUsername || newUsername === this.currentUsername) return;

    // Cancel any ongoing operations
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      const data = await Promise.race([
        getTwitchUserId(newUsername),
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => 
            reject(new Error('Operation cancelled'))
          );
        })
      ]);

      if (signal.aborted) return;
      
      if (!data) {
        throw new Error("Failed to fetch Twitch user data");
      }

      // Only update state and load emotes if we're actually changing channels
      if (this.currentChannelId !== data.id) {
        this.currentUsername = newUsername;
        this.currentChannelId = data.id;
        await loadChannelEmotes(data);
      }
      
    } catch (error) {
      if (error.message !== 'Operation cancelled') {
        // Let error propagate to global handler
        throw error;
      }
    }
  }

  cleanup() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.currentUsername = null;
    this.currentChannelId = null;
  }
}

export { ChannelHandler }