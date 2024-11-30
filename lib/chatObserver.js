import { observer } from "./observer.js";
import { emoteManager } from "./emotes.js";

export class ChatManager {
  static #TEXT_NODE = 3;
  static #SPACE_NODE = document.createTextNode(" ");
  static #FRAGMENT = document.createDocumentFragment();
  static #MODIFIER_CONTAINER = document.createElement("div");
  
  #textParts = [];
  #unsubscribe = null;

  constructor() {
    ChatManager.#MODIFIER_CONTAINER.className = "modifier-container";
  }

  async init() {
    this.#unsubscribe = observer.subscribe(
      'span[data-a-target="chat-line-message-body"]',
      this.#processMessage
    );
  }

  #processMessage = (container) => {
    if (container.querySelector(".peeeep")) return;
    
    const fragment = this.#processNodes(container.childNodes);
    if (fragment) {
      while (container.firstChild) {
        container.firstChild.remove();
      }
      container.appendChild(fragment);
    }
  }

  #processNodes(nodes) {
    if (!nodes.length) return null;
    
    const fragment = ChatManager.#FRAGMENT.cloneNode();
    let lastNode = null;

    for (const node of nodes) {
      if (node.nodeType === ChatManager.#TEXT_NODE) {
        lastNode = this.#appendProcessedText(node.textContent, fragment, lastNode);
        continue;
      }

      if (!node.classList) {
        fragment.appendChild(node.cloneNode(true));
        lastNode = node;
        continue;
      }

      if (node.classList.contains("text-fragment")) {
        lastNode = this.#appendProcessedText(node.textContent, fragment, lastNode);
      } else {
        const img = node.querySelector("img.chat-image");
        if (img) {
          lastNode = this.#appendTwitchEmote(img, fragment, lastNode);
        } else {
          fragment.appendChild(node.cloneNode(true));
          lastNode = node;
        }
      }
    }

    return fragment;
  }

  #appendProcessedText(text, fragment, lastNode) {
    if (!text) return lastNode;

    this.#textParts.length = 0;
    this.#textParts.push(...text.split(/(\s+)/));
    
    let modifierStack = null;
    let currentNode = lastNode;

    for (const part of this.#textParts) {
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(part));
        continue;
      }

      const emote = emoteManager.getEmote(part);
      
      if (!emote) {
        if (modifierStack) {
          fragment.appendChild(modifierStack);
          modifierStack = null;
        }
        
        const textNode = document.createTextNode(part);
        fragment.appendChild(textNode);
        currentNode = textNode;
        continue;
      }

      const img = emoteManager.createEmoteImage(emote);

      if (emote.modifier && currentNode?.classList?.contains("peeeep")) {
        if (!modifierStack) {
          modifierStack = ChatManager.#MODIFIER_CONTAINER.cloneNode();
          modifierStack.appendChild(currentNode.cloneNode(true));
          fragment.replaceChild(modifierStack, currentNode);
        }
        modifierStack.appendChild(img);
        currentNode = img;
        continue;
      }

      if (modifierStack) {
        fragment.appendChild(modifierStack);
        modifierStack = null;
      }

      fragment.appendChild(img);
      currentNode = img;
    }

    if (modifierStack) {
      fragment.appendChild(modifierStack);
    }
    
    return currentNode;
  }

  #appendTwitchEmote(sourceImg, fragment, lastNode) {
    if (!sourceImg?.isConnected) return lastNode;

    const img = document.createElement("img");
    img.className = "peeeep";
    img.src = sourceImg.src;
    img.alt = sourceImg.alt;

    if (lastNode?.nodeType !== ChatManager.#TEXT_NODE) {
      fragment.appendChild(ChatManager.#SPACE_NODE.cloneNode());
    }
    
    fragment.appendChild(img);
    return img;
  }

  cleanup() {
    if (this.#unsubscribe) {
      this.#unsubscribe();
      this.#unsubscribe = null;
    }
    this.#textParts.length = 0;
  }
}