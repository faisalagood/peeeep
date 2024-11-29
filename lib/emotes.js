export class EmoteManager {
  static #ENDPOINTS = {
    ffz: {
      global: 'https://api.frankerfacez.com/v1/set/global/ids',
      channel: (id) => `https://api.frankerfacez.com/v1/room/id/${id}`
    },
    bttv: {
      global: 'https://api.betterttv.net/3/cached/emotes/global',
      channel: (id) => `https://api.betterttv.net/3/cached/users/twitch/${id}`
    },
    sevenTv: {
      global: 'https://7tv.io/v3/emote-sets/global',
      channel: (id) => `https://7tv.io/v3/users/twitch/${id}`
    }
  };

  #globalEmotes = new Map();
  #channelEmotes = new Map();
  #globalEmoteRegex = null;
  #channelEmoteRegex = null;

  #createBaseEmoteImage(name, url, modifier = false) {
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
      .map(name => name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"))
      .sort((a, b) => b.length - a.length);

    return new RegExp(`(${escapedEmoteNames.join("|")})`, "i");
  }

  async #handleApiResponse(response, errorMessage) {
    if (!response.ok) {
      if (response.status !== 404) {
        console.warn(`${errorMessage} Status: ${response.status}`);
      }
      return null;
    }
    return response.json();
  }

  async #loadFFZEmotes(id, targetMap) {
    try {
      const data = await this.#handleApiResponse(
        await fetch(EmoteManager.#ENDPOINTS.ffz.channel(id)),
        "FFZ HTTP error!"
      );

      if (!data) return;
      if (!data?.sets?.[data.room?.set]?.emoticons) return;

      data.sets[data.room.set].emoticons.forEach(emote => {
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
          element: this.#createBaseEmoteImage(emote.name, url, false)
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
      const data = await this.#handleApiResponse(
        await fetch(EmoteManager.#ENDPOINTS.bttv.channel(userId)),
        "BTTV HTTP error!"
      );

      if (!data) return;

      [...(data.channelEmotes || []), ...(data.sharedEmotes || [])].forEach(emote => {
        if (!emote.code || !emote.id) return;

        const url = `https://cdn.betterttv.net/emote/${emote.id}/1x`;
        targetMap.set(emote.code, {
          name: emote.code,
          url,
          bigUrl: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
          width: emote.width,
          height: emote.height,
          service: "bttv",
          element: this.#createBaseEmoteImage(emote.code, url)
        });
      });
    } catch (error) {
      if (!(error instanceof TypeError)) {
        console.error("[PEEEEP] BTTV emotes error:", error);
      }
    }
  }

  async #load7TVEmotes(userId, targetMap) {
    try {
      const data = await this.#handleApiResponse(
        await fetch(EmoteManager.#ENDPOINTS.sevenTv.channel(userId)),
        "7TV HTTP error!"
      );

      if (!data) return;
      if (!data?.emote_set?.emotes) return;

      data.emote_set.emotes.forEach(emote => {
        const file = emote.data?.host?.files?.find(f => f.name === "1x.webp");
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
          element: this.#createBaseEmoteImage(emote.name, url, modifier)
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
      const [ffzResponse, bttvResponse, sevenTVResponse] = await Promise.all([
        fetch(EmoteManager.#ENDPOINTS.ffz.global),
        fetch(EmoteManager.#ENDPOINTS.bttv.global),
        fetch(EmoteManager.#ENDPOINTS.sevenTv.global)
      ]);

      const [ffzData, bttvData, sevenTVData] = await Promise.all([
        this.#handleApiResponse(ffzResponse, "FFZ Global HTTP error!"),
        this.#handleApiResponse(bttvResponse, "BTTV Global HTTP error!"),
        this.#handleApiResponse(sevenTVResponse, "7TV Global HTTP error!")
      ]);

      if (ffzData?.sets?.[3]?.emoticons) {
        ffzData.sets[3].emoticons.forEach(emote => {
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
            element: this.#createBaseEmoteImage(emote.name, url, false)
          });
        });
      }

      if (bttvData) {
        bttvData.forEach(emote => {
          if (!emote.code || !emote.id) return;

          const url = `https://cdn.betterttv.net/emote/${emote.id}/1x`;
          this.#globalEmotes.set(emote.code, {
            name: emote.code,
            url,
            bigUrl: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            width: emote.width,
            height: emote.height,
            service: "bttv",
            element: this.#createBaseEmoteImage(emote.code, url)
          });
        });
      }

      if (sevenTVData?.emotes) {
        sevenTVData.emotes.forEach(emote => {
          const file = emote.data?.host?.files?.find(f => f.name === "1x.webp");
          if (!emote.name || !emote.id || !file) return;

          const url = `https:${emote.data.host.url}/1x.webp`;
          const modifier = Boolean(emote.data.flags > 0);
          
          this.#globalEmotes.set(emote.name, {
            name: emote.name,
            url,
            bigUrl: `https:${emote.data.host.url}/3x.webp`,
            width: file.width,
            height: file.height,
            modifier,
            service: "7tv",
            element: this.#createBaseEmoteImage(emote.name, url, modifier)
          });
        });
      }

      this.#globalEmoteRegex = this.#createEmoteRegex(this.#globalEmotes);
      console.info("[PEEEEP] Loaded global emotes:", this.#globalEmotes.size);
    } catch (error) {
      if (!(error instanceof TypeError)) {
        console.error("[PEEEEP] Global emotes error:", error);
      }
      this.#globalEmoteRegex = this.#createEmoteRegex(this.#globalEmotes);
    }
  }

  async #initializeEmotes() {
    if (this.#globalEmotes.size === 0) {
      await this.#loadGlobalEmotes();
    }
  }

  async loadChannelEmotes(userObject) {
    if (!userObject?.id) return;

    this.#channelEmotes.clear();
    this.#channelEmoteRegex = null;

    console.info(`[PEEEEP] Loading emotes for channel: ${userObject.username}`);

    try {
      await this.#initializeEmotes();

      await Promise.allSettled([
        this.#loadFFZEmotes(userObject.id, this.#channelEmotes),
        this.#loadBTTVEmotes(userObject.id, this.#channelEmotes),
        this.#load7TVEmotes(userObject.id, this.#channelEmotes)
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
    return this.#channelEmotes.get(emoteName) || this.#globalEmotes.get(emoteName);
  }

  getAllEmotes() {
    return new Map([...this.#globalEmotes, ...this.#channelEmotes]);
  }

  containsEmote(element) {
    const text = element.textContent;
    return (
      (this.#channelEmoteRegex?.test(text) || this.#globalEmoteRegex?.test(text)) ?? false
    );
  }

  createEmoteImage(emote) {
    return emote.element.cloneNode(true);
  }

  cleanup() {
    this.#globalEmotes.clear();
    this.#channelEmotes.clear();
    this.#globalEmoteRegex = null;
    this.#channelEmoteRegex = null;
  }
}

export const emoteManager = new EmoteManager();