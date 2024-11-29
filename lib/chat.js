import { observer } from "./observer.js";
import { emoteManager } from "./emotes.js";

class ChatManager {
  static CHAT_MESSAGE_SELECTOR = 'span[data-a-target="chat-line-message-body"]';
  
  static #EMOTE_CLASS = "peeeep";
  static #EMOTE_CLASS_SELECTOR = ".peeeep";
  static #TWITCH_EMOTE_SELECTOR = ".chat-line__message--emote-button";
  static #TWITCH_EMOTE_CLASS = "chat-line__message--emote-button";
  static #TWITCH_IMAGE_SELECTOR = "img.chat-image";
  static #TEXT_FRAGMENT_CLASS = "text-fragment";
  static #STACK_CONTAINER_CLASS = "modifier-container";
  static #SPACE_NODE = document.createTextNode(" ");
  static #TEXT_NODE = 3;
  static #WORD_SPLIT_REGEX = /\s+/;
  static #SPACE_STRING = " ";
  static #EMPTY_STRING = "";
  static #TEXT_PARTS = [];
  static #WORDS = [];
  static #STACK_TEMPLATE = document.createElement("div");
  static #EMOTE_IMG_TEMPLATE = document.createElement("img");
  static #UPDATE_QUEUE = new Map();
  static #UPDATE_SCHEDULED = false;

  static {
    ChatManager.#STACK_TEMPLATE.className = ChatManager.#STACK_CONTAINER_CLASS;
    ChatManager.#EMOTE_IMG_TEMPLATE.className = ChatManager.#EMOTE_CLASS;
  }

