import { emoteManager } from "./emotes.js";
import { observer } from "./observer.js";

class EmoteAutocomplete {
  static #instance = null;

  #currentIndex = 0;
  #filteredEmotes = [];
  #unsubscribe = null;
  #boundKeyHandler = null;
  #elements = new WeakMap();
  #isAutoCompleting = false;
  #chatInput = null;

  constructor() {
    if (EmoteAutocomplete.#instance) {
      return EmoteAutocomplete.#instance;
    }
    EmoteAutocomplete.#instance = this;
    this.#boundKeyHandler = this.#handleKeydown.bind(this);
  }

  static getInstance() {
    return (EmoteAutocomplete.#instance ??= new EmoteAutocomplete());
  }

  async init() {
    const selector = [
      'div[role="textbox"][data-slate-editor="true"]',
      'div[data-a-target="chat-input"]',
      "div.chat-wysiwyg-input__editor",
    ].join(",");

    this.#unsubscribe = observer.subscribe(
      '[data-a-target="chat-input"]',
      (element) => {
        if (this.#isValidChatInput(element)) {
          this.#chatInput = element;
          this.#setupChatInput(element);
        }
      }
    );

    const existingInput = document.querySelector(selector);
    if (existingInput && this.#isValidChatInput(existingInput)) {
      this.#chatInput = existingInput;
      this.#setupChatInput(existingInput);
    }

    document.addEventListener("click", this.#handleOutsideClick.bind(this));
  }

  #isValidChatInput(element) {
    return (
      element?.isConnected &&
      element.getAttribute("role") === "textbox" &&
      element.getAttribute("data-slate-editor") === "true" &&
      element.getAttribute("data-a-target") === "chat-input" &&
      element.classList.contains("chat-wysiwyg-input__editor")
    );
  }

