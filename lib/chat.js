import { observer } from "./observer.js";
import { emoteManager } from "./emotes.js";

class ChatManager {
  #unsubscribe = null;
  #spacer = document.createTextNode(" ");
  #WORD_REGEX = /\S+|\s+/g;
  #SPACE_REGEX = /^\s+$/;

  #processText(text, fragment, lastNode) {
    if (!text) return lastNode;

    const words = text.match(this.#WORD_REGEX) || [];
    let modifierContainer = null;
    let currentSpan = null;
    let needsSpace = false;

    for (const word of words) {
      if (this.#SPACE_REGEX.test(word)) {
        needsSpace = true;
        continue;
      }

      const emote = emoteManager.getEmote(word);
      if (!emote) {
        if (modifierContainer) {
          fragment.appendChild(modifierContainer);
          fragment.appendChild(this.#spacer.cloneNode());
          modifierContainer = null;
        }

        if (!currentSpan) {
          currentSpan = document.createElement("span");
        } else if (needsSpace) {
          currentSpan.textContent += " ";
        }
        currentSpan.textContent += word;
        needsSpace = true;
        lastNode = currentSpan;
        continue;
      }

      if (currentSpan) {
        fragment.appendChild(currentSpan);
        fragment.appendChild(this.#spacer.cloneNode());
        currentSpan = null;
      }

      const img = emoteManager.createEmoteImage(emote);
      if (emote.modifier && lastNode?.classList?.contains("peeeep")) {
        if (!modifierContainer) {
          modifierContainer = document.createElement("div");
          modifierContainer.className = "modifier-container";
          modifierContainer.appendChild(lastNode.cloneNode(true));
          if (lastNode.parentNode === fragment) {
            fragment.replaceChild(modifierContainer, lastNode);
          } else {
            fragment.appendChild(modifierContainer);
          }
        }
        modifierContainer.appendChild(img);
        lastNode = img;
        continue;
      }

      if (modifierContainer) {
        fragment.appendChild(modifierContainer);
        fragment.appendChild(this.#spacer.cloneNode());
        modifierContainer = null;
      }
      fragment.appendChild(img);
      if (!emote.modifier) {
        fragment.appendChild(this.#spacer.cloneNode());
      }
      lastNode = img;
    }

    if (modifierContainer) {
      fragment.appendChild(modifierContainer);
      fragment.appendChild(this.#spacer.cloneNode());
    }

    if (currentSpan) {
      fragment.appendChild(currentSpan);
      fragment.appendChild(this.#spacer.cloneNode());
    }

    return lastNode;
  }

  process(container) {
    if (
      !emoteManager.containsEmote(container) &&
      !container.querySelector(".chat-line__message--emote-button")
    )
      return;

    const fragment = document.createDocumentFragment();
    let lastNode = null;

    for (const node of container.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        lastNode = this.#processText(node.textContent, fragment, lastNode);
        continue;
      }

      if (node.classList?.contains("text-fragment")) {
        lastNode = this.#processText(node.textContent, fragment, lastNode);
        continue;
      }

      const twitchEmote = node.querySelector("img.chat-image");
      if (twitchEmote?.isConnected) {
        const img = document.createElement("img");
        img.src = twitchEmote.src;
        img.alt = twitchEmote.alt;
        img.className = "peeeep";
        fragment.appendChild(img);
        fragment.appendChild(this.#spacer.cloneNode());
        lastNode = img;
        continue;
      }

      if (node.tagName === "IMG" && node.classList.contains("peeeep")) {
        const isModifier = node.classList.contains("modifier");
        const img = node.cloneNode(true);

        if (isModifier && lastNode?.classList?.contains("peeeep")) {
          const modifierContainer = document.createElement("div");
          modifierContainer.className = "modifier-container";
          modifierContainer.appendChild(lastNode.cloneNode(true));
          if (lastNode.parentNode === fragment) {
            fragment.replaceChild(modifierContainer, lastNode);
          } else {
            fragment.appendChild(modifierContainer);
          }
          modifierContainer.appendChild(img);
          lastNode = img;
        } else {
          fragment.appendChild(img);
          lastNode = img;
        }
        continue;
      }

      fragment.appendChild(node.cloneNode(true));
      fragment.appendChild(this.#spacer.cloneNode());
      lastNode = node;
    }

    container.replaceChildren(fragment);
  }

  async init() {
    await new Promise((resolve, reject) => {
      requestIdleCallback(
        () => {
          try {
            this.#unsubscribe = observer.subscribe(
              'span[data-a-target="chat-line-message-body"]',
              (element) => this.process(element)
            );
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        { timeout: 5000 }
      );
    });
  }

  cleanupChannel() {
    observer.clearPending();
  }

  cleanup() {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }
}

export const chatManager = new ChatManager();