  static #isSpaceNode(node) {
    return node.nodeType === ChatManager.#TEXT_NODE && 
           node.textContent === ChatManager.#SPACE_STRING;
  }

  static #processUpdateQueue() {
    for (const [container, fragment] of ChatManager.#UPDATE_QUEUE) {
      if (container.isConnected) container.replaceChildren(fragment);
    }
    ChatManager.#UPDATE_QUEUE.clear();
    ChatManager.#UPDATE_SCHEDULED = false;
  }

  #unsubscribe = null;

  async init() {
    this.#unsubscribe = observer.subscribe(
      ChatManager.CHAT_MESSAGE_SELECTOR,
      (container) => this.#handleMessage(container)
    );
  }

  #handleMessage(container) {
    if (!this.#shouldProcessMessage(container)) return;
    const fragment = this.#processNodes(container.childNodes);
    if (!fragment) return;
    ChatManager.#UPDATE_QUEUE.set(container, fragment);
    this.#scheduleUpdate();
  }

  #scheduleUpdate() {
    if (!ChatManager.#UPDATE_SCHEDULED) {
      ChatManager.#UPDATE_SCHEDULED = true;
      requestAnimationFrame(ChatManager.#processUpdateQueue);
    }
  }

  #shouldProcessMessage(container) {
    if (container.querySelector(ChatManager.#EMOTE_CLASS_SELECTOR)) return false;
    if (container.querySelector(ChatManager.#TWITCH_EMOTE_SELECTOR)) return true;
    return emoteManager.containsEmote(container);
  }

  #processNodes(nodes) {
    if (!nodes.length) return null;
    
    const fragment = document.createDocumentFragment();
    ChatManager.#TEXT_PARTS.length = 0;

    for (const node of nodes) {
      if (node.nodeType === ChatManager.#TEXT_NODE) {
        ChatManager.#TEXT_PARTS.push(node.textContent);
        continue;
      }

      if (ChatManager.#TEXT_PARTS.length) {
        this.#appendProcessedText(ChatManager.#TEXT_PARTS.join(ChatManager.#EMPTY_STRING), fragment);
        ChatManager.#TEXT_PARTS.length = 0;
      }

      const classList = node.classList;
      if (!classList) {
        fragment.appendChild(node.cloneNode(true));
        continue;
      }

      if (classList.contains(ChatManager.#TEXT_FRAGMENT_CLASS)) {
        this.#appendProcessedText(node.textContent, fragment);
      } else if (classList.contains(ChatManager.#TWITCH_EMOTE_CLASS)) {
        this.#appendTwitchEmote(node.querySelector(ChatManager.#TWITCH_IMAGE_SELECTOR), fragment);
      } else {
        fragment.appendChild(node.cloneNode(true));
      }
    }

    if (ChatManager.#TEXT_PARTS.length) {
      this.#appendProcessedText(ChatManager.#TEXT_PARTS.join(ChatManager.#EMPTY_STRING), fragment);
      ChatManager.#TEXT_PARTS.length = 0;
    }

    return fragment;
  }

  #processModifier(fragment, img, modifierStack) {
    const lastElement = fragment.lastElementChild;
    if (!modifierStack && lastElement?.classList?.contains(ChatManager.#EMOTE_CLASS)) {
      modifierStack = ChatManager.#STACK_TEMPLATE.cloneNode();
      modifierStack.appendChild(lastElement.cloneNode(true));
      fragment.replaceChild(modifierStack, lastElement);
    }
    if (modifierStack) {
      modifierStack.appendChild(img);
      return { modifierStack, shouldContinue: true };
    }
    return { modifierStack, shouldContinue: false };
  }

  #appendProcessedText(text, fragment) {
    if (!text) return;
    
    ChatManager.#WORDS.length = 0;
    ChatManager.#WORDS.push(...text.trim().split(ChatManager.#WORD_SPLIT_REGEX));
    if (!ChatManager.#WORDS.length) return;

    let modifierStack = null;
    let lastNode = fragment.lastChild;

    for (const word of ChatManager.#WORDS) {
      const emote = emoteManager.getEmote(word);

      if (!emote) {
        if (modifierStack) {
          fragment.appendChild(modifierStack);
          modifierStack = null;
        }
        if (lastNode && !ChatManager.#isSpaceNode(lastNode)) {
          const space = ChatManager.#SPACE_NODE.cloneNode();
          fragment.appendChild(space);
          lastNode = space;
        }
        const textNode = document.createTextNode(word);
        fragment.appendChild(textNode);
        lastNode = textNode;
        continue;
      }

      const img = emoteManager.createEmoteImage(emote);

      if (emote.modifier) {
        const { modifierStack: newStack, shouldContinue } = this.#processModifier(fragment, img, modifierStack);
        modifierStack = newStack;
        if (shouldContinue) continue;
      }

      if (modifierStack) {
        fragment.appendChild(modifierStack);
        modifierStack = null;
      }

      if (lastNode && !ChatManager.#isSpaceNode(lastNode)) {
        const space = ChatManager.#SPACE_NODE.cloneNode();
        fragment.appendChild(space);
        lastNode = space;
      }
      fragment.appendChild(img);
      lastNode = img;
    }

    if (modifierStack) fragment.appendChild(modifierStack);
  }

  #appendTwitchEmote(sourceImg, fragment) {
    if (!sourceImg?.isConnected) return;

    const img = ChatManager.#EMOTE_IMG_TEMPLATE.cloneNode();
    img.src = sourceImg.src;
    img.alt = sourceImg.alt;

    const lastNode = fragment.lastChild;
    if (!lastNode || !ChatManager.#isSpaceNode(lastNode)) {
      fragment.appendChild(ChatManager.#SPACE_NODE.cloneNode());
    }
    
    fragment.appendChild(img);
    fragment.appendChild(ChatManager.#SPACE_NODE.cloneNode());
  }

  cleanup() {
    if (this.#unsubscribe) {
      this.#unsubscribe();
      this.#unsubscribe = null;
    }
    ChatManager.#UPDATE_QUEUE.clear();
    ChatManager.#UPDATE_SCHEDULED = false;
  }
}

export { ChatManager };