  #handleOutsideClick = (e) => {
    if (!e.target.closest(".emote-popup")) {
      this.#isAutoCompleting = false;
    }
  };

  #setupChatInput(element) {
    if (this.#elements.has(element)) {
      return;
    }

    const handleTabCapture = (event) => {
      if (event.key === "Tab" && !event.shiftKey) {
        const currentText = element.textContent?.trim();
        if (currentText && !this.#getPopup()) {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.#handleTabComplete(element);
        }
      }
    };

    element.addEventListener("keydown", handleTabCapture, { capture: true });

    const setupWithRetry = (retryCount = 0, maxRetries = 3) => {
      const fiber = this.#getReactFiber(element);

      if (!fiber && retryCount < maxRetries) {
        console.debug(
          `[EmoteAutocomplete] Retry ${
            retryCount + 1
          }/${maxRetries} getting React fiber`
        );
        setTimeout(
          () => setupWithRetry(retryCount + 1, maxRetries),
          100 * Math.pow(2, retryCount)
        );
        return;
      }

      if (!fiber) {
        console.warn(
          "[EmoteAutocomplete] Failed to get React fiber for chat input"
        );
        return;
      }

      const chatInputComponent = this.#findReactComponent(fiber, (n) => {
        try {
          return (
            n?.memoizedProps?.value != null &&
            typeof n?.memoizedProps?.onChange === "function" &&
            typeof n?.memoizedProps?.onValueUpdate === "function"
          );
        } catch (e) {
          return false;
        }
      });

      if (!chatInputComponent) {
        console.warn("[EmoteAutocomplete] Failed to find chat input component");
        return;
      }

      const originalOnChange = chatInputComponent.memoizedProps.onChange;
      chatInputComponent.memoizedProps.onChange = (e) => {
        if (!e.target.value?.[0]?.children?.[0]?.text) {
          this.#removePopup();
        }
        originalOnChange(e);
      };

      this.#elements.set(element, {
        input: element,
        cleanup: () => {
          element.removeEventListener("keydown", this.#boundKeyHandler);
          element.removeEventListener("keydown", handleTabCapture, {
            capture: true,
          });
        },
      });

      element.addEventListener("keydown", this.#boundKeyHandler);
    };

    setupWithRetry();
  }

  #getPopup() {
    return document.querySelector(".emote-popup");
  }

  #removePopup() {
    this.#getPopup()?.remove();
    this.#isAutoCompleting = false;
  }

  #handleKeydown(event) {
    if (event.key === "Escape") {
      this.#removePopup();
    }

    if (
      event.key === "Backspace" &&
      !this.#chatInput.querySelector('[data-slate-string="true"]')?.textContent
    ) {
      this.#removePopup();
      return;
    }

    const popup = this.#getPopup();
    if (popup) {
      this.#isAutoCompleting = true;
      this.#handlePopupNavigation(event, popup);
    }
  }

  #handlePopupNavigation(event, popup) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        event.stopPropagation();
        this.#currentIndex =
          (this.#currentIndex + 1) % this.#filteredEmotes.length;
        this.#updateSelection(popup);
        break;

      case "ArrowUp":
        event.preventDefault();
        event.stopPropagation();
        this.#currentIndex =
          (this.#currentIndex - 1 + this.#filteredEmotes.length) %
          this.#filteredEmotes.length;
        this.#updateSelection(popup);
        break;

      case "Tab":
        event.preventDefault();
        event.stopPropagation();
        this.#currentIndex =
          (this.#currentIndex + 1) % this.#filteredEmotes.length;
        this.#updateSelection(popup);
        break;

      case "Enter":
        if (this.#isAutoCompleting) {
          event.preventDefault();
          event.stopPropagation();
          const selectedEmote = this.#filteredEmotes[this.#currentIndex];
          if (selectedEmote) {
            this.#insertEmote(selectedEmote.name);
            this.#removePopup();
          }
        }
        break;

      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        this.#removePopup();
        break;
    }
  }

  #getCurrentWord(text) {
    const words = text.split(/\s+/);
    return words[words.length - 1] || "";
  }

  #handleTabComplete(inputElement) {
    const currentText = inputElement.textContent;
    const currentWord = this.#getCurrentWord(currentText);

    this.#currentIndex = 0;

    const searchResults = emoteManager.searchEmotes(currentWord);
    this.#filteredEmotes = searchResults.map((emote) => ({
      name: emote.name,
      url: emote.url,
    }));

    if (this.#filteredEmotes.length > 0) {
      this.#showEmotePopup(inputElement, currentWord);
    }
  }

  #createPopupRow(emote, index) {
    const row = document.createElement("div");
    row.className = "emote-row";
    row.dataset.emoteName = emote.name;

    Object.assign(row.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "4px 8px",
      cursor: "pointer",
      background: index === 0 ? "#303032" : "transparent",
    });

    const imgContainer = document.createElement("div");
    Object.assign(imgContainer.style, {
      width: "28px",
      height: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    });

    const img = document.createElement("img");
    img.src = emote.url;
    img.alt = emote.name;
    Object.assign(img.style, {
      maxWidth: "28px",
      maxHeight: "28px",
      width: "auto",
      height: "auto",
      objectFit: "contain",
    });

    imgContainer.appendChild(img);

    const name = document.createElement("span");
    name.textContent = emote.name;
    name.style.color = "#efeff1";

    row.append(imgContainer, name);

    row.addEventListener("click", () => {
      this.#insertEmote(emote.name);
      this.#removePopup();
    });

    row.addEventListener("mouseover", () => {
      this.#currentIndex = index;
      this.#updateSelection(this.#getPopup());
    });

    return row;
  }

  #showEmotePopup(inputElement, searchWord) {
    this.#removePopup();

    const popup = document.createElement("div");
    popup.className = "emote-popup";
    popup.dataset.searchWord = searchWord;

    Object.assign(popup.style, {
      position: "fixed",
      background: "#18181b",
      border: "1px solid #303032",
      borderRadius: "4px",
      padding: "8px",
      zIndex: "9999",
      maxHeight: "300px",
      overflowY: "auto",
      minWidth: "200px",
      visibility: "hidden",
    });

    const fragment = document.createDocumentFragment();
    this.#filteredEmotes.forEach((emote, index) => {
      fragment.appendChild(this.#createPopupRow(emote, index));
    });
    popup.appendChild(fragment);

    document.body.appendChild(popup);

    const inputRect = inputElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    popup.style.left = `${inputRect.left}px`;
    popup.style.bottom = `${viewportHeight - inputRect.top}px`;
    popup.style.visibility = "visible";

    document.addEventListener(
      "click",
      (e) => {
        if (!popup.contains(e.target) && e.target !== inputElement) {
          this.#removePopup();
        }
      },
      { once: true }
    );
  }

  #updateSelection(popup) {
    if (!popup) return;

    const rows = popup.querySelectorAll(".emote-row");
    rows.forEach((row, index) => {
      row.style.background =
        index === this.#currentIndex ? "#303032" : "transparent";
    });

    rows[this.#currentIndex]?.scrollIntoView({ block: "nearest" });
  }

  #getReactFiber(element) {
    const fiberKeys = [
      "__reactFiber$",
      "__reactInternalInstance$",
      "__reactContainer$",
    ];

    for (const prefix of fiberKeys) {
      const key = Object.keys(element).find((key) => key.startsWith(prefix));
      if (key && element[key]) {
        return element[key];
      }
    }

    return null;
  }

  #findReactComponent(fiber, predicate, maxDepth = 20, depth = 0) {
    if (!fiber) return null;

    try {
      if (predicate(fiber)) return fiber;
    } catch (_) {}

    if (depth >= maxDepth) return null;

    const returnResult = fiber.return
      ? this.#findReactComponent(fiber.return, predicate, maxDepth, depth + 1)
      : null;

    if (returnResult) return returnResult;

    const siblingResult = fiber.sibling
      ? this.#findReactComponent(fiber.sibling, predicate, maxDepth, depth + 1)
      : null;

    return siblingResult;
  }

  #insertEmote(emoteName) {
    if (!this.#chatInput) return;

    const fiber = this.#getReactFiber(this.#chatInput);
    if (!fiber) return;

    const chatInputComponent = this.#findReactComponent(
      fiber,
      (n) =>
        n?.memoizedProps?.value != null &&
        n?.memoizedProps?.onChange != null &&
        n?.memoizedProps?.onValueUpdate != null
    );

    if (!chatInputComponent) return;

    const currentText = this.#chatInput.textContent;
    const popup = this.#getPopup();
    const searchWord = popup?.dataset.searchWord || "";

    const lastIndex = currentText.lastIndexOf(searchWord);
    const newText =
      lastIndex >= 0
        ? currentText.substring(0, lastIndex) +
          emoteName +
          currentText.substring(lastIndex + searchWord.length)
        : currentText + emoteName;

    const slateValue = [
      {
        type: "paragraph",
        children: [{ text: newText }],
      },
    ];

    chatInputComponent.memoizedProps.onChange({
      target: { value: slateValue },
    });
    chatInputComponent.memoizedProps.onValueUpdate(newText);

    this.#chatInput.focus();
  }

  cleanupChannel() {
    this.#isAutoCompleting = false;
    this.#currentIndex = 0;
    this.#filteredEmotes = [];
    this.#removePopup();
  }

  cleanup() {
    this.#removePopup();
    for (const [_, data] of this.#elements) {
      data.cleanup();
    }
    this.#elements = new WeakMap();
    this.#filteredEmotes = [];
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    this.#currentIndex = 0;
    this.#isAutoCompleting = false;
    this.#boundKeyHandler = null;
    this.#chatInput = null;
    document.removeEventListener("click", this.#handleOutsideClick);
  }
}

export const emoteAutocomplete = EmoteAutocomplete.getInstance();
