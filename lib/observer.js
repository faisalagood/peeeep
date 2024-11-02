class OptimizedObserver {
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
    
    // Initialize observer if container exists
    const container = document.querySelector(`[${this.containerAttr}]`);
    if (container) {
      this.init(container);
    } else {
      this.setupInitialObserver();
    }
  }

  normalizeTargets(targets) {
    return targets.map((target) => {
      if (typeof target === "string") {
        return {
          type: "attribute",
          value: target,
          matches: (element) => element.hasAttribute(target)
        };
      }
      
      return {
        type: target.type || "attribute",
        value: target.value,
        matches: this.createMatcher(target)
      };
    });
  }

  createMatcher(target) {
    switch (target.type) {
      case "attribute":
        return (element) => element.hasAttribute(target.value);
      case "class":
        return (element) => element.classList.contains(target.value);
      case "selector":
        return (element) => element.matches(target.value);
      default:
        throw new Error(`Unknown target type: ${target.type}`);
    }
  }

  elementMatchesAnyTarget(element) {
    for (let i = 0; i < this.targets.length; i++) {
      if (this.targets[i].matches(element)) return true;
    }
    return false;
  }

  getAttributeFilters() {
    return this.targets
      .filter(target => target.type === "attribute")
      .map(target => target.value);
  }

  setupInitialObserver() {
    // Cleanup any existing initial observer
    if (this.initialObserver) {
      this.initialObserver.disconnect();
    }

    this.initialObserver = new MutationObserver((mutations, observer) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const container = document.querySelector(`[${this.containerAttr}]`);
          if (container) {
            observer.disconnect();
            this.initialObserver = null;
            this.init(container);
            break;
          }
        } else if (mutation.type === "attributes" && 
                   mutation.attributeName === this.containerAttr) {
          const container = document.querySelector(`[${this.containerAttr}]`);
          if (container) {
            observer.disconnect();
            this.initialObserver = null;
            this.init(container);
            break;
          }
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
    
    this.targets.forEach(target => {
      if (target.type === "selector") {
        container.querySelectorAll(target.value).forEach(element => {
          elements.add(element);
        });
      } else {
        container
          .querySelectorAll(`[${target.value}], .${target.value}`)
          .forEach(element => {
            if (this.elementMatchesAnyTarget(element)) {
              elements.add(element);
            }
          });
      }
    });

    if (elements.size) {
      elements.forEach(element => {
        try {
          this.process(element);
        } catch (e) {
          console.error("Error processing element:", e);
        }
      });
    }

    return elements.size > 0;
  }

  init(container) {
    if (this.observer) {
      this.disconnect();
    }

    this.container = container;
    
    // Process existing elements
    this.processExistingElements(container);

    // Set up the main observer
    this.observer = new MutationObserver(mutations => {
      const elements = new Set();

      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (this.elementMatchesAnyTarget(node)) {
                elements.add(node);
              }

              // Check children
              this.targets.forEach(target => {
                if (target.type === "selector") {
                  node.querySelectorAll(target.value)
                    .forEach(element => elements.add(element));
                } else {
                  node.querySelectorAll(`[${target.value}], .${target.value}`)
                    .forEach(element => {
                      if (this.elementMatchesAnyTarget(element)) {
                        elements.add(element);
                      }
                    });
                }
              });
            }
          });
        } else if (mutation.type === "attributes" || mutation.type === "class") {
          if (this.elementMatchesAnyTarget(mutation.target)) {
            elements.add(mutation.target);
          }
        }
      }

      if (elements.size) {
        elements.forEach(element => {
          try {
            this.process(element);
          } catch (e) {
            console.error("Error processing element:", e);
          }
        });
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

    // Clear references
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