import { getEmote, containsEmote, loadEmotes } from "./emotes.js";
import { MutationSummary } from "mutation-summary";
import { matchChannelName } from "./navigation.js";
import { getTwitchUserId } from "./lib.js";

// Global references
let currentMessageContainer = null;
let currentOriginalAppendChild = null;
let currentOriginalInsertBefore = null;
let currentOriginalRemoveChild = null;

// Helper functions
const createTextFragment = (text) => {
  const span = document.createElement("span");
  span.classList.add("text-fragment");
  span.textContent = text;
  return span;
};

const createEmoteImage = (emote) => {
  const img = document.createElement("img");
  img.src = emote.url;
  img.alt = emote.name;
  img.classList.add("simple-emote-extension");
  if (emote.modifier) img.classList.add("modifier");
  return img;
};

// Avoid unnecessary layout thrashing
const processWord = (
  word,
  fragment,
  text,
  modifierDiv,
  currentState,
  lastRegularEmote
) => {
  if (word.startsWith("@"))
    return { fragment, text, modifierDiv, currentState, lastRegularEmote };

  const emote = getEmote(word);

  if (emote) {
    if (text.trim()) {
      fragment.appendChild(createTextFragment(text));
      text = "";
    }

    const emoteImage = createEmoteImage(emote);

    if (emote.modifier) {
      if (currentState !== "PROCESSING_MODIFIER") {
        modifierDiv = document.createElement("div");
        modifierDiv.classList.add("modifier-container");
        if (lastRegularEmote) {
          modifierDiv.appendChild(lastRegularEmote);
          lastRegularEmote = null;
        }
        currentState = "PROCESSING_MODIFIER";
      }
      modifierDiv.appendChild(emoteImage);
    } else {
      if (currentState === "PROCESSING_MODIFIER") {
        fragment.appendChild(modifierDiv);
        modifierDiv = null;
        currentState = "PROCESSING";
      }
      lastRegularEmote = emoteImage;
      fragment.appendChild(emoteImage);
    }
  } else {
    if (currentState === "PROCESSING_MODIFIER") {
      fragment.appendChild(modifierDiv);
      modifierDiv = null;
      currentState = "PROCESSING";
    }
    if (lastRegularEmote) {
      fragment.appendChild(lastRegularEmote);
      lastRegularEmote = null;
    }
    text += ` ${word} `;
  }

  return { fragment, text, modifierDiv, currentState, lastRegularEmote };
};

const processMessageContent = (chatMessageBody) => {
  let currentState = "PROCESSING";
  let fragment = new DocumentFragment();
  let text = "";
  let modifierDiv = null;
  let lastRegularEmote = null;

  chatMessageBody.childNodes.forEach((node) => {
    if (node.tagName === "SPAN" || node.classList.contains("text-fragment")) {
      const words = (node.textContent || node.data).split(/\s+/);
      words.forEach((word) => {
        ({ fragment, text, modifierDiv, currentState, lastRegularEmote } =
          processWord(
            word,
            fragment,
            text,
            modifierDiv,
            currentState,
            lastRegularEmote
          ));
      });
    } else {
      fragment.appendChild(node.cloneNode(true));
    }
  });

  // Finalize any remaining modifier div, regular emote, or text
  if (currentState === "PROCESSING_MODIFIER" && modifierDiv) {
    fragment.appendChild(modifierDiv);
  } else if (lastRegularEmote) {
    fragment.appendChild(lastRegularEmote);
  }
  if (text.trim()) {
    fragment.appendChild(createTextFragment(text));
  }

  return fragment;
};

const processChatMessage = (chatMessageBody) => {
  if (!chatMessageBody || !containsEmote(chatMessageBody)) return null;

  const processedContent = processMessageContent(chatMessageBody);
  return processedContent || null;
};

