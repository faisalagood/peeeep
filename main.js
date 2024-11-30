import { ChannelManager } from "./lib/navigation.js";
import { TooltipManager } from "./lib/tooltip.js";
import { StyleManager } from "./lib/styles.js";
import { ChatManager } from "./lib/chatProxy.js";
import { EmoteAutocomplete } from "./lib/input.js";

const channelManager = new ChannelManager();

console.log("[PEEEEP] Starting initialization at", window.location.href);

const initializeManagers = async () => {
  try {
    if (!channelManager.shouldInitialize(window.location.href)) {
      console.log(
        "[PEEEEP] Blocked subdomain detected, stopping initialization"
      );
      return;
    }

    const styleManager = new StyleManager();
    const tooltipManager = new TooltipManager();
    const chatManager = new ChatManager();
    const autocomplete = new EmoteAutocomplete();

    await styleManager.init();
    console.log("[PEEEEP] Style manager initialized");

    await channelManager.init();
    console.log("[PEEEEP] Channel manager initialized");

    await chatManager.init();
    console.log("[PEEEEP] Chat manager initialized");

    await tooltipManager.init();
    console.log("[PEEEEP] Tooltip manager initialized");

    await autocomplete.init();
    console.log("[PEEEEP] Autocomplete manager initialized");

    window.addEventListener("unload", () => {
      channelManager.cleanup();
      chatManager.cleanup();
      tooltipManager.cleanup();
      styleManager.cleanup();
      autocomplete.cleanup();
    });
  } catch (error) {
    console.error("[PEEEEP] Manager initialization error:", error);
  }
};

initializeManagers();
