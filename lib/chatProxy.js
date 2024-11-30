import { emoteManager } from "./emotes.js";
import { observer } from "./observer.js";

export class ChatManager {
  static #TEXT_NODE = 3;
  
  static #SHARED = {
    space: document.createTextNode(" "),
    text: document.createTextNode(""),
    fragment: document.createDocumentFragment(),
    img: document.createElement("img"),
    modifier: document.createElement("div")
  };
  
  static #CHAR_CODES = new Uint16Array(1024);
  static #WORD_INDICES = new Uint16Array(256);
  static #TEXT_NODE_POOL = [];
  
  static {
    ChatManager.#SHARED.img.className = "peeeep";
    ChatManager.#SHARED.modifier.className = "modifier-container";
  }

  #chatContainer = null;
  #cleanupFns = new WeakMap();
  #currentMessageLength = 0;
  #wordCount = 0;
  #unsubscribe = null;

  init = async () => {
    try {
      this.#unsubscribe = observer.subscribe(
        ".chat-scrollable-area__message-container",
        (container) => {
          if (container !== this.#chatContainer || !container.isConnected) {
            this.#cleanupContainer();
          }
          
          if (container.isConnected) {
            this.#chatContainer = container;
            this.#setupProxies(container);
          }
        }
      );
    } catch (error) {
      console.error("[PEEEEP] Chat init error:", error);
    }
  }

  #setupProxies = (container) => {
    if (!container || container._isProxied) return;
    
    const originalAppendChild = container.appendChild.bind(container);
    const originalInsertBefore = container.insertBefore.bind(container);

    container.appendChild = new Proxy(originalAppendChild, {
      apply: (target, _, [child]) => {
        const messageBody = child?.querySelector('[data-a-target="chat-line-message-body"]');
        messageBody && this.#updateMessageContent(messageBody);
        return target.apply(container, [child]);
      }
    });

    container.insertBefore = new Proxy(originalInsertBefore, {
      apply: (target, _, [child, reference]) => {
        const messageBody = child?.querySelector('[data-a-target="chat-line-message-body"]');
        messageBody && this.#updateMessageContent(messageBody);
        return target.apply(container, [child, reference]);
      }
    });

    container._isProxied = true;
    
    this.#cleanupFns.set(container, () => {
      if (container._isProxied) {
        container.appendChild = originalAppendChild;
        container.insertBefore = originalInsertBefore;
        delete container._isProxied;
      }
    });
  }

  #updateMessageContent = (messageBody) => {
    if (!messageBody || messageBody.querySelector(".peeeep")) return;
    
    const fragment = this.#processNodes(messageBody.childNodes);
    if (!fragment) return;
    
    messageBody.textContent = "";
    messageBody.appendChild(fragment);
  }

  #processNodes = (nodes) => {
    if (!nodes.length) return null;
  
    const fragment = ChatManager.#SHARED.fragment.cloneNode();
    let lastNode = null;
  
    for (const node of nodes) {
      if (node.nodeType === ChatManager.#TEXT_NODE) {
        lastNode = this.#processText(node.textContent, fragment, lastNode);
        continue;
      }
  
      if (!node.classList) {
        fragment.appendChild(node.cloneNode(true));
        lastNode = node;
        continue;
      }
  
      if (node.classList.contains("chat-line__message--emote-button")) {
        const img = node.querySelector("img.chat-image");
        if (img) {
          lastNode = this.#appendTwitchEmote(img, fragment, lastNode);
          continue;
        }
      }
  
      if (node.classList.contains("text-fragment")) {
        lastNode = this.#processText(node.textContent, fragment, lastNode);
      } else {
        fragment.appendChild(node.cloneNode(true));
        lastNode = node;
      }
    }
  
    return fragment;
  }

  #processText = (text, fragment, lastNode) => {
    if (!text) return lastNode;

    this.#splitText(text);
    let modifierContainer = null;
    let currentNode = lastNode;

    for (let i = 0; i < this.#wordCount; i += 2) {
      const start = ChatManager.#WORD_INDICES[i];
      const end = ChatManager.#WORD_INDICES[i + 1];
      const word = text.slice(start, end);

      if (this.#isWhitespace(ChatManager.#CHAR_CODES[start])) {
        fragment.appendChild(this.#getTextNode(word));
        continue;
      }

      const emote = emoteManager.getEmote(word);
      
      if (!emote) {
        if (modifierContainer) {
          fragment.appendChild(modifierContainer);
          modifierContainer = null;
        }
        
        const textNode = this.#getTextNode(word);
        fragment.appendChild(textNode);
        currentNode = textNode;
        continue;
      }

      const img = emoteManager.createEmoteImage(emote);

      if (emote.modifier && currentNode?.classList?.contains("peeeep")) {
        if (!modifierContainer) {
          modifierContainer = ChatManager.#SHARED.modifier.cloneNode(true);
          modifierContainer.appendChild(currentNode.cloneNode(true));
          fragment.replaceChild(modifierContainer, currentNode);
        }
        modifierContainer.appendChild(img);
        currentNode = img;
        continue;
      }

      if (modifierContainer) {
        fragment.appendChild(modifierContainer);
        modifierContainer = null;
      }

      fragment.appendChild(img);
      currentNode = img;
    }

    if (modifierContainer) fragment.appendChild(modifierContainer);

    return currentNode;
  }

  #appendTwitchEmote = (sourceImg, fragment, lastNode) => {
    if (!sourceImg) return lastNode;

    const img = ChatManager.#SHARED.img.cloneNode(false);
    img.src = sourceImg.src;
    img.alt = sourceImg.alt;

    if (lastNode?.nodeType !== ChatManager.#TEXT_NODE) {
      fragment.appendChild(ChatManager.#SHARED.space.cloneNode());
    }

    fragment.appendChild(img);
    return img;
  }

  #cleanupContainer = () => {
    if (this.#chatContainer) {
      const cleanup = this.#cleanupFns.get(this.#chatContainer);
      if (cleanup) {
        cleanup();
        this.#cleanupFns.delete(this.#chatContainer);
      }
      this.#chatContainer = null;
    }
  }

  cleanup = () => {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#cleanupContainer();
    ChatManager.#TEXT_NODE_POOL.length = 0;
    this.#cleanupFns = new WeakMap();
    this.#currentMessageLength = 0;
    this.#wordCount = 0;
  }

  #getTextNode(content = "") {
    const node = ChatManager.#TEXT_NODE_POOL.pop() || document.createTextNode("");
    node.textContent = content;
    return node;
  }

  #splitText(text) {
    if (text.length > ChatManager.#CHAR_CODES.length) {
      ChatManager.#CHAR_CODES = new Uint16Array(text.length * 2);
      ChatManager.#WORD_INDICES = new Uint16Array(text.length);
    }

    this.#currentMessageLength = text.length;
    for (let i = 0; i < text.length; i++) {
      ChatManager.#CHAR_CODES[i] = text.charCodeAt(i);
    }

    this.#wordCount = 0;
    let start = 0;
    let inSpace = this.#isWhitespace(ChatManager.#CHAR_CODES[0]);

    for (let i = 1; i < this.#currentMessageLength; i++) {
      const currentIsSpace = this.#isWhitespace(ChatManager.#CHAR_CODES[i]);
      if (currentIsSpace !== inSpace) {
        ChatManager.#WORD_INDICES[this.#wordCount++] = start;
        ChatManager.#WORD_INDICES[this.#wordCount++] = i;
        start = i;
        inSpace = currentIsSpace;
      }
    }

    if (start < this.#currentMessageLength) {
      ChatManager.#WORD_INDICES[this.#wordCount++] = start;
      ChatManager.#WORD_INDICES[this.#wordCount++] = this.#currentMessageLength;
    }
  }

  #isWhitespace(charCode) {
    return charCode === 32 || charCode === 9 || charCode === 10 || charCode === 13;
  }
}