const emotes = new Map();
let emotesDebug = true;
let emoteRegex;
let globalEmotesLoaded = false;
let currentUserObject;

const loadTwitchEmotes = async (username) => {
  if (!username) return null;

  const query = `query{user(login:"${username}"){subscriptionProducts{emotes{id state text token}}}}`;

  try {
    const response = await fetch("https://gql.twitch.tv/gql", {
      method: "POST",
      headers: {
        "Client-Id": "ue6666qo983tsx6so1t0vnawi233wa",
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors) {
      const errorMessage = data.errors[0].message;
      throw new Error(`Twitch API request failed: ${errorMessage}`);
    }

    data.data.user.subscriptionProducts.forEach((product) => {
      product.emotes.forEach((emote) => {
        emotes.set(emote.token, {
          url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/2.0`,
        });
      });
    });

    return emotes;
  } catch (error) {
    console.error("Error fetching emotes:", error);
  }
};

const loadGlobalTwitchEmotes = async (emoteSetId) => {
  if (!emoteSetId) return null;

  const query = `
    query {
      emoteSet(id: "${emoteSetId}") { 
        emotes { id token }
      }
    }
  `;

  try {
    const response = await fetch("https://gql.twitch.tv/gql", {
      method: "POST",
      headers: {
        "Client-Id": "ue6666qo983tsx6so1t0vnawi233wa",
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors) {
      const errorMessage = data.errors[0].message;
      throw new Error(`Twitch API request failed: ${errorMessage}`);
    }
    if (data && data.data && data.data.emoteSet && data.data.emoteSet.emotes) {
      data.data.emoteSet.emotes.forEach((emote) => {
        emotes.set(emote.token, {
          url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/2.0`,
        });
      });
    }
  } catch (error) {
    console.error("Error fetching emotes:", error);
  }
};

async function loadFFZEmotes(id) {
  try {
    const response = await fetch(
      `https://api.frankerfacez.com/v1/room/id/${id}`
    );
    if (!response.ok) {
      throw new Error(`FFZ HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.sets && data.room && data.room.set) {
      for (const emote of data.sets[data.room.set].emoticons) {
        if (emote.name && emote.urls && emote.urls[1]) {
          emotes.set(emote.name, {
            name: emote.name,
            url: emote.urls[1],
            bigUrl: emote.urls[4],
            height: emote.height || null,
            width: emote.width || null,
            service: "ffz",
          });
        }
      }
    }
  } catch (error) {
    if (emotesDebug)
      console.error(`Error loading FFZ emotes for ${username}:`, error.message);
  }
}

async function loadBTTVEmotes(userId) {
  try {
    const response = await fetch(
      `https://api.betterttv.net/3/cached/users/twitch/${userId}`
    );
    if (!response.ok) {
      throw new Error(`BTTV HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const allEmotes = [
      ...(data.channelEmotes || []),
      ...(data.sharedEmotes || []),
    ];
    for (const emote of allEmotes) {
      if (emote.code && emote.id) {
        emotes.set(emote.code, {
          name: emote.code,
          url: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
          bigUrl: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
          width: emote.width || null,
          height: emote.height || null,
          service: "bttv",
        });
      }
    }
  } catch (error) {
    if (emotesDebug)
      console.error(
        `Error loading BTTV emotes for user ${userId}:`,
        error.message
      );
  }
}

async function load7TVEmotes(userId) {
  try {
    const response = await fetch(`https://7tv.io/v3/users/twitch/${userId}`);
    if (!response.ok) {
      throw new Error(`7TV HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.emote_set && data.emote_set.emotes) {
      for (const emote of data.emote_set.emotes) {
        const file = emote.data?.host?.files.find((f) => f.name === "1x.webp");
        if (emote.name && emote.id && file) {
          emotes.set(emote.name, {
            name: emote.name,
            url: `https:${emote.data.host.url}/1x.webp`,
            bigUrl: `https:${emote.data.host.url}/3x.webp`,
            width: file.width || null,
            height: file.height || null,
            modifier: (emote.flags > 0 || emote.data.flags > 0),
            service: "7tv",
          });
        }
      }
    }
  } catch (error) {
    if (emotesDebug)
      console.error(
        `Error loading 7TV emotes for user ${userId}:`,
        error.message
      );
  }
}

async function loadGlobalEmotes() {
  try {
    const [ffzResponse, bttvResponse, sevenTVResponse] = await Promise.all([
      fetch("https://api.frankerfacez.com/v1/set/global/ids"),
      fetch("https://api.betterttv.net/3/cached/emotes/global"),
      fetch("https://7tv.io/v3/emote-sets/global"),
    ]);

    if (!ffzResponse.ok)
      throw new Error(`FFZ Global HTTP error! status: ${ffzResponse.status}`);
    if (!bttvResponse.ok)
      throw new Error(`BTTV Global HTTP error! status: ${bttvResponse.status}`);
    if (!sevenTVResponse.ok)
      throw new Error(
        `7TV Global HTTP error! status: ${sevenTVResponse.status}`
      );

    const [ffzGlobal, bttvGlobal, sevenTVGlobal] = await Promise.all([
      ffzResponse.json(),
      bttvResponse.json(),
      sevenTVResponse.json(),
    ]);

    // Populate FFZ global emotes
    if (ffzGlobal && ffzGlobal.sets && ffzGlobal.sets[3]) {
      for (const emote of ffzGlobal.sets[3].emoticons) {
        if (emote.name && emote.urls && emote.urls[1]) {
          emotes.set(emote.name, {
            name: emote.name,
            url: emote.urls[1],
            bigUrl: emote.urls[4],
            height: emote.height || null,
            width: emote.width || null,
            service: "ffz",
          });
        }
      }
    }

    // Populate BTTV global emotes
    if (bttvGlobal) {
      for (const emote of bttvGlobal) {
        if (emote.code && emote.id) {
          emotes.set(emote.code, {
            name: emote.code,
            url: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
            bigUrl: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            width: emote.width || null,
            height: emote.height || null,
            service: "bttv",
          });
        }
      }
    }

    // Populate 7TV global emotes
    if (sevenTVGlobal && sevenTVGlobal.emotes) {
      for (const emote of sevenTVGlobal.emotes) {
        const file = emote.data?.host?.files.find((f) => f.name === "1x.webp");
        if (emote.name && emote.id && file) {
          emotes.set(emote.name, {
            name: emote.name,
            url: `https:${emote.data.host.url}/1x.webp`,
            bigUrl: `https:${emote.data.host.url}/3x.webp`,
            width: file.width || null,
            height: file.height || null,
            modifier: emote.data.flags > 0,
            service: "7tv",
          });
        }
      }
    }

    if (emotesDebug) console.info("Loaded global emotes:", emotes.size);
  } catch (error) {
    if (emotesDebug)
      console.error("Error loading global emotes:", error.message);
  }
}

async function loadEmotes(userObject) {
  // Check if all required fields are present
  if (!userObject || !userObject.username || !userObject.id) {
    if (emotesDebug) console.error("Invalid userObject provided:", userObject);

    return;
  }

  // Check if emotes are already loaded for this user
  if (currentUserObject && currentUserObject.id === userObject.id) return;

  // Update currentUserObject to the new user
  currentUserObject = userObject;

  if (emotesDebug)
    console.info(`Loading emotes for channel: ${userObject.username}`);

  try {
    await Promise.all([
      loadFFZEmotes(userObject.id),
      loadBTTVEmotes(userObject.id),
      load7TVEmotes(userObject.id),
    ]);

    emoteRegex = createEmoteRegex(emotes);

    if (emotesDebug) {
      console.info(`Loaded ${emotes.size} channel emotes`);
    }
  } catch (error) {
    if (emotesDebug) {
      console.error("Failed to load channel emotes:", error);
    }
  }
}

function getEmote(emoteName) {
  return emotes.get(emoteName);
}

const createEmoteRegex = (emoteMap) => {
  const escapedEmoteNames = Array.from(emoteMap.keys()).map((name) => {
    // Escape all special regex characters, including the colon
    return name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  });

  // Use a more flexible pattern to match emotes
  return new RegExp(
    escapedEmoteNames.map((name) => `(${name})`).join("|"),
    "i"
  );
};

const containsEmote = (element) => emoteRegex.test(element.textContent);

async function initializeEmotes() {
  // Load global emotes once
  if (!globalEmotesLoaded) {
    await loadGlobalEmotes();
    globalEmotesLoaded = true;
  }

  emoteRegex = createEmoteRegex(emotes);
}

// Export necessary functions and the debug variable
export { loadEmotes, getEmote, initializeEmotes, containsEmote };