// Optimize chat container override
function findAndOverrideChat() {
  const messageContainer = document.querySelector(
    ".chat-scrollable-area__message-container"
  );

  // Avoid re-binding if the same container is detected
  if (!messageContainer || messageContainer === currentMessageContainer) return;

  // Clean up old references if they exist
  if (currentMessageContainer) {
    if (currentOriginalAppendChild) {
      currentMessageContainer.appendChild = currentOriginalAppendChild;
    }
    if (currentOriginalInsertBefore) {
      currentMessageContainer.insertBefore = currentOriginalInsertBefore;
    }
    if (currentOriginalRemoveChild) {
      currentMessageContainer.removeChild = currentOriginalRemoveChild;
    }
  }

  // Store the container and its original methods
  currentMessageContainer = messageContainer;
  currentOriginalAppendChild =
    messageContainer.appendChild.bind(messageContainer);
  currentOriginalInsertBefore =
    messageContainer.insertBefore.bind(messageContainer);
  currentOriginalRemoveChild =
    messageContainer.removeChild.bind(messageContainer);

  // Override appendChild using requestAnimationFrame for DOM batch updates
  messageContainer.appendChild = async function (child) {
    processChildNode(child);
    return currentOriginalAppendChild(child);
  };

  // Override removeChild
  messageContainer.removeChild = async function (child) {
    try {
      return currentOriginalRemoveChild(child);
    } catch (e) {
      if (e.name === "NotFoundError") {
        return child;
      }
      throw e;
    }
  };

  // Override insertBefore
  messageContainer.insertBefore = async function (newNode, referenceNode) {
    processChildNode(newNode);
    return currentOriginalInsertBefore(newNode, referenceNode);
  };
}

async function processChildNode(child) {
  const messageBody = child.querySelector(
    '[data-a-target="chat-line-message-body"]'
  );
  if (!messageBody) return;

  const processedContent = processChatMessage(messageBody);

  // Use requestAnimationFrame to batch DOM updates
  if (processedContent instanceof DocumentFragment) {
    requestAnimationFrame(() => {
      // Use replaceChildren or append in one go
      messageBody.replaceChildren(processedContent);
    });
  }
}

// MutationSummary callback function to detect chat container mutations
async function onChatMutation(summaries) {
  const [summary] = summaries;
  const chatContainerRemoved = summary.removed.length > 0;
  const chatContainerAdded = summary.added.length > 0;

  if (chatContainerRemoved) {
    console.log("Chat container removed, waiting for a new one...");
    currentMessageContainer = null;
    currentOriginalAppendChild = null; // Free memory
    currentOriginalInsertBefore = null; // Free memory
    lastProcessedMessageId = null; // Reset processed message ID
  }

  if (chatContainerAdded || !currentMessageContainer) {
    requestAnimationFrame(findAndOverrideChat);
    const currentUsername = matchChannelName(window.location.href);

    if (currentUsername) {
      const data = await getTwitchUserId(currentUsername);
      await loadEmotes({ id: data.id, username: data.username });
    }
  }
}
// Initialize the chat override process with mutation-summary
function initializeChatOverride() {
  // Configure mutation-summary to watch for added/removed chat containers
  new MutationSummary({
    callback: onChatMutation,
    queries: [{ element: ".chat-scrollable-area__message-container" }],
  });

  manageEventListeners();

  findAndOverrideChat(); // Find and override the initial chat container
}

// Cleanup helper to remove references and stop observing mutations
function cleanup() {
  window.removeEventListener("unload", cleanup);
  document.removeEventListener("DOMContentLoaded", initializeChatOverride);

  if (currentMessageContainer) {
    if (currentOriginalAppendChild) {
      currentMessageContainer.appendChild = currentOriginalAppendChild; // Reset to original
    }
    if (currentOriginalInsertBefore) {
      currentMessageContainer.insertBefore = currentOriginalInsertBefore; // Reset to original
    }
  }

  // Nullify all references for garbage collection
  currentMessageContainer = null;
  currentOriginalAppendChild = null;
  currentOriginalInsertBefore = null;
  lastProcessedMessageId = null; // Clear memory references
}

const addModifierStyles = async () => {
  const style = document.createElement("style");
  style.textContent = `
    .modifier-container {
      display: unset; /* Remove inherited display properties */
      display: inline-grid; /* Use grid for stacking */
      justify-items: center; /* Center items horizontally */
    }

    .chat-line__no-background * {
      align-items: center;
      vertical-align: middle;
    }

    .modifier {
      z-index: 1;
    }

    .modifier-container img {
      grid-area: 1 / 1; /* Stack all images in the same grid area */
      width: min-content; /* Make images fill the container width */
      height: min-content; /* Maintain aspect ratio */
    }

    .emote-tooltip {
      position: absolute;
      background-color: rgba(0, 0, 0, 0.5); /* 50% transparent black */
      color: white;
      padding: 5px; /* Add some padding around the tooltip */
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none; /* Make sure the tooltip doesn't interfere with mouse events */
      z-index: 1000;
      text-align: center; /* Center the text */
    }

    .emote-preview img {
      padding: 5px; /* Add padding around the image */
    }

    .emote-info {
      margin-top: 5px;
    }

    .emote-name, .emote-service {
      display: block;
      font-size: 16px;
    }

    .emote-service {
      font-size: 13px;
      color: #ccc; /* Light gray for the service name */
    }`;

  // Append the style element to the document head
  document.head.appendChild(style);
};

