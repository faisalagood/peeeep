import { getEmote, containsEmote } from "./emotes.js";

// Define the state machine
const ChatMessageStateMachine = {
  states: {
    PROCESSING: "PROCESSING",
    PROCESSING_MODIFIER: "PROCESSING_MODIFIER",
    FINAL: "FINAL",
  },

  transitions: {
    PROCESSING: {
      encounterModifier: "PROCESSING_MODIFIER",
      endProcessing: "FINAL",
    },
    PROCESSING_MODIFIER: {
      continueModifier: "PROCESSING_MODIFIER",
      endModifier: "PROCESSING",
    },
    FINAL: {}, // No transitions from FINAL
  },
};

// Helper function to peek two elements back
const peekTwoElementsBack = (fragment) => {
  const children = fragment.children;
  if (children.length >= 2) {
    return [children[children.length - 2], children[children.length - 1]];
  }
  return [null, null];
};

// Helper functions
const createTextFragment = (text) => {
  const span = document.createElement("span");
  span.classList.add("text-fragment");
  span.textContent = text.trim();
  return span;
};

const createEmoteImage = (emote) => {
  const img = document.createElement("img");
  img.src = emote.url;
  img.alt = emote.name;
  img.className = "unreadable";
  if (emote.modifier) {
    img.classList.add("modifier");
  }
  return img;
};

const createModifierContainer = () => {
  const div = document.createElement("div");
  div.classList.add("modifier-container");
  return div;
};

const processWord = (word, fragment, text, modifierDiv, currentState) => {
  if (word[0] === "@") return { fragment, text, modifierDiv, currentState }; // Skip mentions

  const emote = getEmote(word);
  if (emote) {
    if (text.trim()) {
      fragment.appendChild(createTextFragment(text));
      text = "";
    }

    const emoteImage = createEmoteImage(emote);
    if (emote.modifier) {
      if (currentState === ChatMessageStateMachine.states.PROCESSING) {
        currentState = ChatMessageStateMachine.states.PROCESSING_MODIFIER;
        modifierDiv = createModifierContainer();
        if (fragment.lastElementChild instanceof HTMLImageElement) {
          modifierDiv.appendChild(fragment.lastElementChild);
        }
      }
      modifierDiv.appendChild(emoteImage);
    } else {
      if (currentState === ChatMessageStateMachine.states.PROCESSING_MODIFIER) {
        fragment.appendChild(modifierDiv);
        modifierDiv = null;
        currentState = ChatMessageStateMachine.states.PROCESSING;
      }
      fragment.appendChild(emoteImage);
    }
  } else {
    text += ` ${word} `;
  }

  return { fragment, text, modifierDiv, currentState };
};

const processNode = (node, fragment, text, modifierDiv, currentState) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const words = node.textContent.split(/\s+/);
    return words.reduce(
      (acc, word) =>
        processWord(
          word,
          acc.fragment,
          acc.text,
          acc.modifierDiv,
          acc.currentState
        ),
      { fragment, text, modifierDiv, currentState }
    );
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.classList.contains("chat-line__message--emote")) {
      const clonedEmote = node.cloneNode(true);
      clonedEmote.className = "unreadable";
      fragment.appendChild(clonedEmote);
      if (currentState === ChatMessageStateMachine.states.PROCESSING_MODIFIER) {
        fragment.appendChild(modifierDiv);
        modifierDiv = null;
        currentState = ChatMessageStateMachine.states.PROCESSING;
      }
    } else {
      return Array.from(node.childNodes).reduce(
        (acc, childNode) =>
          processNode(
            childNode,
            acc.fragment,
            acc.text,
            acc.modifierDiv,
            acc.currentState
          ),
        { fragment, text, modifierDiv, currentState }
      );
    }
  }
  return { fragment, text, modifierDiv, currentState };
};

/// Helper function to process the message content
const processMessageContent = (chatMessageBody) => {
  let currentState = ChatMessageStateMachine.states.PROCESSING;
  let fragment = new DocumentFragment();
  let text = "";
  let modifierDiv = null;

  const result = Array.from(chatMessageBody.childNodes).reduce(
    (acc, node) =>
      processNode(
        node,
        acc.fragment,
        acc.text,
        acc.modifierDiv,
        acc.currentState
      ),
    { fragment, text, modifierDiv, currentState }
  );

  return result;
};

// Helper function to finalize the message processing
const finalizeMessageProcessing = (fragment, text, modifierDiv) => {
  if (text.trim()) {
    fragment.appendChild(createTextFragment(text));
  }
  if (modifierDiv) {
    fragment.appendChild(modifierDiv);
  }
  return fragment;
};

// Main processChatMessage function
const processChatMessage = (chatMessageBody) => {
  if (!chatMessageBody) return;

  if (containsEmote(chatMessageBody)) {
    const { fragment, text, modifierDiv } =
      processMessageContent(chatMessageBody);
    const finalFragment = finalizeMessageProcessing(
      fragment,
      text,
      modifierDiv
    );
    chatMessageBody.replaceChildren(finalFragment);
  }
};

