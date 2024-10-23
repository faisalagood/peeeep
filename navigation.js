import { getTwitchUserId } from "./lib.js";
import { initializeEmotes, loadEmotes } from "./emotes.js";

// Keep track of the current username

let currentUsername = null;

// Log website navigation

let navDebug = true;


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
  downloads: true,
};

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

// if (window.navigation) {
//   window.navigation.addEventListener("navigate", async (event) => {
//     const newUsername = matchChannelName(event.destination.url);

//     if (newUsername) {
//       await urlChangeHandler(newUsername);
//     }
//   });
// }

const setUsername = (newUsername) => {
  if (newUsername) currentUsername = newUsername
}

const urlChangeHandler = async (newUsername) => {
  // Check if the username has actually changed

  if (newUsername !== currentUsername) {
    if (navDebug) {
      console.info("URL changed, the channel is now:", newUsername);
    }

    currentUsername = newUsername; // Update the current username

    const data = await getTwitchUserId(newUsername);
    await initializeEmotes();
    await loadEmotes({ id: data.id, username: data.username });
  }
};

export { matchChannelName, urlChangeHandler, setUsername };
