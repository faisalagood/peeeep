import { getEmote, containsEmote } from "./emotes.js";
import { urlChangeHandler } from "./navigation.js";
import { MutationSummary } from "mutation-summary";

// Helper functions
const createTextFragment = (text) => {
  const span = document.createElement("span");
  span.classList.add("text-fragment");
  if (text.trim() === "") span.classList.add("spacer");
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

const processWord = (word, fragment, text, modifierDiv, currentState) => {
  if (word.startsWith("@"))
    return { fragment, text, modifierDiv, currentState }; // Skip mentions
  const emote = getEmote(word);
  if (emote) {
    if (text.trim()) {
      fragment.appendChild(createTextFragment(text));
      text = "";
    }

    const emoteImage = createEmoteImage(emote);
    if (emote.modifier) {
      if (currentState === "PROCESSING") {
        currentState = "PROCESSING_MODIFIER";
        modifierDiv = document.createElement("div");
        modifierDiv.classList.add("modifier-container");
        if (fragment.lastElementChild instanceof HTMLImageElement) {
          modifierDiv.appendChild(fragment.lastElementChild);
        }
      }
      modifierDiv.appendChild(emoteImage);
    } else {
      if (currentState === "PROCESSING_MODIFIER") {
        fragment.appendChild(modifierDiv);
        modifierDiv = null;
        currentState = "PROCESSING";
      }
      fragment.appendChild(emoteImage);
    }
  } else {
    text += ` ${word} `;
  }

  return { fragment, text, modifierDiv, currentState };
};

const processMessageContent = (chatMessageBody) => {
  let currentState = "PROCESSING";
  let fragment = new DocumentFragment();
  let text = "";
  let modifierDiv = null;

  let textFragmentSpan = chatMessageBody.querySelector(".text-fragment");
  if (textFragmentSpan) {
    const words = textFragmentSpan.textContent.split(/\s+/);
    words.forEach((word) => {
      ({ fragment, text, modifierDiv, currentState } = processWord(
        word,
        fragment,
        text,
        modifierDiv,
        currentState
      ));
    });
  }

  return { fragment, text, modifierDiv, currentState };
};

const processChatMessage = (chatMessageBody) => {
  if (!chatMessageBody || !containsEmote(chatMessageBody)) return;

  let { fragment, text, modifierDiv } = processMessageContent(chatMessageBody);
  if (text.trim()) fragment.appendChild(createTextFragment(text));
  if (modifierDiv) fragment.appendChild(modifierDiv);

  chatMessageBody.replaceChildren(fragment);
};

const setupChatObserver = () => {
  let eventListenersLoaded = false;

  const processMutations = async (summaries) => {
    const chatMessages = summaries[0].added; // Array of added chat messages
    const promises = [];

    chatMessages.forEach((node) => {
      if (!eventListenersLoaded) {
        manageEventListeners();
        eventListenersLoaded = true;
      }

      if (node.dataset?.aTarget === "chat-line-message-body") {
        promises.push(processChatMessage(node));
      }

      if (node.classList.contains("tw-title")) {
        console.log(node.parentElement.href);
      }
    });

    await Promise.all(promises);
  };

  const startObserving = () => {
    const targetNode = document.querySelector(
      ".channel-root__right-column.channel-root__right-column--expanded"
    );

    if (targetNode) {
      // Use mutation-summary to watch for added chat messages
      const ms = new MutationSummary({
        callback: processMutations, // Callback to handle mutations
        queries: [
          { element: `[data-a-target="chat-line-message-body"]` },
          { element: "h1.tw-title" },
        ], // Only track added chat lines and the parent of the username
      });

      console.log("Observer started on target node.");

      // Process mutations
      function processMutations(summaries) {
        const addedChatLines = summaries[0].added;
        const addedStreamInfo = summaries[1].added;

        addedChatLines.forEach((chatLine) => {
          // Process chat lines here
          processChatMessage(chatLine);
        });

        addedStreamInfo.forEach((titleElement) => {
          // Call the function to find and process the title element
          if (
            titleElement &&
            titleElement.parentElement &&
            titleElement.parentElement.href
          ) {
            urlChangeHandler(titleElement.parentElement.href.split("/").pop());
          }
        });
      }
    } else {
      console.log("Target node not found, checking again in 1000ms...");
    }
  };

  const intervalId = setInterval(() => {
    const targetNode = document.querySelector(
      ".channel-root__right-column.channel-root__right-column--expanded"
    );

    if (targetNode) {
      clearInterval(intervalId); // Stop checking once the target node is found
      startObserving(); // Start observing the target node
    }
  }, 1000); // Check every 1 second
};

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

const manageEventListeners = () => {
  const root = document.querySelector(".root");

  let tooltip = null;
  let isTooltipActive = false;

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

    const updateTooltipPosition = (e) => {
      if (!tooltip) return; // Check if tooltip still exists
      const tooltipRect = tooltip.getBoundingClientRect();
      tooltip.style.left = `${Math.min(
        window.innerWidth - tooltipRect.width - 10,
        e.clientX
      )}px`;
      tooltip.style.top = `${Math.min(
        window.innerHeight - tooltipRect.height,
        e.clientY
      )}px`;
    };

    updateTooltipPosition(event);
    isTooltipActive = true;

    const mouseMoveHandler = (e) => {
      if (isTooltipActive) {
        updateTooltipPosition(e);
      } else {
        document.removeEventListener("mousemove", mouseMoveHandler);
      }
    };

    document.addEventListener("mousemove", mouseMoveHandler);

    // Tooltip removal logic
    const removeTooltip = () => {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
      isTooltipActive = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
    };

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
  });
};

export {
  setupChatObserver,
  processChatMessage,
  manageEventListeners,
  addModifierStyles,
};
