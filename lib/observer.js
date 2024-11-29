class OptimizedObserver {
  static instance = null;
  static #UPDATE_BATCH_SIZE = 100;
  static #QUERY_CACHE = new WeakMap();

  #callbacks = new Map();
  #queuedElements = new Set();
  #processingScheduled = false;
  #isProcessing = false;
  #observer = null;
  #rootNode = null;

  static getInstance = () => 
    OptimizedObserver.instance ??= new OptimizedObserver();

  constructor() {
    if (OptimizedObserver.instance) return OptimizedObserver.instance;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init(), { once: true });
    } else {
      this.init();
    }
    OptimizedObserver.instance = this;
  }

  init = () => {
    this.#rootNode = document.body;
    this.#observer = new MutationObserver(mutations => {
      let addedCount = 0;

      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.#queuedElements.add(node);
              addedCount++;
            }
          }
        } else if (mutation.type === "attributes" && mutation.target.nodeType === Node.ELEMENT_NODE) {
          this.#queuedElements.add(mutation.target);
          addedCount++;
        }

        if (addedCount >= OptimizedObserver.#UPDATE_BATCH_SIZE) {
          this.#scheduleProcessing();
          addedCount = 0;
        }
      }

      if (addedCount > 0) {
        this.#scheduleProcessing();
      }
    });

    this.#observer.observe(this.#rootNode, {
      childList: true,
      subtree: true,
      attributes: true
    });
  };

  #scheduleProcessing = () => {
    if (this.#processingScheduled || this.#isProcessing) return;
    this.#processingScheduled = true;
    requestAnimationFrame(this.#processQueue);
  };

  #processQueue = () => {
    this.#processingScheduled = false;
    if (!this.#queuedElements.size || this.#isProcessing) return;
    this.#isProcessing = true;

    for (const element of this.#queuedElements) {
      if (!element.isConnected) continue;
      for (const [selector, callbacks] of this.#callbacks) {
        const type = this.#getSelectorTypeForElement(selector, element);
        this.#processMatches(element, selector, type, callbacks);
      }
    }

    this.#queuedElements.clear();
    this.#isProcessing = false;
  };

  #getSelectorTypeForElement = (selector, element) => {
    let elementCache = OptimizedObserver.#QUERY_CACHE.get(element);
    if (!elementCache) {
      elementCache = new Map();
      OptimizedObserver.#QUERY_CACHE.set(element, elementCache);
    }

    let type = elementCache.get(selector);
    if (!type) {
      type = selector.startsWith('#') ? 'id' :
             selector.startsWith('.') ? 'class' :
             selector.includes('[') ? 'complex' : 'tag';
      elementCache.set(selector, type);
    }
    return type;
  };

  #checkMatch = (element, selector, type) => {
    switch (type) {
      case 'id': return element.id === selector.slice(1);
      case 'class': return element.classList.contains(selector.slice(1));
      case 'tag': return element.tagName.toLowerCase() === selector;
      default: return element.matches(selector);
    }
  };

  #findMatches = (element, selector, type) => {
    let elementCache = OptimizedObserver.#QUERY_CACHE.get(element);
    let matches = elementCache?.get(`${selector}-matches`);
    
    if (!matches) {
      if (type === 'id') {
        const idElement = document.getElementById(selector.slice(1));
        matches = idElement ? [idElement] : [];
      } else {
        matches = type === 'class' ? element.getElementsByClassName(selector.slice(1)) :
                 type === 'tag' ? element.getElementsByTagName(selector) :
                 element.querySelectorAll(selector);
      }
      elementCache.set(`${selector}-matches`, matches);
    }
    
    return matches;
  };

  #processMatches = (element, selector, type, callbacks) => {
    if (this.#checkMatch(element, selector, type)) {
      for (const callback of callbacks) callback(element);
    }

    const matches = this.#findMatches(element, selector, type);
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      if (match.isConnected && match !== element) {
        for (const callback of callbacks) callback(match);
      }
    }
  };

  subscribe = (selector, callback) => {
    if (!this.#callbacks.has(selector)) {
      this.#callbacks.set(selector, new Set());
    }
    this.#callbacks.get(selector).add(callback);

    return () => {
      const callbacks = this.#callbacks.get(selector);
      if (callbacks?.delete(callback) && callbacks.size === 0) {
        this.#callbacks.delete(selector);
      }
    };
  };

  cleanup = () => {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#callbacks.clear();
    this.#queuedElements.clear();
    this.#processingScheduled = false;
    this.#isProcessing = false;
    this.#rootNode = null;
    OptimizedObserver.instance = null;
    OptimizedObserver.#QUERY_CACHE = new WeakMap();
  };
}

export const observer = OptimizedObserver.getInstance();