// Throttling function to optimize event listeners
const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function () {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

// Manage event listeners efficiently
const manageEventListeners = () => {
  const root = document.querySelector("#root");

  // Check if the event listeners have already been added
  if (!root.dataset.eventListenersAdded) {
    let tooltip = null;
    let isTooltipActive = false;

    const throttledMouseMove = throttle((e) => {
      if (isTooltipActive && tooltip) {
        const tooltipRect = tooltip.getBoundingClientRect();
        tooltip.style.left = `${Math.min(
          window.innerWidth - tooltipRect.width - 10,
          e.clientX
        )}px`;
        tooltip.style.top = `${Math.min(
          window.innerHeight - tooltipRect.height,
          e.clientY
        )}px`;
      }
    }, 16); // Approx 60fps

    root.addEventListener("mouseover", (event) => {
      const emoteElement = event.target.closest(".simple-emote-extension");
      if (!emoteElement) return;

      const modifierContainer = emoteElement.closest(".modifier-container");
      const emotes = modifierContainer
        ? Array.from(
            modifierContainer.querySelectorAll(".simple-emote-extension")
          )
        : [emoteElement];

      // If a tooltip already exists, remove it before creating a new one
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }

      tooltip = document.createElement("div");
      tooltip.classList.add("emote-tooltip");
      document.body.appendChild(tooltip);

      emotes.forEach((emote) => {
        const emoteInfo = getEmote(emote.getAttribute("alt"));
        const emoteContent = document.createElement("div");
        emoteContent.classList.add("emote-content");

        const emotePreview = document.createElement("div");
        emotePreview.classList.add("emote-preview");
        const emoteImg = document.createElement("img");
        emoteImg.src = emoteInfo.bigUrl;
        emoteImg.alt = emoteInfo.name;
        emotePreview.appendChild(emoteImg);

        const emoteInfoDiv = document.createElement("div");
        emoteInfoDiv.classList.add("emote-info");
        const emoteNameDiv = document.createElement("div");
        emoteNameDiv.classList.add("emote-name");
        emoteNameDiv.textContent = emoteInfo.name;

        const emoteServiceDiv = document.createElement("div");
        emoteServiceDiv.classList.add("emote-service");
        emoteServiceDiv.textContent = emoteInfo.service.toUpperCase();

        emoteInfoDiv.appendChild(emoteNameDiv);
        emoteInfoDiv.appendChild(emoteServiceDiv);
        emoteContent.appendChild(emotePreview);
        emoteContent.appendChild(emoteInfoDiv);

        tooltip.appendChild(emoteContent);
      });

      // Add throttled mouse move for tooltip positioning
      document.addEventListener("mousemove", throttledMouseMove);

      const removeTooltip = () => {
        if (tooltip) {
          tooltip.remove();
          tooltip = null;
          document.removeEventListener("mousemove", throttledMouseMove);
        }
        isTooltipActive = false;
      };

      // Tooltip removal logic
      const handleMouseLeave = () => {
        removeTooltip();
      };

      emoteElement.addEventListener("mouseleave", handleMouseLeave, {
        once: true,
      });

      document.addEventListener(
        "mousemove",
        (e) => {
          if (!isTooltipActive) return;
          // Check if the mouse has moved significantly far from the emote
          const distanceX = Math.abs(
            e.clientX - emoteElement.getBoundingClientRect().left
          );
          const distanceY = Math.abs(
            e.clientY - emoteElement.getBoundingClientRect().top
          );
          const maxDistance = 100; // Adjust this threshold as needed

          if (distanceX > maxDistance || distanceY > maxDistance) {
            handleMouseLeave();
          }
        },
        { once: true }
      );

      isTooltipActive = true;
    });

    // Mark that event listeners have been added
    root.dataset.eventListenersAdded = true;
  }
};

// Start the process when the document is ready
window.addEventListener("unload", cleanup);

export { initializeChatOverride, manageEventListeners, addModifierStyles };
