import { getEmote, containsEmote, createBaseEmoteImage } from "./emotes.js";

class ChatProcessor {
  static hasEmotes(container) {
    return container.querySelector(".chat-line__message--emote-button") !== null || containsEmote(container);
  }

  createNormalizedEmote(originalImg) {
    const normalizedImg = document.createElement("img");
    normalizedImg.src = originalImg.src;
    normalizedImg.alt = originalImg.alt;
    normalizedImg.className = "simple-emote-extension";
    
    if (originalImg.closest(".chat-line__message--emote-button")) {
      normalizedImg.dataset.officialEmote = "true";
    }
    
    return normalizedImg;
  }

  processTextFragment(element, fragment) {
    // Special handling for links
    if (element.querySelector("a")) {
      const newElement = document.createElement(element.tagName || "span");
      // Use textContent instead of innerHTML for better performance/security
      newElement.textContent = element.textContent;
      fragment.appendChild(newElement);
      return fragment;
    }

    const text = element.textContent;
    const words = text.split(/\s+/);
    let modifierContainer = null;

    const closeModifierContainer = () => {
      if (modifierContainer) {
        fragment.appendChild(modifierContainer);
        modifierContainer = null;
      }
    };

    words.forEach((word, index) => {
      const emote = getEmote(word);

      if (emote) {
        const img = createBaseEmoteImage(emote.name, emote.url, emote.modifier);

        if (emote.modifier) {
          if (!modifierContainer) {
            const lastElement = fragment.lastElementChild;
            if (lastElement?.classList?.contains("simple-emote-extension")) {
              modifierContainer = document.createElement("div");
              modifierContainer.classList.add("modifier-container");
              modifierContainer.appendChild(lastElement);
            }
          }

          if (modifierContainer) {
            modifierContainer.appendChild(img);
          } else {
            fragment.appendChild(img);
          }
        } else {
          closeModifierContainer();
          fragment.appendChild(img);
        }
      } else {
        closeModifierContainer();
        fragment.appendChild(document.createTextNode(word));
      }

      if (index < words.length - 1) {
        fragment.appendChild(document.createTextNode(" "));
      }
    });

    closeModifierContainer();
    return fragment;
  }

  process(container) {
    if (!ChatProcessor.hasEmotes(container)) return;

    const fragment = document.createDocumentFragment();
    const nodes = container.childNodes;
    let hasProcessedNodes = false;

    for (let i = 0; i < nodes.length; i++) {
      const child = nodes[i];

      if (child.nodeType === 1) { // ELEMENT_NODE
        if (child.classList.contains("text-fragment")) {
          hasProcessedNodes = true;
          this.processTextFragment(child, fragment);
        } else if (child.classList.contains("chat-line__message--emote-button")) {
          hasProcessedNodes = true;
          const img = child.querySelector("img.chat-image.chat-line__message--emote");
          if (img) {
            const normalizedImg = this.createNormalizedEmote(img);
            fragment.appendChild(normalizedImg);
          }
        } else {
          const newElement = document.createElement(child.tagName || "div");
          // Replace Array.from with direct iteration
          for (const attr of child.attributes) {
            newElement.setAttribute(attr.name, attr.value);
          }
          newElement.textContent = child.textContent;
          fragment.appendChild(newElement);
          hasProcessedNodes = true;
        }
      } else if (hasProcessedNodes) {
        fragment.appendChild(document.createTextNode(child.textContent));
      }
    }

    if (hasProcessedNodes) {
      container.replaceChildren(fragment);
    }
  }
}

export { ChatProcessor };