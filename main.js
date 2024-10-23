import { getTwitchUserId } from "./lib.js";

import { loadEmotes, initializeEmotes } from "./emotes.js";

import { setUsername } from "./navigation.js";

import {
  addModifierStyles,
  initializeChatOverride,
} from "./dom2.js";

import { matchChannelName } from "./navigation.js";


initializeChatOverride();

async function main() {
  await addModifierStyles();
  await initializeEmotes();
  const currentUsername = matchChannelName(window.location.href);

  if (currentUsername) {
    setUsername(currentUsername);
    const data = await getTwitchUserId(currentUsername);
    await loadEmotes({ id: data.id, username: data.username });
  }
}

main().catch(console.error);
