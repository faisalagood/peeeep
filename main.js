import { OptimizedObserver } from "./lib/observer.js";
import { ChannelHandler } from "./lib/navigation.js";
import { initializeEmotes } from "./lib/emotes.js";
import { ChatProcessor } from "./lib/processor.js";
import { Tooltip } from "./lib/tooltip.js";
import { addStyles } from "./lib/styles.js";

// Debug mode setting
const DEBUG = true;

// Current Channel Name FIX LATER

let currentChannel = "";

// Create chat processor instance
const chatProcessor = new ChatProcessor();

// Create Channel Handler

const channelHandler = new ChannelHandler();

// Process chat message body
const processChatMessage = (element) => {
  chatProcessor.process(element);
};

// Process channel title
const processChannelTitle = async () => {
  const username = channelHandler.matchChannelName(window.location.href);
  if (username && currentChannel !== username) {
    currentChannel = username;
    await channelHandler.urlChangeHandler(username);
  }
};

// Create observer instance
const observer = new OptimizedObserver(
  (element) => {
    if (element.matches('[data-a-target="chat-line-message-body"]')) {
      processChatMessage(element);
    } else if (element.matches("h1.tw-title")) {
      processChannelTitle(element);
    }
  },
  {
    containerAttribute: "data-observer-root",
    targets: [
      {
        type: "selector",
        value: `[data-a-target="chat-line-message-body"]`,
      },
      {
        type: "selector",
        value: "h1.tw-title",
      },
    ],
    batchSize: 10,
  }
);

// Set up initial observer
const setupObserver = async () => {
  // Add styles first
  addStyles();

  // Initialize emotes
  await initializeEmotes();

  // Setup tooltips
  new Tooltip();

  // Add the observer root attribute to document.body
  document.body.setAttribute("data-observer-root", "");

  // Process initial channel if we're on a channel page
  const username = channelHandler.matchChannelName(window.location.href);
  if (username) {
    await channelHandler.urlChangeHandler(username);
  }

  if (DEBUG) {
    console.info("Observer setup complete");
  }
};

setupObserver();

// Disconnect observer when window is closing
window.addEventListener("unload", () => {
  if (observer) {
    observer.disconnect();
    if (DEBUG) {
      console.info("Observer disconnected on window close");
    }
  }
});