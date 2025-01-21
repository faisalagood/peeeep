class OptimizedObserver {
  static #instance = null;
  static #BATCH_SIZE = 50;
  static #IGNORED_TAGS = new Set(['BR', 'HEAD', 'LINK', 'META', 'SCRIPT', 'STYLE', 'VIDEO']);
  static #CALLBACK_TYPE_ERROR = new TypeError('Callback must be a function');

  #queued = new Set();
  #pending = new Set();
  #callbacks = new Map();
  #targets = new Map();
  #isScheduled = false;
  #observer = null;
  #root = null;

  constructor() {
    if (OptimizedObserver.#instance) return OptimizedObserver.#instance;
    OptimizedObserver.#instance = this;
    document.readyState === "loading" 
      ? document.addEventListener("DOMContentLoaded", this.init, { once: true }) 
      : this.init();
  }

  static getInstance() {
    return OptimizedObserver.#instance ??= new OptimizedObserver();
  }

  init = () => {
    this.#root = document.body;
    this.#observer = new MutationObserver(this.#handleMutations);
    this.#observer.observe(this.#root, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: Array.from(this.#targets.values())
        .filter(t => t.type === 'attribute')
        .map(t => t.value),
      attributeOldValue: false
    });
  };

  #normalizeSelector(selector) {
    if (selector[0] === '#') {
      return {
        type: 'id', value: selector.slice(1),
        getElements: () => document.getElementById(selector.slice(1))
      };
    }
    if (selector[0] === '.') {
      return {
        type: 'class', value: selector.slice(1),
        getElements: root => root.getElementsByClassName(selector.slice(1))
      };
    }
    if (selector.includes('[')) {
      const value = selector.slice(selector.indexOf('[') + 1, selector.indexOf(']'));
      return {
        type: 'attribute', value,
        getElements: root => root.querySelectorAll(`[${value}]`)
      };
    }
    return {
      type: 'tag', value: selector,
      getElements: root => root.getElementsByTagName(selector)
    };
  }

  #handleMutations = mutations => {
    let count = 0;
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      if (mutation.type === "childList") {
        for (let j = 0; j < mutation.addedNodes.length; j++) {
          const node = mutation.addedNodes[j];
          if (node.nodeType === Node.ELEMENT_NODE && 
              node.isConnected && 
              !OptimizedObserver.#IGNORED_TAGS.has(node.tagName)) {
            this.#pending.add(node);
            if (++count >= OptimizedObserver.#BATCH_SIZE) {
              this.#scheduleProcessing();
              count = 0;
            }
          }
        }
      } else if (mutation.type === "attributes" && 
                 mutation.target.nodeType === Node.ELEMENT_NODE &&
                 !OptimizedObserver.#IGNORED_TAGS.has(mutation.target.tagName)) {
        this.#pending.add(mutation.target);
        if (++count >= OptimizedObserver.#BATCH_SIZE) {
          this.#scheduleProcessing();
          count = 0;
        }
      }
    }
    if (count > 0) this.#scheduleProcessing();
  };

  #scheduleProcessing = () => {
    if (!this.#isScheduled) {
      this.#isScheduled = true;
      requestAnimationFrame(this.#processQueue);
    }
  };

  #processQueue = () => {
    this.#isScheduled = false;
    if (!this.#pending.size) return;

    [this.#queued, this.#pending] = [this.#pending, this.#queued];
    this.#pending.clear();

    for (const element of this.#queued) {
      if (!element.isConnected) continue;

      for (const [selector, callbacks] of this.#callbacks) {
        try {
          const target = this.#targets.get(selector);
          const matches = target.getElements(element);
          
          if (!matches) continue;
          
          const elements = matches.length !== undefined ? matches : [matches];
          for (let i = 0; i < elements.length; i++) {
            const match = elements[i];
            if (match?.isConnected && !OptimizedObserver.#IGNORED_TAGS.has(match.tagName)) {
              for (const callback of callbacks) {
                try {
                  callback(match);
                } catch (error) {
                  console.error(`[Observer] Callback error for ${selector}:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.error(`[Observer] Processing error for ${selector}:`, error);
        }
      }
    }

    this.#queued.clear();
    if (this.#pending.size > 0) this.#scheduleProcessing();
  };

  subscribe(selector, callback) {
    if (typeof callback !== 'function') throw OptimizedObserver.#CALLBACK_TYPE_ERROR;

    if (!this.#targets.has(selector)) {
      this.#targets.set(selector, this.#normalizeSelector(selector));
    }

    const callbacks = this.#callbacks.get(selector) ?? new Set();
    callbacks.add(callback);
    this.#callbacks.set(selector, callbacks);
    
    return () => {
      const cbs = this.#callbacks.get(selector);
      if (cbs?.delete(callback) && !cbs.size) {
        this.#callbacks.delete(selector);
        this.#targets.delete(selector);
      }
    };
  }

  clearPending() {
    this.#queued.clear();
    this.#pending.clear();
    this.#isScheduled = false;
  }

  cleanup() {
    this.#observer?.disconnect();
    this.#observer = this.#root = null;
    this.#callbacks.clear();
    this.#targets.clear();
    this.#queued.clear();
    this.#pending.clear();
    this.#isScheduled = false;
    OptimizedObserver.#instance = null;
  }
}

export const observer = OptimizedObserver.getInstance();