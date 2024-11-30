class OptimizedObserver {
  static instance = null;
  static #UPDATE_BATCH_SIZE = 100;
  static #ELEMENT_CACHE = new WeakMap();
  static #SELECTOR_TYPES = new Map();
    
  #activeQueue = new Set();
  #pendingQueue = new Set();
  #callbacks = new Map();
  #processingScheduled = false;
  #observer = null;
  #rootNode = null;

  static getInstance() {
    return OptimizedObserver.instance ??= new OptimizedObserver();
  }

  constructor() {
    if (OptimizedObserver.instance) return OptimizedObserver.instance;
    
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", this.init, { once: true });
    } else {
      this.init();
    }
    OptimizedObserver.instance = this;
  }

  init = () => {
    this.#rootNode = document.body;
    this.#observer = new MutationObserver(this.#handleMutations);
    
    this.#observer.observe(this.#rootNode, {
      childList: true,
      subtree: true,
      attributes: true
    });
  };

  #handleMutations = (mutations) => {
    let addedCount = 0;
    
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.#pendingQueue.add(node);
            addedCount++;
          }
        }
      } else if (mutation.type === "attributes" && mutation.target.nodeType === Node.ELEMENT_NODE) {
        this.#pendingQueue.add(mutation.target);
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
  };

  #scheduleProcessing = () => {
    if (this.#processingScheduled) return;
    this.#processingScheduled = true;
    requestAnimationFrame(this.#processQueue);
  };

  #processQueue = () => {
    this.#processingScheduled = false;
    if (!this.#pendingQueue.size) return;

    [this.#activeQueue, this.#pendingQueue] = [this.#pendingQueue, this.#activeQueue];
    this.#pendingQueue.clear();

    for (const element of this.#activeQueue) {
      if (!element.isConnected) continue;
      
      for (const [selector, callbacks] of this.#callbacks) {
        const type = this.#getSelectorType(selector);
        if (this.#processMatches(element, selector, type, callbacks)) break;
      }
    }
    
    this.#activeQueue.clear();
  };

  #getSelectorType(selector) {
    let type = OptimizedObserver.#SELECTOR_TYPES.get(selector);
    if (!type) {
      type = selector[0] === '#' ? 1 :
             selector[0] === '.' ? 2 :
             selector.includes('[') ? 4 : 3;
      OptimizedObserver.#SELECTOR_TYPES.set(selector, type);
    }
    return type;
  }

  #processMatches(element, selector, type, callbacks) {
    let cache = OptimizedObserver.#ELEMENT_CACHE.get(element);
    if (!cache) {
      cache = new Map();
      OptimizedObserver.#ELEMENT_CACHE.set(element, cache);
    }

    const matches = this.#findMatches(element, selector, type, cache);
    if (!matches) return true;

    for (const match of matches) {
      if (!match.isConnected) continue;
      for (const callback of callbacks) callback(match);
    }
    
    return false;
  }

  #findMatches(element, selector, type, cache) {
    if (!element.isConnected) return null;
    const cacheKey = `${type}:${selector}`;
    const matches = cache.get(cacheKey);
    if (matches) return matches;

    const selectorValue = type < 3 ? selector.slice(1) : selector;
    
    const newMatches = type === 1 ? [document.getElementById(selectorValue)]?.filter(Boolean) :
                      type === 2 ? element.getElementsByClassName(selectorValue) :
                      type === 3 ? element.getElementsByTagName(selectorValue) :
                      element.querySelectorAll(selector);
    
    cache.set(cacheKey, newMatches);
    return newMatches;
  }

  subscribe(selector, callback) {
    let callbacks = this.#callbacks.get(selector);
    if (!callbacks) {
      callbacks = new Set();
      this.#callbacks.set(selector, callbacks);
    }
    callbacks.add(callback);

    return () => {
      const cb = this.#callbacks.get(selector);
      if (cb?.delete(callback) && !cb.size) this.#callbacks.delete(selector);
    };
  }

  cleanup() {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#callbacks.clear();
    this.#activeQueue.clear();
    this.#pendingQueue.clear();
    this.#processingScheduled = false;
    this.#rootNode = null;
    OptimizedObserver.instance = null;
    OptimizedObserver.#ELEMENT_CACHE = new WeakMap();
    OptimizedObserver.#SELECTOR_TYPES.clear();
  }
}

export const observer = OptimizedObserver.getInstance();