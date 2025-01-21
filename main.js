import { styleManager } from "./lib/styles.js";
import { tooltipManager } from "./lib/tooltip.js";
import { chatManager } from "./lib/chat.js";
import { channelManager } from "./lib/navigation.js";
import { emoteManager } from "./lib/emotes.js";
import { emoteAutocomplete } from "./lib/input.js";
import { usernameColorManager } from "./lib/mentions.js";

console.log("[PEEEEP] Starting initialization at", window.location.href);

const initializeApp = async () => {
  try {
    if (!channelManager.shouldInitialize(window.location.href)) {
      console.log(`[PEEEEP] Skipping ${window.location.href}`);
      return;
    }

    await styleManager.init();
    console.log("[PEEEEP] Style manager initialized");
    
    await chatManager.init();
    console.log("[PEEEEP] Chat manager initialized");
    
    await emoteManager.init();
    console.log("[PEEEEP] Emote manager initialized");

    await tooltipManager.init();
    console.log("[PEEEEP] Tooltip manager initialized");
    
    await usernameColorManager.init();
    console.log("[PEEEEP] Username color manager initialized");
    
    await emoteAutocomplete.init();
    console.log("[PEEEEP] Autocomplete manager initialized");

    channelManager.onChannelChange((oldChannelId, newChannelId) => {      
      if (oldChannelId && newChannelId && oldChannelId !== newChannelId) {
        chatManager.cleanupChannel?.();
        tooltipManager.cleanupChannel?.();
        emoteAutocomplete.cleanupChannel?.();
        usernameColorManager.cleanupChannel?.();
        emoteManager.cleanupChannel?.();
      }
    });

    await channelManager.init();
    
    console.log("[PEEEEP] Channel manager initialized");

    window.addEventListener("unload", () => {
      channelManager.cleanup();
      chatManager.cleanup();
      tooltipManager.cleanup();
      styleManager.cleanup();
      emoteAutocomplete.cleanup();
      usernameColorManager.cleanup();
      emoteManager.cleanup();
    });

  } catch (error) {
    console.error("[PEEEEP] Initialization error:", error);
  }
};

initializeApp();