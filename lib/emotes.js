class EmoteManager {
  static #instance = null;
  static #MAX_RETRIES = 1;
  static #RETRY_DELAY = 2000;
  static #ENDPOINTS = {
    ffz: {
      global: "https://api.frankerfacez.com/v1/set/global/ids",
      channel: (id) => `https://api.frankerfacez.com/v1/room/id/${id}`,
    },
    bttv: {
      global: "https://api.betterttv.net/3/cached/emotes/global",
      channel: (id) => `https://api.betterttv.net/3/cached/users/twitch/${id}`,
    },
    sevenTv: {
      global: "https://7tv.io/v3/emote-sets/global",
      channel: (id) => `https://7tv.io/v3/users/twitch/${id}`,
    },
  };

  #globalEmotes = new Map();
  #channelEmotes = new Map();
  #globalEmoteRegex = null;
  #channelEmoteRegex = null;

  constructor() {
    if (EmoteManager.#instance) {
      return EmoteManager.#instance;
    }
    EmoteManager.#instance = this;
  }

  static getInstance() {
    return (EmoteManager.#instance ??= new EmoteManager());
  }

  async #fetchWithRetry(
    url,
    errorMessage,
    retries = EmoteManager.#MAX_RETRIES
  ) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);
        const data = await this.#handleApiResponse(response, errorMessage);
        if (data) return data;

        if (attempt < retries) {
          console.warn(`[PEEEEP] Retry ${attempt}/${retries} for ${url}`);
          await new Promise((resolve) =>
            setTimeout(resolve, EmoteManager.#RETRY_DELAY)
          );
        }
      } catch (error) {
        if (attempt === retries) throw error;
        console.warn(
          `[PEEEEP] Retry ${attempt}/${retries} after error:`,
          error
        );
        await new Promise((resolve) =>
          setTimeout(resolve, EmoteManager.#RETRY_DELAY)
        );
      }
    }
    return null;
  }

  #createEmoteImage(name, url, modifier = false) {
    const img = new Image();
    img.src = url;
    img.alt = name;
    img.className = "peeeep";
    if (modifier) img.classList.add("modifier");
    return img;
  }

  #createEmoteRegex(emoteMap) {
    if (!emoteMap.size) return null;

    const escapedEmoteNames = Array.from(emoteMap.keys())
      .map((name) => name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"))
      .sort((a, b) => b.length - a.length);

    return new RegExp(
      `(?:^|\\b|\\s)(${escapedEmoteNames.join("|")})(?=\\b|\\s|$)`,
      "g"
    );
  }

  async #handleApiResponse(response, errorMessage) {
    if (!response.ok && response.status !== 404) {
      console.warn(`${errorMessage} Status: ${response.status}`);
      return null;
    }
    return response.ok ? response.json() : null;
  }

  async #loadFFZEmotes(id, targetMap) {
    try {
      const data = await this.#fetchWithRetry(
        EmoteManager.#ENDPOINTS.ffz.channel(id),
        "FFZ HTTP error!"
      );

      if (!data?.sets?.[data.room?.set]?.emoticons) return;

      data.sets[data.room.set].emoticons.forEach((emote) => {
        if (!emote.name || !emote.urls?.[1]) return;

        const url = emote.animated ? emote.animated[1] : emote.urls[1];
        const bigUrl = emote.animated
          ? emote.animated[4] || emote.animated[1]
          : emote.urls[4] || emote.urls[1];

        targetMap.set(emote.name, {
          name: emote.name,
          url,
          bigUrl,
          height: emote.height,
          width: emote.width,
          service: "ffz",
          modifier: false,
        });
      });
    } catch (error) {
      if (!(error instanceof TypeError)) {
        console.error("[PEEEEP] FFZ emotes error:", error);
      }
    }
  }

  async #loadBTTVEmotes(userId, targetMap) {
    try {
      const data = await this.#fetchWithRetry(
        EmoteManager.#ENDPOINTS.bttv.channel(userId),
        "BTTV HTTP error!"
      );

      if (!data) return;

      [...(data.channelEmotes || []), ...(data.sharedEmotes || [])].forEach(
        (emote) => {
          if (!emote.code || !emote.id) return;

          const url = `https://cdn.betterttv.net/emote/${emote.id}/1x`;
          targetMap.set(emote.code, {
            name: emote.code,
            url,
            bigUrl: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            width: emote.width,
            height: emote.height,
            service: "bttv",
            modifier: false,
          });
        }
      );
    } catch (error) {
      if (!(error instanceof TypeError)) {
        console.error("[PEEEEP] BTTV emotes error:", error);
      }
    }
  }

  async #load7TVEmotes(userId, targetMap) {
    try {
      const data = await this.#fetchWithRetry(
        EmoteManager.#ENDPOINTS.sevenTv.channel(userId),
        "7TV HTTP error!"
      );

      if (!data?.emote_set?.emotes) return;

      data.emote_set.emotes.forEach((emote) => {
        const file = emote.data?.host?.files?.find((f) => f.name === "1x.webp");
        if (!emote.name || !emote.id || !file) return;

        const url = `https:${emote.data.host.url}/1x.webp`;
        const modifier = Boolean(emote.flags > 0 || emote.data.flags > 0);

        targetMap.set(emote.name, {
          name: emote.name,
          url,
          bigUrl: `https:${emote.data.host.url}/4x.webp`,
          width: file.width,
          height: file.height,
          modifier,
          service: "7tv",
        });
      });
    } catch (error) {
      if (!(error instanceof TypeError)) {
        console.error("[PEEEEP] 7TV emotes error:", error);
      }
    }
  }

  async #loadGlobalEmotes() {
    if (this.#globalEmotes.size > 0) return;

    try {
      const [ffzData, bttvData, sevenTVData] = await Promise.all([
        this.#fetchWithRetry(
          EmoteManager.#ENDPOINTS.ffz.global,
          "FFZ Global HTTP error!"
        ),
        this.#fetchWithRetry(
          EmoteManager.#ENDPOINTS.bttv.global,
          "BTTV Global HTTP error!"
        ),
        this.#fetchWithRetry(
          EmoteManager.#ENDPOINTS.sevenTv.global,
          "7TV Global HTTP error!"
        ),
      ]);

      if (ffzData?.sets?.[3]?.emoticons) {
        ffzData.sets[3].emoticons.forEach((emote) => {
          if (!emote.name || !emote.urls?.[1]) return;

          const url = emote.animated ? emote.animated[1] : emote.urls[1];
          const bigUrl = emote.animated
            ? emote.animated[4] || emote.animated[1]
            : emote.urls[4] || emote.urls[1];

          this.#globalEmotes.set(emote.name, {
            name: emote.name,
            url,
            bigUrl,
            height: emote.height,
            width: emote.width,
            service: "ffz",
            modifier: false,
          });
        });
      }

      if (bttvData) {
        bttvData.forEach((emote) => {
          if (!emote.code || !emote.id) return;

          const url = `https://cdn.betterttv.net/emote/${emote.id}/1x`;
          this.#globalEmotes.set(emote.code, {
            name: emote.code,
            url,
            bigUrl: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            width: emote.width,
            height: emote.height,
            service: "bttv",
            modifier: false,
          });
        });
      }

      if (sevenTVData?.emotes) {
        sevenTVData.emotes.forEach((emote) => {
          const file = emote.data?.host?.files?.find(
            (f) => f.name === "1x.webp"
          );
          if (!emote.name || !emote.id || !file) return;

          const url = `https:${emote.data.host.url}/1x.webp`;
          const modifier = Boolean(emote.flags > 0 || emote.data.flags > 0);

          this.#globalEmotes.set(emote.name, {
            name: emote.name,
            url,
            bigUrl: `https:${emote.data.host.url}/3x.webp`,
            width: file.width,
            height: file.height,
            modifier,
            service: "7tv",
          });
        });
      }

      this.#globalEmoteRegex = this.#createEmoteRegex(this.#globalEmotes);
      console.info("[PEEEEP] Loaded global emotes:", {
        total: this.#globalEmotes.size,
        ffz: ffzData?.sets?.[3]?.emoticons?.length || 0,
        bttv: bttvData?.length || 0,
        sevenTv: sevenTVData?.emotes?.length || 0,
      });
    } catch (error) {
      if (!(error instanceof TypeError)) {
        console.error("[PEEEEP] Global emotes error:", error);
      }
      this.#globalEmoteRegex = this.#createEmoteRegex(this.#globalEmotes);
    }
  }

  async init() {
    await this.#loadGlobalEmotes();
  }

  async loadChannelEmotes(userObject) {
    if (!userObject?.id) return;

    this.cleanupChannel();

    console.info(`[PEEEEP] Loading emotes for channel: ${userObject.username}`);

    try {
      await Promise.allSettled([
        this.#loadFFZEmotes(userObject.id, this.#channelEmotes),
        this.#loadBTTVEmotes(userObject.id, this.#channelEmotes),
        this.#load7TVEmotes(userObject.id, this.#channelEmotes),
      ]);

      this.#channelEmoteRegex = this.#createEmoteRegex(this.#channelEmotes);
      console.info("[PEEEEP] Loaded channel emotes:", this.#channelEmotes.size);
    } catch (error) {
      if (!(error instanceof TypeError)) {
        console.error("[PEEEEP] Channel emotes error:", error);
      }
      this.#channelEmoteRegex = this.#createEmoteRegex(this.#channelEmotes);
    }
  }

  getEmote(emoteName) {
    return (
      this.#channelEmotes.get(emoteName) || this.#globalEmotes.get(emoteName)
    );
  }

  searchEmotes(query) {
    if (!query || typeof query !== "string") return [];

    const results = [];

    for (const [emoteName, emote] of this.#channelEmotes) {
      if (emoteName.startsWith(query)) {
        results.push({ ...emote });
      }
    }

    for (const [emoteName, emote] of this.#globalEmotes) {
      if (emoteName.startsWith(query)) {
        results.push({ ...emote });
      }
    }

    return results;
  }

  containsEmote(element) {
    if (!element.textContent) return false;

    const text = element.textContent.trim();
    if (!text) return false;

    if (this.#channelEmoteRegex) {
      this.#channelEmoteRegex.lastIndex = 0;
      if (this.#channelEmoteRegex.test(text)) return true;
    }

    if (this.#globalEmoteRegex) {
      this.#globalEmoteRegex.lastIndex = 0;
      if (this.#globalEmoteRegex.test(text)) return true;
    }

    return false;
  }

  createEmoteImage(emote) {
    return this.#createEmoteImage(emote.name, emote.url, emote.modifier);
  }

  cleanupChannel() {
    this.#channelEmotes.clear();
    this.#channelEmoteRegex = null;
  }

  cleanup() {
    this.cleanupChannel();
    this.#globalEmotes.clear();
    this.#globalEmoteRegex = null;
  }
}

export const emoteManager = EmoteManager.getInstance();
