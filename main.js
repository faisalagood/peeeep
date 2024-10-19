import { getTwitchUserId } from "./lib.js";

import { loadEmotes, initializeEmotes } from "./emotes.js";

import {
  setupChatObserver,
  addModifierStyles,
  manageEventListeners,
} from "./dom2.js";

import { matchChannelName } from "./navigation.js";


setupChatObserver();

async function main() {
  await addModifierStyles();
  await initializeEmotes();
  manageEventListeners();
  const currentUsername = matchChannelName(window.location.href);

  if (currentUsername) {
    const data = await getTwitchUserId(currentUsername);
    await loadEmotes({ id: data.id, username: data.username });
  }
}

main().catch(console.error);