const setupChatObserver = () => {
  let eventListenersLoaded = false;

  const observer = new MutationObserver((mutationsList) => {
    for (let i = 0; i < mutationsList.length; i++) {
      const mutation = mutationsList[i];
      if (mutation.type === "childList") {
        for (let j = 0; j < mutation.addedNodes.length; j++) {
          const node = mutation.addedNodes[j];
          if (node.nodeType === 1 && node.className === "chat-line__message") {
            if (!eventListenersLoaded) {
              manageEventListeners();
              eventListenersLoaded = true;
            }
            processChatMessage(
              node.querySelector('[data-a-target="chat-line-message-body"]')
            );
          }
        }
      }
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
};

const manageEventListeners = () => {
  const root = document.querySelector(".root");

  const handleMouseOver = function (event) {
    const emoteElement = event.target.closest(".unreadable");
    if (emoteElement) {
      const modifierContainer = emoteElement.closest('.modifier-container');
      const emotes = modifierContainer ? Array.from(modifierContainer.querySelectorAll('.unreadable')) : [emoteElement];

      // Create tooltip
      const tooltip = document.createElement("div");
      tooltip.classList.add("emote-tooltip");

      // Create content for each emote
      emotes.forEach((emote, index) => {
        const emoteName = emote.getAttribute("alt");
        const emoteInfo = getEmote(emoteName);

        const emoteContent = document.createElement('div');
        emoteContent.classList.add('emote-content');

        // Create and append emote preview elements
        const emotePreview = document.createElement('div');
        emotePreview.classList.add('emote-preview');
        const emoteImg = document.createElement('img');
        emoteImg.src = emoteInfo.bigUrl;
        emoteImg.alt = emoteName;
        emotePreview.appendChild(emoteImg);
        emoteContent.appendChild(emotePreview);

        // Create and append emote info elements
        const emoteInfoDiv = document.createElement('div');
        emoteInfoDiv.classList.add('emote-info');
        const emoteNameDiv = document.createElement('div');
        emoteNameDiv.classList.add('emote-name');
        emoteNameDiv.textContent = emoteName;
        const emoteServiceDiv = document.createElement('div');
        emoteServiceDiv.classList.add('emote-service');
        emoteServiceDiv.textContent = emoteInfo.service.toUpperCase() + " Emote";
        emoteInfoDiv.appendChild(emoteNameDiv);
        emoteInfoDiv.appendChild(emoteServiceDiv);
        emoteContent.appendChild(emoteInfoDiv);

        tooltip.appendChild(emoteContent);

        // Add separator if not the last emote
        if (index < emotes.length - 1) {
          const separator = document.createElement('div');
          separator.classList.add('emote-separator');
          tooltip.appendChild(separator);
        }
      });

      document.body.appendChild(tooltip);

      // Style the tooltip
      Object.assign(tooltip.style, {
        position: 'absolute',
        backgroundColor: '#18181b',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: '1000',
        fontSize: '14px'
      });

      // Style each emote content
      tooltip.querySelectorAll('.emote-content').forEach(content => {
        Object.assign(content.style, {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 0'
        });
      });

      // Style the emote preview
      tooltip.querySelectorAll('.emote-preview').forEach(preview => {
        Object.assign(preview.style, {
          width: '40px',
          height: '40px',
          backgroundColor: 'transparent',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '4px'
        });
      });

      // Style the emote image
      tooltip.querySelectorAll('.emote-preview img').forEach(img => {
        Object.assign(img.style, {
          maxWidth: '100%',
          maxHeight: '100%'
        });
      });

      // Style the emote info
      tooltip.querySelectorAll('.emote-info').forEach(info => {
        Object.assign(info.style, {
          display: 'flex',
          flexDirection: 'column'
        });
      });

      // Style the emote name
      tooltip.querySelectorAll('.emote-name').forEach(name => {
        Object.assign(name.style, {
          fontWeight: 'bold'
        });
      });

      // Style the service name
      tooltip.querySelectorAll('.emote-service').forEach(service => {
        Object.assign(service.style, {
          fontSize: '12px',
          opacity: '0.8'
        });
      });

      // Style the separator
      tooltip.querySelectorAll('.emote-separator').forEach(separator => {
        Object.assign(separator.style, {
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          margin: '4px 0'
        });
      });

      // Update tooltip position as the mouse moves
      const updateTooltipPosition = (e) => {
        const tooltipRect = tooltip.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const cursorX = e.clientX;
        const cursorY = e.clientY;

        // Position to the left of the cursor
        tooltip.style.left = `${cursorX - tooltipRect.width - 10}px`;

        // Adjust vertical position if needed
        if (cursorY + tooltipRect.height > window.innerHeight) {
          tooltip.style.top = `${window.innerHeight - tooltipRect.height}px`;
        } else {
          tooltip.style.top = `${cursorY}px`;
        }
      };

      // Initial position update
      updateTooltipPosition(event);

      // Handle mouse movement
      document.addEventListener("mousemove", updateTooltipPosition);

      // Handle mouse leaving the element
      const targetElement = modifierContainer || emoteElement;
      targetElement.addEventListener(
        "mouseleave",
        () => {
          tooltip.remove();
          document.removeEventListener("mousemove", updateTooltipPosition);
        },
        { once: true }
      );
    }
  };

  root.addEventListener("mouseover", handleMouseOver);
};

async function addModifierStyles() {
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
        background-color: black;
        color: white;
        padding: 5px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none; /* Make sure the tooltip doesn't interfere with mouse events */
        z-index: 1000;
      }
    `;

  // Append the style element to the document head
  document.head.appendChild(style);
}

export {
  setupChatObserver,
  processChatMessage,
  manageEventListeners,
  addModifierStyles,
};
