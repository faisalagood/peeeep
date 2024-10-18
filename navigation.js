import { getTwitchUserId } from "./lib.js";
import { initializeEmotes, loadEmotes } from "./emotes.js";

// Ignored pages for URL changes

const ignoredPages = {
  settings: true,
  payments: true,
  inventory: true,
  messages: true,
  subscriptions: true,
  friends: true,
  directory: true,
  videos: true,
  prime: true,
  downloads: true
};

let navDebug = false;

function matchChannelName(url) {
  if (!url) return undefined;

  const match = url.match(
    /^https?:\/\/(?:www\.)?twitch\.tv\/(\w+)\/?(?:\?.*)?$/
  );

  if (match && !ignoredPages[match[1]]) {
    return match[1];
  }

  return undefined;
}

window.navigation.addEventListener("navigate", async (event) => {
  const newUsername = matchChannelName(event.destination.url);

  if (newUsername) {
    await urlChangeHandler(newUsername);
  }
});

const urlChangeHandler = async (newUsername) => {
  if (navDebug)
    console.info("URL changed, loading emotes for new user:", newUsername);

  const data = await getTwitchUserId(newUsername);

  await initializeEmotes();
  await loadEmotes({ id: data.id, username: data.username });
};

export { matchChannelName, urlChangeHandler };
