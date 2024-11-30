import { emoteManager } from "./emotes.js";
import { observer } from "./observer.js";

export class EmoteAutocomplete {
  #currentIndex = 0;
  #filteredEmotes = [];
  #unsubscribe = null;
  #boundKeyHandler = null;
  #elements = new WeakMap();
  #isAutoCompleting = false;

  constructor() {
    this.#boundKeyHandler = this.#handleKeydown.bind(this);
  }

  async init() {
    this.#unsubscribe = observer.subscribe(
      'div[role="textbox"]',
      (element) => this.#setupChatInput(element)
    );

    document.addEventListener('click', this.#handleOutsideClick.bind(this));
  }

  #handleOutsideClick = (e) => {
    if (!e.target.closest('.emote-popup')) {
      this.#isAutoCompleting = false;
    }
  };

  #setupChatInput(element) {
    if (this.#elements.has(element)) return;
    
    this.#elements.set(element, {
      input: element,
      cleanup: () => {
        element.removeEventListener('keydown', this.#boundKeyHandler);
      }
    });

    element.addEventListener('keydown', this.#boundKeyHandler);
  }

  #handleKeydown(event) {
    if (event.key === 'Escape') {
      this.#isAutoCompleting = false;
    }

    const popup = document.querySelector('.emote-popup');
    
    if (popup) {
      this.#isAutoCompleting = true;
      this.#handlePopupNavigation(event, popup);
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      this.#handleTabComplete(event.target);
    }
  }

  #handlePopupNavigation(event, popup) {
    switch (event.key) {
      case 'Tab':
      case 'ArrowDown':
        event.preventDefault();
        this.#currentIndex = (this.#currentIndex + 1) % this.#filteredEmotes.length;
        this.#updateSelection(popup);
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.#currentIndex = (this.#currentIndex - 1 + this.#filteredEmotes.length) % this.#filteredEmotes.length;
        this.#updateSelection(popup);
        break;
        
      case 'Enter':
        if (this.#isAutoCompleting) {
          event.preventDefault();
          event.stopPropagation();
          const selectedEmote = this.#filteredEmotes[this.#currentIndex];
          if (selectedEmote) {
            this.#insertEmote(selectedEmote.name);
            popup.remove();
            this.#isAutoCompleting = false;
          }
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        popup.remove();
        this.#isAutoCompleting = false;
        break;
    }
  }

  #getCurrentWord(text) {
    const words = text.split(/\s+/);
    return words[words.length - 1] || '';
  }

  #handleTabComplete(inputElement) {
    const currentText = inputElement.textContent;
    const currentWord = this.#getCurrentWord(currentText);
    
    this.#currentIndex = 0;
    
    const searchResults = emoteManager.searchEmotes(currentWord);
    this.#filteredEmotes = searchResults.map(emote => ({
      name: emote.name,
      url: emote.url
    }));

    if (this.#filteredEmotes.length > 0) {
      this.#showEmotePopup(inputElement, currentWord);
    }
  }

  #createPopupRow(emote, index) {
    const row = document.createElement('div');
    row.className = 'emote-row';
    row.dataset.emoteName = emote.name;
    
    Object.assign(row.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      cursor: 'pointer',
      background: index === 0 ? '#303032' : 'transparent'
    });

    const img = document.createElement('img');
    img.src = emote.url;
    img.alt = emote.name;
    Object.assign(img.style, { width: '28px', height: '28px' });

    const name = document.createElement('span');
    name.textContent = emote.name;
    name.style.color = '#efeff1';

    row.append(img, name);

    row.addEventListener('click', () => {
      this.#insertEmote(emote.name);
      document.querySelector('.emote-popup')?.remove();
      this.#isAutoCompleting = false;
    });

    row.addEventListener('mouseover', () => {
      this.#currentIndex = index;
      this.#updateSelection(document.querySelector('.emote-popup'));
    });

    return row;
  }

  #showEmotePopup(inputElement, searchWord) {
    document.querySelector('.emote-popup')?.remove();

    const popup = document.createElement('div');
    popup.className = 'emote-popup';
    popup.dataset.searchWord = searchWord;
    
    Object.assign(popup.style, {
      position: 'fixed',
      background: '#18181b',
      border: '1px solid #303032',
      borderRadius: '4px',
      padding: '8px',
      zIndex: '9999',
      maxHeight: '300px',
      overflowY: 'auto',
      minWidth: '200px',
      visibility: 'hidden' // Initially hidden for measurement
    });

    // Create and append rows
    const fragment = document.createDocumentFragment();
    this.#filteredEmotes.forEach((emote, index) => {
      fragment.appendChild(this.#createPopupRow(emote, index));
    });
    popup.appendChild(fragment);

    // Add to DOM and measure
    document.body.appendChild(popup);
    
    // Position popup
    const inputRect = inputElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    popup.style.left = `${inputRect.left}px`;
    popup.style.bottom = `${viewportHeight - inputRect.top}px`;
    popup.style.visibility = 'visible';

    // Add click handler
    document.addEventListener('click', (e) => {
      if (!popup.contains(e.target) && e.target !== inputElement) {
        popup.remove();
        this.#isAutoCompleting = false;
      }
    }, { once: true });
  }

  #updateSelection(popup) {
    if (!popup) return;
    
    const rows = popup.querySelectorAll('.emote-row');
    rows.forEach((row, index) => {
      row.style.background = index === this.#currentIndex ? '#303032' : 'transparent';
    });

    rows[this.#currentIndex]?.scrollIntoView({ block: 'nearest' });
  }

  #getReactFiber(element) {
    const key = Object.keys(element).find(key => key.startsWith('__reactFiber$'));
    return key ? element[key] : null;
  }

  #findReactComponent(fiber, predicate, maxDepth = 15, depth = 0) {
    try {
      if (predicate(fiber)) return fiber;
    } catch (_) {}
    
    if (!fiber?.return || depth > maxDepth) return null;
    return this.#findReactComponent(fiber.return, predicate, maxDepth, depth + 1);
  }

  #insertEmote(emoteName) {
    const chatInput = document.querySelector('div[role="textbox"]');
    if (!chatInput) return;

    const fiber = this.#getReactFiber(chatInput);
    if (!fiber) return;

    const chatInputComponent = this.#findReactComponent(
      fiber,
      (n) => n?.memoizedProps?.value != null && 
             n?.memoizedProps?.onChange != null &&
             n?.memoizedProps?.onValueUpdate != null
    );

    if (!chatInputComponent) return;

    const currentText = chatInput.textContent;
    const popup = document.querySelector('.emote-popup');
    const searchWord = popup?.dataset.searchWord || '';
    
    const lastIndex = currentText.lastIndexOf(searchWord);
    const newText = lastIndex >= 0 
      ? currentText.substring(0, lastIndex) + emoteName + currentText.substring(lastIndex + searchWord.length)
      : currentText + emoteName;

    const slateValue = [{
      type: 'paragraph',
      children: [{ text: newText }]
    }];

    chatInputComponent.memoizedProps.onChange({
      target: { value: slateValue }
    });
    chatInputComponent.memoizedProps.onValueUpdate(newText);
    
    chatInput.focus();
  }

  cleanup() {
    // Remove popup
    document.querySelector('.emote-popup')?.remove();

    // Clean up element listeners
    for (const [_, data] of this.#elements) {
      data.cleanup();
    }
    
    // Clear collections
    this.#elements = new WeakMap();
    this.#filteredEmotes = [];
    
    // Remove observers and listeners
    if (this.#unsubscribe) {
      this.#unsubscribe();
      this.#unsubscribe = null;
    }

    // Reset state
    this.#currentIndex = 0;
    this.#isAutoCompleting = false;
    this.#boundKeyHandler = null;

    // Remove document listener
    document.removeEventListener('click', this.#handleOutsideClick);
  }
}

export const emoteAutocomplete = new EmoteAutocomplete();