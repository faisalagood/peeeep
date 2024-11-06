class OptimizedObserver {
  static IGNORED_TAGS = new Set(['BR', 'HEAD', 'LINK', 'META', 'SCRIPT', 'STYLE']);

  constructor(processCallback, options = {}) {
    if (typeof processCallback !== "function") {
      throw new Error("Process callback is required");
    }

    this.process = processCallback;
    this.containerAttr = options.containerAttribute || "data-observer-root";
    this.targets = this.normalizeTargets(options.targets || []);
    this.observer = null;
    this.initialObserver = null;
    this.container = null;
    
    const container = document.getElementById(this.containerAttr) || 
                     document.querySelector(`[${this.containerAttr}]`);
    if (container) {
      this.init(container);
    } else {
      this.setupInitialObserver();
    }
  }

  normalizeTargets(targets) {
    const normalizedTargets = new Array(targets.length);
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (typeof target === "string") {
        normalizedTargets[i] = {
          type: "attribute",
          value: target,
          matches: (element) => element.hasAttribute(target)
        };
      } else {
        normalizedTargets[i] = {
          type: target.type || "attribute",
          value: target.value,
          matches: this.createMatcher(target)
        };
      }
    }
    return normalizedTargets;
  }

  createMatcher(target) {
    switch (target.type) {
      case "attribute":
        return (element) => element.hasAttribute(target.value);
      case "class":
        return (element) => element.classList.contains(target.value);
      case "id":
        return (element) => element.id === target.value;
      case "selector":
        return (element) => element.matches(target.value);
      default:
        throw new Error(`Unknown target type: ${target.type}`);
    }
  }

  elementMatchesAnyTarget(element) {
    if (OptimizedObserver.IGNORED_TAGS.has(element.tagName)) {
      return false;
    }
    
    const len = this.targets.length;
    for (let i = 0; i < len; i++) {
      if (this.targets[i].matches(element)) return true;
    }
    return false;
  }

  getAttributeFilters() {
    const filters = [];
    const len = this.targets.length;
    for (let i = 0; i < len; i++) {
      if (this.targets[i].type === "attribute") {
        filters.push(this.targets[i].value);
      }
    }
    return filters;
  }

  setupInitialObserver() {
    if (this.initialObserver) {
      this.initialObserver.disconnect();
    }

    this.initialObserver = new MutationObserver((mutations, observer) => {
      const len = mutations.length;
      for (let i = 0; i < len; i++) {
        const mutation = mutations[i];
        const container = mutation.type === "childList" ? 
          document.getElementById(this.containerAttr) || document.querySelector(`[${this.containerAttr}]`) :
          (mutation.type === "attributes" && 
           mutation.attributeName === this.containerAttr ? 
           mutation.target : null);

        if (container) {
          observer.disconnect();
          this.initialObserver = null;
          this.init(container);
          break;
        }
      }
    });

    this.initialObserver.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [this.containerAttr]
    });
  }

  processExistingElements(container) {
    const elements = new Set();
    const targetsLen = this.targets.length;
    
    for (let i = 0; i < targetsLen; i++) {
      const target = this.targets[i];
      let foundElements;
      
      if (target.type === "selector") {
        foundElements = container.querySelectorAll(target.value);
      } else if (target.type === "id") {
        const element = document.getElementById(target.value);
        foundElements = element ? [element] : [];
      } else if (target.type === "class") {
        foundElements = container.getElementsByClassName(target.value);
      } else {
        foundElements = container.querySelectorAll(`[${target.value}]`);
      }

      const elementsLen = foundElements.length;
      for (let j = 0; j < elementsLen; j++) {
        const element = foundElements[j];
        if (!OptimizedObserver.IGNORED_TAGS.has(element.tagName) && 
            this.elementMatchesAnyTarget(element)) {
          elements.add(element);
        }
      }
    }

    if (elements.size) {
      for (const element of elements) {
        try {
          this.process(element);
        } catch (e) {
          console.error("Error processing element:", e);
        }
      }
    }

    return elements.size > 0;
  }

  processAddedNode(node, elements) {
    if (node.nodeType === Node.ELEMENT_NODE && 
        !OptimizedObserver.IGNORED_TAGS.has(node.tagName)) {
      
      if (this.elementMatchesAnyTarget(node)) {
        elements.add(node);
      }

      const targetsLen = this.targets.length;
      for (let i = 0; i < targetsLen; i++) {
        const target = this.targets[i];
        let foundElements;
        
        if (target.type === "id") {
          const element = document.getElementById(target.value);
          foundElements = element ? [element] : [];
        } else if (target.type === "class") {
          foundElements = node.getElementsByClassName(target.value);
        } else if (target.type === "selector") {
          foundElements = node.querySelectorAll(target.value);
        } else {
          foundElements = node.querySelectorAll(`[${target.value}]`);
        }

        const elementsLen = foundElements.length;
        for (let j = 0; j < elementsLen; j++) {
          const element = foundElements[j];
          if (!OptimizedObserver.IGNORED_TAGS.has(element.tagName) && 
              this.elementMatchesAnyTarget(element)) {
            elements.add(element);
          }
        }
      }
    }
  }

  init(container) {
    if (this.observer) {
      this.disconnect();
    }

    this.container = container;
    this.processExistingElements(container);

    this.observer = new MutationObserver(mutations => {
      const elements = new Set();
      const mutationsLen = mutations.length;

      for (let i = 0; i < mutationsLen; i++) {
        const mutation = mutations[i];
        if (mutation.type === "childList") {
          const nodesLen = mutation.addedNodes.length;
          for (let j = 0; j < nodesLen; j++) {
            this.processAddedNode(mutation.addedNodes[j], elements);
          }
        } else if (mutation.type === "attributes" || mutation.type === "class") {
          if (!OptimizedObserver.IGNORED_TAGS.has(mutation.target.tagName) && 
              this.elementMatchesAnyTarget(mutation.target)) {
            elements.add(mutation.target);
          }
        }
      }

      if (elements.size) {
        for (const element of elements) {
          try {
            this.process(element);
          } catch (e) {
            console.error("Error processing element:", e);
          }
        }
      }
    });

    this.observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: this.getAttributeFilters(),
      attributeOldValue: false,
      classes: true
    });
  }

  disconnect() {
    if (this.initialObserver) {
      this.initialObserver.disconnect();
      this.initialObserver = null;
    }
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.container = null;
    this.process = null;
    this.targets = [];
  }

  reconnect() {
    if (!this.container || !this.process) {
      throw new Error("Cannot reconnect - observer was fully disconnected");
    }
    this.init(this.container);
  }
}

export { OptimizedObserver };