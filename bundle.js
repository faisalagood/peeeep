/******/ var __webpack_modules__ = ({

/***/ "./node_modules/mutation-summary/dist/umd/mutation-summary.js":
/*!********************************************************************!*\
  !*** ./node_modules/mutation-summary/dist/umd/mutation-summary.js ***!
  \********************************************************************/
/***/ (function(__unused_webpack_module, exports) {

(function (global, factory) {
     true ? factory(exports) :
    0;
}(this, (function (exports) { 'use strict';

    /**
     * A helper class that maps from a DOM Node to an arbitrary value.
     */
    var NodeMap = /** @class */ (function () {
        /**
         * Constructs a new and empty NodeMap.
         */
        function NodeMap() {
            this._nodes = [];
            this._values = [];
        }
        NodeMap._isIndex = function (s) {
            return +s === s >>> 0;
        };
        NodeMap._nodeId = function (node) {
            var id = node[NodeMap._ID_PROP];
            if (!id)
                id = node[NodeMap._ID_PROP] = NodeMap._NEXT_ID++;
            return id;
        };
        /**
         * Sets the value of a node within the map.
         * @param node  The node to set the value for.
         * @param value the value to associate with the node.
         */
        NodeMap.prototype.set = function (node, value) {
            var id = NodeMap._nodeId(node);
            this._nodes[id] = node;
            this._values[id] = value;
        };
        /**
         * Gets the value for the given node.
         *
         * @param node The node to get the value of.
         * @returns The value for the given node, or undefined if the node is not
         * present in the map.
         */
        NodeMap.prototype.get = function (node) {
            var id = NodeMap._nodeId(node);
            return id !== undefined ? this._values[id] : undefined;
        };
        /**
         * Determines if a given node is in the NodeMap.
         *
         * @param node The node to determine if it is in the map.
         *
         * @returns true if the Node is contained in the map, false otherwise.
         */
        NodeMap.prototype.has = function (node) {
            return NodeMap._nodeId(node) in this._nodes;
        };
        /**
         * Deletes a node from the NodeMap.
         *
         * @param node The node to delete.
         */
        NodeMap.prototype.delete = function (node) {
            var id = NodeMap._nodeId(node);
            delete this._nodes[id];
            this._values[id] = undefined;
        };
        /**
         * @returns an array that holds the nodes that are the keys of the map.
         */
        NodeMap.prototype.keys = function () {
            var nodes = [];
            for (var id in this._nodes) {
                if (!NodeMap._isIndex(id))
                    continue;
                nodes.push(this._nodes[id]);
            }
            return nodes;
        };
        NodeMap._ID_PROP = '__mutation_summary_node_map_id__';
        NodeMap._NEXT_ID = 1;
        return NodeMap;
    }());

    var ChildListChange = /** @class */ (function () {
        function ChildListChange() {
            this.added = new NodeMap();
            this.removed = new NodeMap();
            this.maybeMoved = new NodeMap();
            this.oldPrevious = new NodeMap();
            this.moved = undefined;
        }
        return ChildListChange;
    }());

    exports.Movement = void 0;
    (function (Movement) {
        Movement[Movement["STAYED_OUT"] = 0] = "STAYED_OUT";
        Movement[Movement["ENTERED"] = 1] = "ENTERED";
        Movement[Movement["STAYED_IN"] = 2] = "STAYED_IN";
        Movement[Movement["REPARENTED"] = 3] = "REPARENTED";
        Movement[Movement["REORDERED"] = 4] = "REORDERED";
        Movement[Movement["EXITED"] = 5] = "EXITED";
    })(exports.Movement || (exports.Movement = {}));

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var NodeChange = /** @class */ (function () {
        function NodeChange(node, childList, attributes, characterData, oldParentNode, added, attributeOldValues, characterDataOldValue) {
            if (childList === void 0) { childList = false; }
            if (attributes === void 0) { attributes = false; }
            if (characterData === void 0) { characterData = false; }
            if (oldParentNode === void 0) { oldParentNode = null; }
            if (added === void 0) { added = false; }
            if (attributeOldValues === void 0) { attributeOldValues = null; }
            if (characterDataOldValue === void 0) { characterDataOldValue = null; }
            this.node = node;
            this.childList = childList;
            this.attributes = attributes;
            this.characterData = characterData;
            this.oldParentNode = oldParentNode;
            this.added = added;
            this.attributeOldValues = attributeOldValues;
            this.characterDataOldValue = characterDataOldValue;
            this.isCaseInsensitive =
                this.node.nodeType === Node.ELEMENT_NODE &&
                    this.node instanceof HTMLElement &&
                    this.node.ownerDocument instanceof HTMLDocument;
        }
        NodeChange.prototype.getAttributeOldValue = function (name) {
            if (!this.attributeOldValues)
                return undefined;
            if (this.isCaseInsensitive)
                name = name.toLowerCase();
            return this.attributeOldValues[name];
        };
        NodeChange.prototype.getAttributeNamesMutated = function () {
            var names = [];
            if (!this.attributeOldValues)
                return names;
            for (var name_1 in this.attributeOldValues) {
                if (this.attributeOldValues.hasOwnProperty(name_1)) {
                    names.push(name_1);
                }
            }
            return names;
        };
        NodeChange.prototype.attributeMutated = function (name, oldValue) {
            this.attributes = true;
            this.attributeOldValues = this.attributeOldValues || {};
            if (name in this.attributeOldValues)
                return;
            this.attributeOldValues[name] = oldValue;
        };
        NodeChange.prototype.characterDataMutated = function (oldValue) {
            if (this.characterData)
                return;
            this.characterData = true;
            this.characterDataOldValue = oldValue;
        };
        // Note: is it possible to receive a removal followed by a removal. This
        // can occur if the removed node is added to an non-observed node, that
        // node is added to the observed area, and then the node removed from
        // it.
        NodeChange.prototype.removedFromParent = function (parent) {
            this.childList = true;
            if (this.added || this.oldParentNode)
                this.added = false;
            else
                this.oldParentNode = parent;
        };
        NodeChange.prototype.insertedIntoParent = function () {
            this.childList = true;
            this.added = true;
        };
        // An node's oldParent is
        //   -its present parent, if its parentNode was not changed.
        //   -null if the first thing that happened to it was an add.
        //   -the node it was removed from if the first thing that happened to it
        //      was a remove.
        NodeChange.prototype.getOldParent = function () {
            if (this.childList) {
                if (this.oldParentNode)
                    return this.oldParentNode;
                if (this.added)
                    return null;
            }
            return this.node.parentNode;
        };
        return NodeChange;
    }());

    var TreeChanges = /** @class */ (function (_super) {
        __extends(TreeChanges, _super);
        function TreeChanges(rootNode, mutations) {
            var _this = _super.call(this) || this;
            _this.rootNode = rootNode;
            _this.reachableCache = undefined;
            _this.wasReachableCache = undefined;
            _this.anyParentsChanged = false;
            _this.anyAttributesChanged = false;
            _this.anyCharacterDataChanged = false;
            for (var m = 0; m < mutations.length; m++) {
                var mutation = mutations[m];
                switch (mutation.type) {
                    case 'childList':
                        _this.anyParentsChanged = true;
                        for (var i = 0; i < mutation.removedNodes.length; i++) {
                            var node = mutation.removedNodes[i];
                            _this.getChange(node).removedFromParent(mutation.target);
                        }
                        for (var i = 0; i < mutation.addedNodes.length; i++) {
                            var node = mutation.addedNodes[i];
                            _this.getChange(node).insertedIntoParent();
                        }
                        break;
                    case 'attributes': {
                        _this.anyAttributesChanged = true;
                        var change = _this.getChange(mutation.target);
                        change.attributeMutated(mutation.attributeName, mutation.oldValue);
                        break;
                    }
                    case 'characterData': {
                        _this.anyCharacterDataChanged = true;
                        var change = _this.getChange(mutation.target);
                        change.characterDataMutated(mutation.oldValue);
                        break;
                    }
                }
            }
            return _this;
        }
        TreeChanges.prototype.getChange = function (node) {
            var change = this.get(node);
            if (!change) {
                change = new NodeChange(node);
                this.set(node, change);
            }
            return change;
        };
        TreeChanges.prototype.getOldParent = function (node) {
            var change = this.get(node);
            return change ? change.getOldParent() : node.parentNode;
        };
        TreeChanges.prototype.getIsReachable = function (node) {
            if (node === this.rootNode)
                return true;
            if (!node)
                return false;
            this.reachableCache = this.reachableCache || new NodeMap();
            var isReachable = this.reachableCache.get(node);
            if (isReachable === undefined) {
                isReachable = this.getIsReachable(node.parentNode);
                this.reachableCache.set(node, isReachable);
            }
            return isReachable;
        };
        // A node wasReachable if its oldParent wasReachable.
        TreeChanges.prototype.getWasReachable = function (node) {
            if (node === this.rootNode)
                return true;
            if (!node)
                return false;
            this.wasReachableCache = this.wasReachableCache || new NodeMap();
            var wasReachable = this.wasReachableCache.get(node);
            if (wasReachable === undefined) {
                wasReachable = this.getWasReachable(this.getOldParent(node));
                this.wasReachableCache.set(node, wasReachable);
            }
            return wasReachable;
        };
        TreeChanges.prototype.reachabilityChange = function (node) {
            if (this.getIsReachable(node)) {
                return this.getWasReachable(node) ?
                    exports.Movement.STAYED_IN : exports.Movement.ENTERED;
            }
            return this.getWasReachable(node) ?
                exports.Movement.EXITED : exports.Movement.STAYED_OUT;
        };
        return TreeChanges;
    }(NodeMap));

    var MutationProjection = /** @class */ (function () {
        // TOOD(any)
        function MutationProjection(rootNode, mutations, selectors, calcReordered, calcOldPreviousSibling) {
            this.rootNode = rootNode;
            this.mutations = mutations;
            this.selectors = selectors;
            this.calcReordered = calcReordered;
            this.calcOldPreviousSibling = calcOldPreviousSibling;
            this.treeChanges = new TreeChanges(rootNode, mutations);
            this.entered = [];
            this.exited = [];
            this.stayedIn = new NodeMap();
            this.visited = new NodeMap();
            this.childListChangeMap = undefined;
            this.characterDataOnly = undefined;
            this.matchCache = undefined;
            this.processMutations();
        }
        MutationProjection.prototype.processMutations = function () {
            if (!this.treeChanges.anyParentsChanged &&
                !this.treeChanges.anyAttributesChanged)
                return;
            var changedNodes = this.treeChanges.keys();
            for (var i = 0; i < changedNodes.length; i++) {
                this.visitNode(changedNodes[i], undefined);
            }
        };
        MutationProjection.prototype.visitNode = function (node, parentReachable) {
            if (this.visited.has(node))
                return;
            this.visited.set(node, true);
            var change = this.treeChanges.get(node);
            var reachable = parentReachable;
            // node inherits its parent's reachability change unless
            // its parentNode was mutated.
            if ((change && change.childList) || reachable == undefined)
                reachable = this.treeChanges.reachabilityChange(node);
            if (reachable === exports.Movement.STAYED_OUT)
                return;
            // Cache match results for sub-patterns.
            this.matchabilityChange(node);
            if (reachable === exports.Movement.ENTERED) {
                this.entered.push(node);
            }
            else if (reachable === exports.Movement.EXITED) {
                this.exited.push(node);
                this.ensureHasOldPreviousSiblingIfNeeded(node);
            }
            else if (reachable === exports.Movement.STAYED_IN) {
                var movement = exports.Movement.STAYED_IN;
                if (change && change.childList) {
                    if (change.oldParentNode !== node.parentNode) {
                        movement = exports.Movement.REPARENTED;
                        this.ensureHasOldPreviousSiblingIfNeeded(node);
                    }
                    else if (this.calcReordered && this.wasReordered(node)) {
                        movement = exports.Movement.REORDERED;
                    }
                }
                this.stayedIn.set(node, movement);
            }
            if (reachable === exports.Movement.STAYED_IN)
                return;
            // reachable === ENTERED || reachable === EXITED.
            for (var child = node.firstChild; child; child = child.nextSibling) {
                this.visitNode(child, reachable);
            }
        };
        MutationProjection.prototype.ensureHasOldPreviousSiblingIfNeeded = function (node) {
            if (!this.calcOldPreviousSibling)
                return;
            this.processChildlistChanges();
            var parentNode = node.parentNode;
            var nodeChange = this.treeChanges.get(node);
            if (nodeChange && nodeChange.oldParentNode)
                parentNode = nodeChange.oldParentNode;
            var change = this.childListChangeMap.get(parentNode);
            if (!change) {
                change = new ChildListChange();
                this.childListChangeMap.set(parentNode, change);
            }
            if (!change.oldPrevious.has(node)) {
                change.oldPrevious.set(node, node.previousSibling);
            }
        };
        MutationProjection.prototype.getChanged = function (summary, selectors, characterDataOnly) {
            this.selectors = selectors;
            this.characterDataOnly = characterDataOnly;
            for (var i = 0; i < this.entered.length; i++) {
                var node = this.entered[i];
                var matchable = this.matchabilityChange(node);
                if (matchable === exports.Movement.ENTERED || matchable === exports.Movement.STAYED_IN)
                    summary.added.push(node);
            }
            var stayedInNodes = this.stayedIn.keys();
            for (var i = 0; i < stayedInNodes.length; i++) {
                var node = stayedInNodes[i];
                var matchable = this.matchabilityChange(node);
                if (matchable === exports.Movement.ENTERED) {
                    summary.added.push(node);
                }
                else if (matchable === exports.Movement.EXITED) {
                    summary.removed.push(node);
                }
                else if (matchable === exports.Movement.STAYED_IN && (summary.reparented || summary.reordered)) {
                    var movement = this.stayedIn.get(node);
                    if (summary.reparented && movement === exports.Movement.REPARENTED)
                        summary.reparented.push(node);
                    else if (summary.reordered && movement === exports.Movement.REORDERED)
                        summary.reordered.push(node);
                }
            }
            for (var i = 0; i < this.exited.length; i++) {
                var node = this.exited[i];
                var matchable = this.matchabilityChange(node);
                if (matchable === exports.Movement.EXITED || matchable === exports.Movement.STAYED_IN)
                    summary.removed.push(node);
            }
        };
        MutationProjection.prototype.getOldParentNode = function (node) {
            var change = this.treeChanges.get(node);
            if (change && change.childList)
                return change.oldParentNode ? change.oldParentNode : null;
            var reachabilityChange = this.treeChanges.reachabilityChange(node);
            if (reachabilityChange === exports.Movement.STAYED_OUT || reachabilityChange === exports.Movement.ENTERED)
                throw Error('getOldParentNode requested on invalid node.');
            return node.parentNode;
        };
        MutationProjection.prototype.getOldPreviousSibling = function (node) {
            var parentNode = node.parentNode;
            var nodeChange = this.treeChanges.get(node);
            if (nodeChange && nodeChange.oldParentNode)
                parentNode = nodeChange.oldParentNode;
            var change = this.childListChangeMap.get(parentNode);
            if (!change)
                throw Error('getOldPreviousSibling requested on invalid node.');
            return change.oldPrevious.get(node);
        };
        MutationProjection.prototype.getOldAttribute = function (element, attrName) {
            var change = this.treeChanges.get(element);
            if (!change || !change.attributes)
                throw Error('getOldAttribute requested on invalid node.');
            var value = change.getAttributeOldValue(attrName);
            if (value === undefined)
                throw Error('getOldAttribute requested for unchanged attribute name.');
            return value;
        };
        MutationProjection.prototype.attributeChangedNodes = function (includeAttributes) {
            if (!this.treeChanges.anyAttributesChanged)
                return {}; // No attributes mutations occurred.
            var attributeFilter;
            var caseInsensitiveFilter;
            if (includeAttributes) {
                attributeFilter = {};
                caseInsensitiveFilter = {};
                for (var i = 0; i < includeAttributes.length; i++) {
                    var attrName = includeAttributes[i];
                    attributeFilter[attrName] = true;
                    caseInsensitiveFilter[attrName.toLowerCase()] = attrName;
                }
            }
            var result = {};
            var nodes = this.treeChanges.keys();
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                var change = this.treeChanges.get(node);
                if (!change.attributes)
                    continue;
                if (exports.Movement.STAYED_IN !== this.treeChanges.reachabilityChange(node) ||
                    exports.Movement.STAYED_IN !== this.matchabilityChange(node)) {
                    continue;
                }
                var element = node;
                var changedAttrNames = change.getAttributeNamesMutated();
                for (var j = 0; j < changedAttrNames.length; j++) {
                    var attrName = changedAttrNames[j];
                    if (attributeFilter &&
                        !attributeFilter[attrName] &&
                        !(change.isCaseInsensitive && caseInsensitiveFilter[attrName])) {
                        continue;
                    }
                    var oldValue = change.getAttributeOldValue(attrName);
                    if (oldValue === element.getAttribute(attrName))
                        continue;
                    if (caseInsensitiveFilter && change.isCaseInsensitive)
                        attrName = caseInsensitiveFilter[attrName];
                    result[attrName] = result[attrName] || [];
                    result[attrName].push(element);
                }
            }
            return result;
        };
        MutationProjection.prototype.getOldCharacterData = function (node) {
            var change = this.treeChanges.get(node);
            if (!change || !change.characterData)
                throw Error('getOldCharacterData requested on invalid node.');
            return change.characterDataOldValue;
        };
        MutationProjection.prototype.getCharacterDataChanged = function () {
            if (!this.treeChanges.anyCharacterDataChanged)
                return []; // No characterData mutations occurred.
            var nodes = this.treeChanges.keys();
            var result = [];
            for (var i = 0; i < nodes.length; i++) {
                var target = nodes[i];
                if (exports.Movement.STAYED_IN !== this.treeChanges.reachabilityChange(target))
                    continue;
                var change = this.treeChanges.get(target);
                if (!change.characterData ||
                    target.textContent == change.characterDataOldValue)
                    continue;
                result.push(target);
            }
            return result;
        };
        MutationProjection.prototype.computeMatchabilityChange = function (selector, el) {
            if (!this.matchCache)
                this.matchCache = [];
            if (!this.matchCache[selector.uid])
                this.matchCache[selector.uid] = new NodeMap();
            var cache = this.matchCache[selector.uid];
            var result = cache.get(el);
            if (result === undefined) {
                result = selector.matchabilityChange(el, this.treeChanges.get(el));
                cache.set(el, result);
            }
            return result;
        };
        MutationProjection.prototype.matchabilityChange = function (node) {
            var _this = this;
            // TODO(rafaelw): Include PI, CDATA?
            // Only include text nodes.
            if (this.characterDataOnly) {
                switch (node.nodeType) {
                    case Node.COMMENT_NODE:
                    case Node.TEXT_NODE:
                        return exports.Movement.STAYED_IN;
                    default:
                        return exports.Movement.STAYED_OUT;
                }
            }
            // No element filter. Include all nodes.
            if (!this.selectors)
                return exports.Movement.STAYED_IN;
            // Element filter. Exclude non-elements.
            if (node.nodeType !== Node.ELEMENT_NODE)
                return exports.Movement.STAYED_OUT;
            var el = node;
            var matchChanges = this.selectors.map(function (selector) {
                return _this.computeMatchabilityChange(selector, el);
            });
            var accum = exports.Movement.STAYED_OUT;
            var i = 0;
            while (accum !== exports.Movement.STAYED_IN && i < matchChanges.length) {
                switch (matchChanges[i]) {
                    case exports.Movement.STAYED_IN:
                        accum = exports.Movement.STAYED_IN;
                        break;
                    case exports.Movement.ENTERED:
                        if (accum === exports.Movement.EXITED)
                            accum = exports.Movement.STAYED_IN;
                        else
                            accum = exports.Movement.ENTERED;
                        break;
                    case exports.Movement.EXITED:
                        if (accum === exports.Movement.ENTERED)
                            accum = exports.Movement.STAYED_IN;
                        else
                            accum = exports.Movement.EXITED;
                        break;
                }
                i++;
            }
            return accum;
        };
        MutationProjection.prototype.getChildlistChange = function (el) {
            var change = this.childListChangeMap.get(el);
            if (!change) {
                change = new ChildListChange();
                this.childListChangeMap.set(el, change);
            }
            return change;
        };
        MutationProjection.prototype.processChildlistChanges = function () {
            if (this.childListChangeMap)
                return;
            this.childListChangeMap = new NodeMap();
            var _loop_1 = function (i) {
                var mutation = this_1.mutations[i];
                if (mutation.type != 'childList')
                    return "continue";
                if (this_1.treeChanges.reachabilityChange(mutation.target) !== exports.Movement.STAYED_IN &&
                    !this_1.calcOldPreviousSibling)
                    return "continue";
                var change = this_1.getChildlistChange(mutation.target);
                var oldPrevious = mutation.previousSibling;
                var recordOldPrevious = function (node, previous) {
                    if (!node ||
                        change.oldPrevious.has(node) ||
                        change.added.has(node) ||
                        change.maybeMoved.has(node))
                        return;
                    if (previous &&
                        (change.added.has(previous) ||
                            change.maybeMoved.has(previous)))
                        return;
                    change.oldPrevious.set(node, previous);
                };
                for (var j = 0; j < mutation.removedNodes.length; j++) {
                    var node = mutation.removedNodes[j];
                    recordOldPrevious(node, oldPrevious);
                    if (change.added.has(node)) {
                        change.added.delete(node);
                    }
                    else {
                        change.removed.set(node, true);
                        change.maybeMoved.delete(node);
                    }
                    oldPrevious = node;
                }
                recordOldPrevious(mutation.nextSibling, oldPrevious);
                for (var j = 0; j < mutation.addedNodes.length; j++) {
                    var node = mutation.addedNodes[j];
                    if (change.removed.has(node)) {
                        change.removed.delete(node);
                        change.maybeMoved.set(node, true);
                    }
                    else {
                        change.added.set(node, true);
                    }
                }
            };
            var this_1 = this;
            for (var i = 0; i < this.mutations.length; i++) {
                _loop_1(i);
            }
        };
        MutationProjection.prototype.wasReordered = function (node) {
            if (!this.treeChanges.anyParentsChanged)
                return false;
            this.processChildlistChanges();
            var parentNode = node.parentNode;
            var nodeChange = this.treeChanges.get(node);
            if (nodeChange && nodeChange.oldParentNode)
                parentNode = nodeChange.oldParentNode;
            var change = this.childListChangeMap.get(parentNode);
            if (!change)
                return false;
            if (change.moved)
                return change.moved.get(node);
            change.moved = new NodeMap();
            var pendingMoveDecision = new NodeMap();
            function isMoved(node) {
                if (!node)
                    return false;
                if (!change.maybeMoved.has(node))
                    return false;
                var didMove = change.moved.get(node);
                if (didMove !== undefined)
                    return didMove;
                if (pendingMoveDecision.has(node)) {
                    didMove = true;
                }
                else {
                    pendingMoveDecision.set(node, true);
                    didMove = getPrevious(node) !== getOldPrevious(node);
                }
                if (pendingMoveDecision.has(node)) {
                    pendingMoveDecision.delete(node);
                    change.moved.set(node, didMove);
                }
                else {
                    didMove = change.moved.get(node);
                }
                return didMove;
            }
            var oldPreviousCache = new NodeMap();
            function getOldPrevious(node) {
                var oldPrevious = oldPreviousCache.get(node);
                if (oldPrevious !== undefined)
                    return oldPrevious;
                oldPrevious = change.oldPrevious.get(node);
                while (oldPrevious &&
                    (change.removed.has(oldPrevious) || isMoved(oldPrevious))) {
                    oldPrevious = getOldPrevious(oldPrevious);
                }
                if (oldPrevious === undefined)
                    oldPrevious = node.previousSibling;
                oldPreviousCache.set(node, oldPrevious);
                return oldPrevious;
            }
            var previousCache = new NodeMap();
            function getPrevious(node) {
                if (previousCache.has(node))
                    return previousCache.get(node);
                var previous = node.previousSibling;
                while (previous && (change.added.has(previous) || isMoved(previous)))
                    previous = previous.previousSibling;
                previousCache.set(node, previous);
                return previous;
            }
            change.maybeMoved.keys().forEach(isMoved);
            return change.moved.get(node);
        };
        return MutationProjection;
    }());

    /**
     * Represents a set of changes made to the DOM.
     */
    var Summary = /** @class */ (function () {
        /**
         * Creates a new Summary instance given a [[MutationProjection]] and the
         * [[IQuery]] that was responsible for this summary being generated.
         *
         * @param projection The projection containing the changes.
         * @param query The query that cause the summary to be created.
         */
        function Summary(projection, query) {
            var _this = this;
            this.projection = projection;
            this.added = [];
            this.removed = [];
            this.reparented = query.all || query.element || query.characterData ? [] : undefined;
            this.reordered = query.all ? [] : undefined;
            projection.getChanged(this, query.elementFilter, query.characterData);
            if (query.all || query.attribute || query.attributeList) {
                var filter = query.attribute ? [query.attribute] : query.attributeList;
                var attributeChanged = projection.attributeChangedNodes(filter);
                if (query.attribute) {
                    this.valueChanged = attributeChanged[query.attribute] || [];
                }
                else {
                    this.attributeChanged = attributeChanged;
                    if (query.attributeList) {
                        query.attributeList.forEach(function (attrName) {
                            if (!_this.attributeChanged.hasOwnProperty(attrName))
                                _this.attributeChanged[attrName] = [];
                        });
                    }
                }
            }
            if (query.all || query.characterData) {
                var characterDataChanged = projection.getCharacterDataChanged();
                if (query.characterData)
                    this.valueChanged = characterDataChanged;
                else
                    this.characterDataChanged = characterDataChanged;
            }
            // TODO this seems unnecessary.
            if (this.reordered)
                this.getOldPreviousSibling = projection.getOldPreviousSibling.bind(projection);
        }
        /**
         * Will retrieve the previous parentNode for and node. The node must be
         * contained in the removed element array, otherwise the function throws an
         * error.
         *
         * @param node The node to get the previous parent for.
         */
        Summary.prototype.getOldParentNode = function (node) {
            return this.projection.getOldParentNode(node);
        };
        /**
         * Retrieves the previous value of an attribute for an element. The Element
         * must be contained in the valueChanged element array, otherwise the
         * function throws an error.
         *
         * @param element The element to ge the old value for.
         * @param name The name off the attribute on the element to get the old value
         * for.
         */
        Summary.prototype.getOldAttribute = function (element, name) {
            return this.projection.getOldAttribute(element, name);
        };
        /**
         * Retrieves the previous text of `node`. `node` must be  contained in the
         * `valueChanged` node array, otherwise the function throws an error.
         *
         * @param node The node to get the old character data for.
         */
        Summary.prototype.getOldCharacterData = function (node) {
            return this.projection.getOldCharacterData(node);
        };
        /**
         * Retrieves the previous previousSibling for a node. The node must be
         * contained in the reordered element array, otherwise the function throws
         * an error.
         *
         * @param node The node to get the previous sibling for.
         */
        Summary.prototype.getOldPreviousSibling = function (node) {
            return this.projection.getOldPreviousSibling(node);
        };
        return Summary;
    }());

    var Qualifier = /** @class */ (function () {
        function Qualifier() {
        }
        Qualifier.prototype.matches = function (oldValue) {
            if (oldValue === null)
                return false;
            if (this.attrValue === undefined)
                return true;
            if (!this.contains)
                return this.attrValue == oldValue;
            var tokens = oldValue.split(' ');
            for (var i = 0; i < tokens.length; i++) {
                if (this.attrValue === tokens[i])
                    return true;
            }
            return false;
        };
        Qualifier.prototype.toString = function () {
            if (this.attrName === 'class' && this.contains)
                return '.' + this.attrValue;
            if (this.attrName === 'id' && !this.contains)
                return '#' + this.attrValue;
            if (this.contains)
                return '[' + this.attrName + '~=' + escapeQuotes(this.attrValue) + ']';
            if ('attrValue' in this)
                return '[' + this.attrName + '=' + escapeQuotes(this.attrValue) + ']';
            //@ts-ignore
            return '[' + this.attrName + ']';
        };
        return Qualifier;
    }());
    function escapeQuotes(value) {
        return '"' + value.replace(/"/, '\\\"') + '"';
    }

    // TODO(rafaelw): Allow ':' and '.' as valid name characters.
    var validNameInitialChar = /[a-zA-Z_]+/;
    var validNameNonInitialChar = /[a-zA-Z0-9_\-]+/;
    var Selector = /** @class */ (function () {
        function Selector() {
            this.uid = Selector.nextUid++;
            this.qualifiers = [];
        }
        Object.defineProperty(Selector.prototype, "caseInsensitiveTagName", {
            get: function () {
                return this.tagName.toUpperCase();
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(Selector.prototype, "selectorString", {
            get: function () {
                return this.tagName + this.qualifiers.join('');
            },
            enumerable: false,
            configurable: true
        });
        Selector.prototype.isMatching = function (el) {
            return el[Selector.matchesSelector](this.selectorString);
        };
        Selector.prototype.wasMatching = function (el, change, isMatching) {
            if (!change || !change.attributes)
                return isMatching;
            var tagName = change.isCaseInsensitive ? this.caseInsensitiveTagName : this.tagName;
            if (tagName !== '*' && tagName !== el.tagName)
                return false;
            var attributeOldValues = [];
            var anyChanged = false;
            for (var i = 0; i < this.qualifiers.length; i++) {
                var qualifier = this.qualifiers[i];
                var oldValue = change.getAttributeOldValue(qualifier.attrName);
                attributeOldValues.push(oldValue);
                anyChanged = anyChanged || (oldValue !== undefined);
            }
            if (!anyChanged)
                return isMatching;
            for (var i = 0; i < this.qualifiers.length; i++) {
                var qualifier = this.qualifiers[i];
                var oldValue = attributeOldValues[i];
                if (oldValue === undefined)
                    oldValue = el.getAttribute(qualifier.attrName);
                if (!qualifier.matches(oldValue))
                    return false;
            }
            return true;
        };
        Selector.prototype.matchabilityChange = function (el, change) {
            var isMatching = this.isMatching(el);
            if (isMatching)
                return this.wasMatching(el, change, isMatching) ? exports.Movement.STAYED_IN : exports.Movement.ENTERED;
            else
                return this.wasMatching(el, change, isMatching) ? exports.Movement.EXITED : exports.Movement.STAYED_OUT;
        };
        Selector.parseSelectors = function (input) {
            var selectors = [];
            var currentSelector;
            var currentQualifier;
            function newSelector() {
                if (currentSelector) {
                    if (currentQualifier) {
                        currentSelector.qualifiers.push(currentQualifier);
                        currentQualifier = undefined;
                    }
                    selectors.push(currentSelector);
                }
                currentSelector = new Selector();
            }
            function newQualifier() {
                if (currentQualifier)
                    currentSelector.qualifiers.push(currentQualifier);
                currentQualifier = new Qualifier();
            }
            var WHITESPACE = /\s/;
            var valueQuoteChar = undefined;
            var SYNTAX_ERROR = 'Invalid or unsupported selector syntax.';
            var SELECTOR = 1;
            var TAG_NAME = 2;
            var QUALIFIER = 3;
            var QUALIFIER_NAME_FIRST_CHAR = 4;
            var QUALIFIER_NAME = 5;
            var ATTR_NAME_FIRST_CHAR = 6;
            var ATTR_NAME = 7;
            var EQUIV_OR_ATTR_QUAL_END = 8;
            var EQUAL = 9;
            var ATTR_QUAL_END = 10;
            var VALUE_FIRST_CHAR = 11;
            var VALUE = 12;
            var QUOTED_VALUE = 13;
            var SELECTOR_SEPARATOR = 14;
            var state = SELECTOR;
            var i = 0;
            while (i < input.length) {
                var c = input[i++];
                switch (state) {
                    case SELECTOR:
                        if (c.match(validNameInitialChar)) {
                            newSelector();
                            currentSelector.tagName = c;
                            state = TAG_NAME;
                            break;
                        }
                        if (c == '*') {
                            newSelector();
                            currentSelector.tagName = '*';
                            state = QUALIFIER;
                            break;
                        }
                        if (c == '.') {
                            newSelector();
                            newQualifier();
                            currentSelector.tagName = '*';
                            currentQualifier.attrName = 'class';
                            currentQualifier.contains = true;
                            state = QUALIFIER_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c == '#') {
                            newSelector();
                            newQualifier();
                            currentSelector.tagName = '*';
                            currentQualifier.attrName = 'id';
                            state = QUALIFIER_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c == '[') {
                            newSelector();
                            newQualifier();
                            currentSelector.tagName = '*';
                            currentQualifier.attrName = '';
                            state = ATTR_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c.match(WHITESPACE))
                            break;
                        throw Error(SYNTAX_ERROR);
                    case TAG_NAME:
                        if (c.match(validNameNonInitialChar)) {
                            currentSelector.tagName += c;
                            break;
                        }
                        if (c == '.') {
                            newQualifier();
                            currentQualifier.attrName = 'class';
                            currentQualifier.contains = true;
                            state = QUALIFIER_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c == '#') {
                            newQualifier();
                            currentQualifier.attrName = 'id';
                            state = QUALIFIER_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c == '[') {
                            newQualifier();
                            currentQualifier.attrName = '';
                            state = ATTR_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c.match(WHITESPACE)) {
                            state = SELECTOR_SEPARATOR;
                            break;
                        }
                        if (c == ',') {
                            state = SELECTOR;
                            break;
                        }
                        throw Error(SYNTAX_ERROR);
                    case QUALIFIER:
                        if (c == '.') {
                            newQualifier();
                            currentQualifier.attrName = 'class';
                            currentQualifier.contains = true;
                            state = QUALIFIER_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c == '#') {
                            newQualifier();
                            currentQualifier.attrName = 'id';
                            state = QUALIFIER_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c == '[') {
                            newQualifier();
                            currentQualifier.attrName = '';
                            state = ATTR_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c.match(WHITESPACE)) {
                            state = SELECTOR_SEPARATOR;
                            break;
                        }
                        if (c == ',') {
                            state = SELECTOR;
                            break;
                        }
                        throw Error(SYNTAX_ERROR);
                    case QUALIFIER_NAME_FIRST_CHAR:
                        if (c.match(validNameInitialChar)) {
                            currentQualifier.attrValue = c;
                            state = QUALIFIER_NAME;
                            break;
                        }
                        throw Error(SYNTAX_ERROR);
                    case QUALIFIER_NAME:
                        if (c.match(validNameNonInitialChar)) {
                            currentQualifier.attrValue += c;
                            break;
                        }
                        if (c == '.') {
                            newQualifier();
                            currentQualifier.attrName = 'class';
                            currentQualifier.contains = true;
                            state = QUALIFIER_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c == '#') {
                            newQualifier();
                            currentQualifier.attrName = 'id';
                            state = QUALIFIER_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c == '[') {
                            newQualifier();
                            state = ATTR_NAME_FIRST_CHAR;
                            break;
                        }
                        if (c.match(WHITESPACE)) {
                            state = SELECTOR_SEPARATOR;
                            break;
                        }
                        if (c == ',') {
                            state = SELECTOR;
                            break;
                        }
                        throw Error(SYNTAX_ERROR);
                    case ATTR_NAME_FIRST_CHAR:
                        if (c.match(validNameInitialChar)) {
                            currentQualifier.attrName = c;
                            state = ATTR_NAME;
                            break;
                        }
                        if (c.match(WHITESPACE))
                            break;
                        throw Error(SYNTAX_ERROR);
                    case ATTR_NAME:
                        if (c.match(validNameNonInitialChar)) {
                            currentQualifier.attrName += c;
                            break;
                        }
                        if (c.match(WHITESPACE)) {
                            state = EQUIV_OR_ATTR_QUAL_END;
                            break;
                        }
                        if (c == '~') {
                            currentQualifier.contains = true;
                            state = EQUAL;
                            break;
                        }
                        if (c == '=') {
                            currentQualifier.attrValue = '';
                            state = VALUE_FIRST_CHAR;
                            break;
                        }
                        if (c == ']') {
                            state = QUALIFIER;
                            break;
                        }
                        throw Error(SYNTAX_ERROR);
                    case EQUIV_OR_ATTR_QUAL_END:
                        if (c == '~') {
                            currentQualifier.contains = true;
                            state = EQUAL;
                            break;
                        }
                        if (c == '=') {
                            currentQualifier.attrValue = '';
                            state = VALUE_FIRST_CHAR;
                            break;
                        }
                        if (c == ']') {
                            state = QUALIFIER;
                            break;
                        }
                        if (c.match(WHITESPACE))
                            break;
                        throw Error(SYNTAX_ERROR);
                    case EQUAL:
                        if (c == '=') {
                            currentQualifier.attrValue = '';
                            state = VALUE_FIRST_CHAR;
                            break;
                        }
                        throw Error(SYNTAX_ERROR);
                    case ATTR_QUAL_END:
                        if (c == ']') {
                            state = QUALIFIER;
                            break;
                        }
                        if (c.match(WHITESPACE))
                            break;
                        throw Error(SYNTAX_ERROR);
                    case VALUE_FIRST_CHAR:
                        if (c.match(WHITESPACE))
                            break;
                        if (c == '"' || c == "'") {
                            valueQuoteChar = c;
                            state = QUOTED_VALUE;
                            break;
                        }
                        currentQualifier.attrValue += c;
                        state = VALUE;
                        break;
                    case VALUE:
                        if (c.match(WHITESPACE)) {
                            state = ATTR_QUAL_END;
                            break;
                        }
                        if (c == ']') {
                            state = QUALIFIER;
                            break;
                        }
                        if (c == "'" || c == '"')
                            throw Error(SYNTAX_ERROR);
                        currentQualifier.attrValue += c;
                        break;
                    case QUOTED_VALUE:
                        if (c == valueQuoteChar) {
                            state = ATTR_QUAL_END;
                            break;
                        }
                        currentQualifier.attrValue += c;
                        break;
                    case SELECTOR_SEPARATOR:
                        if (c.match(WHITESPACE))
                            break;
                        if (c == ',') {
                            state = SELECTOR;
                            break;
                        }
                        throw Error(SYNTAX_ERROR);
                }
            }
            switch (state) {
                case SELECTOR:
                case TAG_NAME:
                case QUALIFIER:
                case QUALIFIER_NAME:
                case SELECTOR_SEPARATOR:
                    // Valid end states.
                    newSelector();
                    break;
                default:
                    throw Error(SYNTAX_ERROR);
            }
            if (!selectors.length)
                throw Error(SYNTAX_ERROR);
            return selectors;
        };
        Selector.nextUid = 1;
        Selector.matchesSelector = "matches";
        return Selector;
    }());

    var MutationSummaryOptionProcessor = /** @class */ (function () {
        function MutationSummaryOptionProcessor() {
        }
        MutationSummaryOptionProcessor.createObserverOptions = function (queries) {
            var observerOptions = {
                childList: true,
                subtree: true
            };
            var attributeFilter;
            function observeAttributes(attributes) {
                if (observerOptions.attributes && !attributeFilter)
                    return; // already observing all.
                observerOptions.attributes = true;
                observerOptions.attributeOldValue = true;
                if (!attributes) {
                    // observe all.
                    attributeFilter = undefined;
                    return;
                }
                // add to observed.
                attributeFilter = attributeFilter || {};
                attributes.forEach(function (attribute) {
                    attributeFilter[attribute] = true;
                    attributeFilter[attribute.toLowerCase()] = true;
                });
            }
            queries.forEach(function (query) {
                if (query.characterData) {
                    observerOptions.characterData = true;
                    observerOptions.characterDataOldValue = true;
                    return;
                }
                if (query.all) {
                    observeAttributes();
                    observerOptions.characterData = true;
                    observerOptions.characterDataOldValue = true;
                    return;
                }
                if (query.attribute) {
                    observeAttributes([query.attribute.trim()]);
                    return;
                }
                var attributes = MutationSummaryOptionProcessor._elementFilterAttributes(query.elementFilter).concat(query.attributeList || []);
                if (attributes.length)
                    observeAttributes(attributes);
            });
            if (attributeFilter)
                observerOptions.attributeFilter = Object.keys(attributeFilter);
            return observerOptions;
        };
        MutationSummaryOptionProcessor.validateOptions = function (options) {
            for (var prop in options) {
                if (!(prop in MutationSummaryOptionProcessor._optionKeys))
                    throw Error('Invalid option: ' + prop);
            }
            if (typeof options.callback !== 'function')
                throw Error('Invalid options: callback is required and must be a function');
            if (!options.queries || !options.queries.length)
                throw Error('Invalid options: queries must contain at least one query request object.');
            var opts = {
                callback: options.callback,
                rootNode: options.rootNode || document,
                observeOwnChanges: !!options.observeOwnChanges,
                oldPreviousSibling: !!options.oldPreviousSibling,
                queries: []
            };
            for (var i = 0; i < options.queries.length; i++) {
                var request = options.queries[i];
                // all
                if (request.all) {
                    if (Object.keys(request).length > 1)
                        throw Error('Invalid request option. all has no options.');
                    opts.queries.push({ all: true });
                    continue;
                }
                // attribute
                if ('attribute' in request) {
                    var query = {
                        attribute: MutationSummaryOptionProcessor._validateAttribute(request.attribute)
                    };
                    query.elementFilter = Selector.parseSelectors('*[' + query.attribute + ']');
                    if (Object.keys(request).length > 1)
                        throw Error('Invalid request option. attribute has no options.');
                    opts.queries.push(query);
                    continue;
                }
                // element
                if ('element' in request) {
                    var requestOptionCount = Object.keys(request).length;
                    var query = {
                        element: request.element,
                        elementFilter: Selector.parseSelectors(request.element)
                    };
                    if (request.hasOwnProperty('elementAttributes')) {
                        query.attributeList = MutationSummaryOptionProcessor._validateElementAttributes(request.elementAttributes);
                        requestOptionCount--;
                    }
                    if (requestOptionCount > 1)
                        throw Error('Invalid request option. element only allows elementAttributes option.');
                    opts.queries.push(query);
                    continue;
                }
                // characterData
                if (request.characterData) {
                    if (Object.keys(request).length > 1)
                        throw Error('Invalid request option. characterData has no options.');
                    opts.queries.push({ characterData: true });
                    continue;
                }
                throw Error('Invalid request option. Unknown query request.');
            }
            return opts;
        };
        MutationSummaryOptionProcessor._validateElementAttributes = function (attribs) {
            if (!attribs.trim().length)
                throw Error('Invalid request option: elementAttributes must contain at least one attribute.');
            var lowerAttributes = {};
            var attributes = {};
            var tokens = attribs.split(/\s+/);
            for (var i = 0; i < tokens.length; i++) {
                var name_1 = tokens[i];
                if (!name_1)
                    continue;
                name_1 = MutationSummaryOptionProcessor._validateAttribute(name_1);
                var nameLower = name_1.toLowerCase();
                if (lowerAttributes[nameLower])
                    throw Error('Invalid request option: observing multiple case variations of the same attribute is not supported.');
                attributes[name_1] = true;
                lowerAttributes[nameLower] = true;
            }
            return Object.keys(attributes);
        };
        MutationSummaryOptionProcessor._elementFilterAttributes = function (selectors) {
            var attributes = {};
            selectors.forEach(function (selector) {
                selector.qualifiers.forEach(function (qualifier) {
                    attributes[qualifier.attrName] = true;
                });
            });
            return Object.keys(attributes);
        };
        MutationSummaryOptionProcessor._validateAttribute = function (attribute) {
            if (typeof attribute != 'string')
                throw Error('Invalid request option. attribute must be a non-zero length string.');
            attribute = attribute.trim();
            if (!attribute)
                throw Error('Invalid request option. attribute must be a non-zero length string.');
            if (!attribute.match(MutationSummaryOptionProcessor._attributeFilterPattern))
                throw Error('Invalid request option. invalid attribute name: ' + attribute);
            return attribute;
        };
        MutationSummaryOptionProcessor._attributeFilterPattern = /^([a-zA-Z:_]+[a-zA-Z0-9_\-:.]*)$/;
        MutationSummaryOptionProcessor._optionKeys = {
            'callback': true,
            'queries': true,
            'rootNode': true,
            'oldPreviousSibling': true,
            'observeOwnChanges': true
        };
        return MutationSummaryOptionProcessor;
    }());

    /**
     * This is the main entry point class for the Mutation Summary library. When
     * created, a MutationSummary takes care of the details of observing the DOM
     * for changes, computing the "net-effect" of what's changed and then delivers
     * these changes to the provided callback.
     *
     * @example
     * ```
     *
     * const ms = new MutationSummary({
     * callback(summaries: Summary[]) {
     *    summaries.forEach((summary: Summary) => console.log(summary));
     *  },
     *  queries: [
     *    { all: true }
     *  ]
     * });
     * ```
     */
    var MutationSummary = /** @class */ (function () {
        /**
         * Creates a new MutationSummary class using the specified options.
         *
         * @param opts The options that configure how the MutationSummary
         *             instance will observe and report changes.
         */
        function MutationSummary(opts) {
            var _this = this;
            this._connected = false;
            this._options = MutationSummaryOptionProcessor.validateOptions(opts);
            this._observerOptions = MutationSummaryOptionProcessor.createObserverOptions(this._options.queries);
            this._root = this._options.rootNode;
            this._callback = this._options.callback;
            this._elementFilter = Array.prototype.concat.apply([], this._options.queries.map(function (query) {
                return query.elementFilter ? query.elementFilter : [];
            }));
            if (!this._elementFilter.length)
                this._elementFilter = undefined;
            this._calcReordered = this._options.queries.some(function (query) {
                return query.all;
            });
            this._queryValidators = []; // TODO(rafaelw): Shouldn't always define this.
            if (MutationSummary.createQueryValidator) {
                this._queryValidators = this._options.queries.map(function (query) {
                    return MutationSummary.createQueryValidator(_this._root, query);
                });
            }
            this._observer = new MutationObserver(function (mutations) {
                _this._observerCallback(mutations);
            });
            this.reconnect();
        }
        /**
         * Starts observation using an existing `MutationSummary` which has been
         * disconnected. Note that this function is just a convenience method for
         * creating a new `MutationSummary` with the same options. The next time
         * changes are reported, they will relative to the state of the observed
         * DOM at the point that `reconnect` was called.
         */
        MutationSummary.prototype.reconnect = function () {
            if (this._connected)
                throw Error('Already connected');
            this._observer.observe(this._root, this._observerOptions);
            this._connected = true;
            this._checkpointQueryValidators();
        };
        /**
         * Immediately calculates changes and returns them as an array of summaries.
         * If there are no changes to report, returns undefined.
         */
        MutationSummary.prototype.takeSummaries = function () {
            if (!this._connected)
                throw Error('Not connected');
            var summaries = this._createSummaries(this._observer.takeRecords());
            return this._changesToReport(summaries) ? summaries : undefined;
        };
        /**
         * Discontinues observation immediately. If DOM changes are pending delivery,
         * they will be fetched and reported as the same array of summaries which
         * are handed into the callback. If there is nothing to report,
         * this function returns undefined.
         *
         * @returns A list of changes that have not yet been delivered to a callback.
         */
        MutationSummary.prototype.disconnect = function () {
            var summaries = this.takeSummaries();
            this._observer.disconnect();
            this._connected = false;
            return summaries;
        };
        MutationSummary.prototype._observerCallback = function (mutations) {
            if (!this._options.observeOwnChanges)
                this._observer.disconnect();
            var summaries = this._createSummaries(mutations);
            this._runQueryValidators(summaries);
            if (this._options.observeOwnChanges)
                this._checkpointQueryValidators();
            if (this._changesToReport(summaries))
                this._callback(summaries);
            // disconnect() may have been called during the callback.
            if (!this._options.observeOwnChanges && this._connected) {
                this._checkpointQueryValidators();
                this._observer.observe(this._root, this._observerOptions);
            }
        };
        MutationSummary.prototype._createSummaries = function (mutations) {
            if (!mutations || !mutations.length)
                return [];
            var projection = new MutationProjection(this._root, mutations, this._elementFilter, this._calcReordered, this._options.oldPreviousSibling);
            var summaries = [];
            for (var i = 0; i < this._options.queries.length; i++) {
                summaries.push(new Summary(projection, this._options.queries[i]));
            }
            return summaries;
        };
        MutationSummary.prototype._checkpointQueryValidators = function () {
            this._queryValidators.forEach(function (validator) {
                if (validator)
                    validator.recordPreviousState();
            });
        };
        MutationSummary.prototype._runQueryValidators = function (summaries) {
            this._queryValidators.forEach(function (validator, index) {
                if (validator)
                    validator.validate(summaries[index]);
            });
        };
        MutationSummary.prototype._changesToReport = function (summaries) {
            return summaries.some(function (summary) {
                var summaryProps = ['added', 'removed', 'reordered', 'reparented',
                    'valueChanged', 'characterDataChanged'];
                if (summaryProps.some(function (prop) {
                    return summary[prop] && summary[prop].length;
                }))
                    return true;
                if (summary.attributeChanged) {
                    var attrNames = Object.keys(summary.attributeChanged);
                    var attrsChanged = attrNames.some(function (attrName) {
                        return !!summary.attributeChanged[attrName].length;
                    });
                    if (attrsChanged)
                        return true;
                }
                return false;
            });
        };
        return MutationSummary;
    }());

    // Copyright 2013 Google Inc.
    //
    // Licensed under the Apache License, Version 2.0 (the "License");
    // you may not use this file except in compliance with the License.
    // You may obtain a copy of the License at
    //
    //     http://www.apache.org/licenses/LICENSE-2.0
    //
    // Unless required by applicable law or agreed to in writing, software
    // distributed under the License is distributed on an "AS IS" BASIS,
    // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    // See the License for the specific language governing permissions and
    // limitations under the License.
    var TreeMirror = /** @class */ (function () {
        function TreeMirror(root, delegate) {
            this.root = root;
            this.delegate = delegate;
            this.idMap = {};
        }
        TreeMirror.prototype.initialize = function (rootId, children) {
            this.idMap[rootId] = this.root;
            for (var i = 0; i < children.length; i++)
                this.deserializeNode(children[i], this.root);
        };
        TreeMirror.prototype.applyChanged = function (removed, addedOrMoved, attributes, text) {
            var _this = this;
            // NOTE: Applying the changes can result in an attempting to add a child
            // to a parent which is presently an ancestor of the parent. This can occur
            // based on random ordering of moves. The way we handle this is to first
            // remove all changed nodes from their parents, then apply.
            addedOrMoved.forEach(function (data) {
                var node = _this.deserializeNode(data);
                _this.deserializeNode(data.parentNode);
                _this.deserializeNode(data.previousSibling);
                if (node.parentNode)
                    node.parentNode.removeChild(node);
            });
            removed.forEach(function (data) {
                var node = _this.deserializeNode(data);
                if (node.parentNode)
                    node.parentNode.removeChild(node);
            });
            addedOrMoved.forEach(function (data) {
                var node = _this.deserializeNode(data);
                var parent = _this.deserializeNode(data.parentNode);
                var previous = _this.deserializeNode(data.previousSibling);
                parent.insertBefore(node, previous ? previous.nextSibling : parent.firstChild);
            });
            attributes.forEach(function (data) {
                var node = _this.deserializeNode(data);
                Object.keys(data.attributes).forEach(function (attrName) {
                    var newVal = data.attributes[attrName];
                    if (newVal === null) {
                        node.removeAttribute(attrName);
                    }
                    else {
                        if (!_this.delegate ||
                            !_this.delegate.setAttribute ||
                            !_this.delegate.setAttribute(node, attrName, newVal)) {
                            node.setAttribute(attrName, newVal);
                        }
                    }
                });
            });
            text.forEach(function (data) {
                var node = _this.deserializeNode(data);
                node.textContent = data.textContent;
            });
            removed.forEach(function (node) {
                delete _this.idMap[node.id];
            });
        };
        TreeMirror.prototype.deserializeNode = function (nodeData, parent) {
            var _this = this;
            if (nodeData === null)
                return null;
            var node = this.idMap[nodeData.id];
            if (node)
                return node;
            var doc = this.root.ownerDocument;
            if (doc === null)
                doc = this.root;
            switch (nodeData.nodeType) {
                case Node.COMMENT_NODE:
                    node = doc.createComment(nodeData.textContent);
                    break;
                case Node.TEXT_NODE:
                    node = doc.createTextNode(nodeData.textContent);
                    break;
                case Node.DOCUMENT_TYPE_NODE:
                    node = doc.implementation.createDocumentType(nodeData.name, nodeData.publicId, nodeData.systemId);
                    break;
                case Node.ELEMENT_NODE:
                    if (this.delegate && this.delegate.createElement)
                        node = this.delegate.createElement(nodeData.tagName);
                    if (!node)
                        node = doc.createElement(nodeData.tagName);
                    Object.keys(nodeData.attributes).forEach(function (name) {
                        if (!_this.delegate ||
                            !_this.delegate.setAttribute ||
                            !_this.delegate.setAttribute(node, name, nodeData.attributes[name])) {
                            node.setAttribute(name, nodeData.attributes[name]);
                        }
                    });
                    break;
                default:
                    throw "Unsupported node type: " + nodeData.nodeType;
            }
            this.idMap[nodeData.id] = node;
            if (parent)
                parent.appendChild(node);
            if (nodeData.childNodes) {
                for (var i = 0; i < nodeData.childNodes.length; i++)
                    this.deserializeNode(nodeData.childNodes[i], node);
            }
            return node;
        };
        return TreeMirror;
    }());

    var TreeMirrorClient = /** @class */ (function () {
        function TreeMirrorClient(target, mirror, testingQueries) {
            var _this = this;
            this.target = target;
            this.mirror = mirror;
            this.nextId = 1;
            this.knownNodes = new NodeMap();
            var rootId = this.serializeNode(target).id;
            var children = [];
            for (var child = target.firstChild; child; child = child.nextSibling)
                children.push(this.serializeNode(child, true));
            this.mirror.initialize(rootId, children);
            var queries = [{ all: true }];
            if (testingQueries)
                queries = queries.concat(testingQueries);
            this.mutationSummary = new MutationSummary({
                rootNode: target,
                callback: function (summaries) {
                    _this.applyChanged(summaries);
                },
                queries: queries
            });
        }
        TreeMirrorClient.prototype.disconnect = function () {
            if (this.mutationSummary) {
                this.mutationSummary.disconnect();
                this.mutationSummary = undefined;
            }
        };
        TreeMirrorClient.prototype.rememberNode = function (node) {
            var id = this.nextId++;
            this.knownNodes.set(node, id);
            return id;
        };
        TreeMirrorClient.prototype.forgetNode = function (node) {
            this.knownNodes.delete(node);
        };
        TreeMirrorClient.prototype.serializeNode = function (node, recursive) {
            if (node === null)
                return null;
            var id = this.knownNodes.get(node);
            if (id !== undefined) {
                return { id: id };
            }
            var data = {
                nodeType: node.nodeType,
                id: this.rememberNode(node)
            };
            switch (data.nodeType) {
                case Node.DOCUMENT_TYPE_NODE:
                    var docType = node;
                    data.name = docType.name;
                    data.publicId = docType.publicId;
                    data.systemId = docType.systemId;
                    break;
                case Node.COMMENT_NODE:
                case Node.TEXT_NODE:
                    data.textContent = node.textContent;
                    break;
                case Node.ELEMENT_NODE:
                    var elm = node;
                    data.tagName = elm.tagName;
                    data.attributes = {};
                    for (var i = 0; i < elm.attributes.length; i++) {
                        var attr = elm.attributes[i];
                        data.attributes[attr.name] = attr.value;
                    }
                    if (recursive && elm.childNodes.length) {
                        data.childNodes = [];
                        for (var child = elm.firstChild; child; child = child.nextSibling)
                            data.childNodes.push(this.serializeNode(child, true));
                    }
                    break;
            }
            return data;
        };
        TreeMirrorClient.prototype.serializeAddedAndMoved = function (added, reparented, reordered) {
            var _this = this;
            var all = added.concat(reparented).concat(reordered);
            var parentMap = new NodeMap();
            all.forEach(function (node) {
                var parent = node.parentNode;
                var children = parentMap.get(parent);
                if (!children) {
                    children = new NodeMap();
                    parentMap.set(parent, children);
                }
                children.set(node, true);
            });
            var moved = [];
            parentMap.keys().forEach(function (parent) {
                var children = parentMap.get(parent);
                var keys = children.keys();
                while (keys.length) {
                    var node = keys[0];
                    while (node.previousSibling && children.has(node.previousSibling))
                        node = node.previousSibling;
                    while (node && children.has(node)) {
                        var data = _this.serializeNode(node);
                        data.previousSibling = _this.serializeNode(node.previousSibling);
                        data.parentNode = _this.serializeNode(node.parentNode);
                        moved.push(data);
                        children.delete(node);
                        node = node.nextSibling;
                    }
                    keys = children.keys();
                }
            });
            return moved;
        };
        TreeMirrorClient.prototype.serializeAttributeChanges = function (attributeChanged) {
            var _this = this;
            var map = new NodeMap();
            Object.keys(attributeChanged).forEach(function (attrName) {
                attributeChanged[attrName].forEach(function (element) {
                    var record = map.get(element);
                    if (!record) {
                        record = _this.serializeNode(element);
                        record.attributes = {};
                        map.set(element, record);
                    }
                    record.attributes[attrName] = element.getAttribute(attrName);
                });
            });
            return map.keys().map(function (node) {
                return map.get(node);
            });
        };
        TreeMirrorClient.prototype.applyChanged = function (summaries) {
            var _this = this;
            var summary = summaries[0];
            var removed = summary.removed.map(function (node) {
                return _this.serializeNode(node);
            });
            var moved = this.serializeAddedAndMoved(summary.added, summary.reparented, summary.reordered);
            var attributes = this.serializeAttributeChanges(summary.attributeChanged);
            var text = summary.characterDataChanged.map(function (node) {
                var data = _this.serializeNode(node);
                data.textContent = node.textContent;
                return data;
            });
            this.mirror.applyChanged(removed, moved, attributes, text);
            summary.removed.forEach(function (node) {
                _this.forgetNode(node);
            });
        };
        return TreeMirrorClient;
    }());

    // Copyright 2011 Google Inc.
    //
    // Licensed under the Apache License, Version 2.0 (the "License");
    // you may not use this file except in compliance with the License.
    // You may obtain a copy of the License at
    //
    //     http://www.apache.org/licenses/LICENSE-2.0
    //
    // Unless required by applicable law or agreed to in writing, software
    // distributed under the License is distributed on an "AS IS" BASIS,
    // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    // See the License for the specific language governing permissions and
    // limitations under the License.
    // @ts-ignore
    // @ts-ignore
    if (MutationObserver === undefined) {
        console.error('DOM Mutation Observers are required.');
        console.error('https://developer.mozilla.org/en-US/docs/DOM/MutationObserver');
        throw Error('DOM Mutation Observers are required');
    }

    exports.ChildListChange = ChildListChange;
    exports.MutationProjection = MutationProjection;
    exports.MutationSummary = MutationSummary;
    exports.NodeChange = NodeChange;
    exports.NodeMap = NodeMap;
    exports.Qualifier = Qualifier;
    exports.Selector = Selector;
    exports.Summary = Summary;
    exports.TreeChanges = TreeChanges;
    exports.TreeMirror = TreeMirror;
    exports.TreeMirrorClient = TreeMirrorClient;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=mutation-summary.js.map


/***/ }),

/***/ "./dom2.js":
/*!*****************!*\
  !*** ./dom2.js ***!
  \*****************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   addModifierStyles: () => (/* binding */ addModifierStyles),
/* harmony export */   manageEventListeners: () => (/* binding */ manageEventListeners),
/* harmony export */   processChatMessage: () => (/* binding */ processChatMessage),
/* harmony export */   setupChatObserver: () => (/* binding */ setupChatObserver)
/* harmony export */ });
/* harmony import */ var _emotes_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./emotes.js */ "./emotes.js");
/* harmony import */ var _navigation_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./navigation.js */ "./navigation.js");
/* harmony import */ var mutation_summary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! mutation-summary */ "./node_modules/mutation-summary/dist/umd/mutation-summary.js");




// Helper functions
const createTextFragment = (text) => {
  const span = document.createElement("span");
  span.classList.add("text-fragment");
  if (text.trim() === "") span.classList.add("spacer");
  span.textContent = text;
  return span;
};

const createEmoteImage = (emote) => {
  const img = document.createElement("img");
  img.src = emote.url;
  img.alt = emote.name;
  img.classList.add("simple-emote-extension");
  if (emote.modifier) img.classList.add("modifier");
  return img;
};

const processWord = (word, fragment, text, modifierDiv, currentState) => {
  if (word.startsWith("@"))
    return { fragment, text, modifierDiv, currentState }; // Skip mentions
  const emote = (0,_emotes_js__WEBPACK_IMPORTED_MODULE_0__.getEmote)(word);
  if (emote) {
    if (text.trim()) {
      fragment.appendChild(createTextFragment(text));
      text = "";
    }

    const emoteImage = createEmoteImage(emote);
    if (emote.modifier) {
      if (currentState === "PROCESSING") {
        currentState = "PROCESSING_MODIFIER";
        modifierDiv = document.createElement("div");
        modifierDiv.classList.add("modifier-container");
        if (fragment.lastElementChild instanceof HTMLImageElement) {
          modifierDiv.appendChild(fragment.lastElementChild);
        }
      }
      modifierDiv.appendChild(emoteImage);
    } else {
      if (currentState === "PROCESSING_MODIFIER") {
        fragment.appendChild(modifierDiv);
        modifierDiv = null;
        currentState = "PROCESSING";
      }
      fragment.appendChild(emoteImage);
    }
  } else {
    text += ` ${word} `;
  }

  return { fragment, text, modifierDiv, currentState };
};

const processMessageContent = (chatMessageBody) => {
  let currentState = "PROCESSING";
  let fragment = new DocumentFragment();
  let text = "";
  let modifierDiv = null;

  let textFragmentSpan = chatMessageBody.querySelector(".text-fragment");
  if (textFragmentSpan && textFragmentSpan.textContent.trim()) {
    const words = textFragmentSpan.textContent.split(/\s+/);
    words.forEach((word) => {
      ({ fragment, text, modifierDiv, currentState } = processWord(
        word,
        fragment,
        text,
        modifierDiv,
        currentState
      ));
    });
  } else {
    return null;
  }

  return { fragment, text, modifierDiv, currentState };
};

const processChatMessage = (chatMessageBody) => {
  if (!chatMessageBody || !(0,_emotes_js__WEBPACK_IMPORTED_MODULE_0__.containsEmote)(chatMessageBody)) return;

  let result = processMessageContent(chatMessageBody);

  if (!result) return;

  let { fragment, text, modifierDiv } = result;
  if (text.trim()) fragment.appendChild(createTextFragment(text));
  if (modifierDiv) fragment.appendChild(modifierDiv);

  chatMessageBody.replaceChildren(fragment);
};

const setupChatObserver = () => {
  let eventListenersLoaded = false;

  const processMutations = async (summaries) => {
    const chatMessages = summaries[0].added; // Array of added chat messages
    const promises = [];

    chatMessages.forEach((node) => {
      if (!eventListenersLoaded) {
        manageEventListeners();
        eventListenersLoaded = true;
      }

      if (node.dataset?.aTarget === "chat-line-message-body") {
        promises.push(processChatMessage(node));
      }

      if (node.classList.contains("tw-title")) {
        console.log(node.parentElement.href);
      }
    });

    await Promise.all(promises);
  };

  const startObserving = () => {
    const targetNode = document.querySelector(
      ".channel-root__right-column.channel-root__right-column--expanded"
    );

    if (targetNode) {
      // Use mutation-summary to watch for added chat messages
      const ms = new mutation_summary__WEBPACK_IMPORTED_MODULE_2__.MutationSummary({
        callback: processMutations, // Callback to handle mutations
        queries: [
          { element: `[data-a-target="chat-line-message-body"]` },
          { element: "h1.tw-title" },
        ], // Only track added chat lines and the parent of the username
      });

      console.log("Observer started on target node.");

      // Process mutations
      function processMutations(summaries) {
        const addedChatLines = summaries[0].added;
        const addedStreamInfo = summaries[1].added;

        addedChatLines.forEach((chatLine) => {
          // Process chat lines here
          processChatMessage(chatLine);
        });

        addedStreamInfo.forEach((titleElement) => {
          // Call the function to find and process the title element
          if (
            titleElement &&
            titleElement.parentElement &&
            titleElement.parentElement.href
          ) {
            (0,_navigation_js__WEBPACK_IMPORTED_MODULE_1__.urlChangeHandler)(titleElement.parentElement.href.split("/").pop());
          }
        });
      }
    } else {
      console.log("Target node not found, checking again in 1000ms...");
    }
  };

  const intervalId = setInterval(() => {
    const targetNode = document.querySelector(
      ".channel-root__right-column.channel-root__right-column--expanded"
    );

    if (targetNode) {
      clearInterval(intervalId); // Stop checking once the target node is found
      startObserving(); // Start observing the target node
    }
  }, 1000); // Check every 1 second
};

const addModifierStyles = async () => {
  const style = document.createElement("style");
  style.textContent = `
      .modifier-container {
        display: unset; /* Remove inherited display properties */
        display: inline-grid; /* Use grid for stacking */
        justify-items: center; /* Center items horizontally */
      }

      .chat-line__no-background * {
        align-items: center;
        vertical-align: middle;
      }

      .modifier {
        z-index: 1;
      }

      .modifier-container img {
        grid-area: 1 / 1; /* Stack all images in the same grid area */
        width: min-content; /* Make images fill the container width */
        height: min-content; /* Maintain aspect ratio */
      }
      
      
      .emote-tooltip {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.5); /* 50% transparent black */
        color: white;
        padding: 5px; /* Add some padding around the tooltip */
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none; /* Make sure the tooltip doesn't interfere with mouse events */
        z-index: 1000;
        text-align: center; /* Center the text */
      }

      .emote-preview img {
        padding: 5px; /* Add padding around the image */
      }

      .emote-info {
        margin-top: 5px;
      }

      .emote-name, .emote-service {
        display: block;
        font-size: 16px;
      }

      .emote-service {
        font-size: 13px;
        color: #ccc; /* Light gray for the service name */
      }`;

  // Append the style element to the document head
  document.head.appendChild(style);
};

const manageEventListeners = () => {
  const root = document.querySelector(".root");

  let tooltip = null;
  let isTooltipActive = false;

  root.addEventListener("mouseover", (event) => {
    const emoteElement = event.target.closest(".simple-emote-extension");
    if (!emoteElement) return;

    const modifierContainer = emoteElement.closest(".modifier-container");
    const emotes = modifierContainer
      ? Array.from(
          modifierContainer.querySelectorAll(".simple-emote-extension")
        )
      : [emoteElement];

    // If a tooltip already exists, remove it before creating a new one
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }

    tooltip = document.createElement("div");
    tooltip.classList.add("emote-tooltip");
    document.body.appendChild(tooltip);

    emotes.forEach((emote) => {
      const emoteInfo = (0,_emotes_js__WEBPACK_IMPORTED_MODULE_0__.getEmote)(emote.getAttribute("alt"));
      const emoteContent = document.createElement("div");
      emoteContent.classList.add("emote-content");

      const emotePreview = document.createElement("div");
      emotePreview.classList.add("emote-preview");
      const emoteImg = document.createElement("img");
      emoteImg.src = emoteInfo.bigUrl;
      emoteImg.alt = emoteInfo.name;
      emotePreview.appendChild(emoteImg);

      const emoteInfoDiv = document.createElement("div");
      emoteInfoDiv.classList.add("emote-info");
      const emoteNameDiv = document.createElement("div");
      emoteNameDiv.classList.add("emote-name");
      emoteNameDiv.textContent = emoteInfo.name;

      const emoteServiceDiv = document.createElement("div");
      emoteServiceDiv.classList.add("emote-service");
      emoteServiceDiv.textContent = emoteInfo.service.toUpperCase();

      emoteInfoDiv.appendChild(emoteNameDiv);
      emoteInfoDiv.appendChild(emoteServiceDiv);
      emoteContent.appendChild(emotePreview);
      emoteContent.appendChild(emoteInfoDiv);

      tooltip.appendChild(emoteContent);
    });

    const updateTooltipPosition = (e) => {
      if (!tooltip) return; // Check if tooltip still exists
      const tooltipRect = tooltip.getBoundingClientRect();
      tooltip.style.left = `${Math.min(
        window.innerWidth - tooltipRect.width - 10,
        e.clientX
      )}px`;
      tooltip.style.top = `${Math.min(
        window.innerHeight - tooltipRect.height,
        e.clientY
      )}px`;
    };

    updateTooltipPosition(event);
    isTooltipActive = true;

    const mouseMoveHandler = (e) => {
      if (isTooltipActive) {
        updateTooltipPosition(e);
      } else {
        document.removeEventListener("mousemove", mouseMoveHandler);
      }
    };

    document.addEventListener("mousemove", mouseMoveHandler);

    // Tooltip removal logic
    const removeTooltip = () => {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
      isTooltipActive = false;
      document.removeEventListener("mousemove", mouseMoveHandler);
    };

    const handleMouseLeave = () => {
      removeTooltip();
    };

    emoteElement.addEventListener("mouseleave", handleMouseLeave, {
      once: true,
    });

    document.addEventListener(
      "mousemove",
      (e) => {
        if (!isTooltipActive) return;
        // Check if the mouse has moved significantly far from the emote
        const distanceX = Math.abs(
          e.clientX - emoteElement.getBoundingClientRect().left
        );
        const distanceY = Math.abs(
          e.clientY - emoteElement.getBoundingClientRect().top
        );
        const maxDistance = 100; // Adjust this threshold as needed

        if (distanceX > maxDistance || distanceY > maxDistance) {
          handleMouseLeave();
        }
      },  
      { once: true }
    );
  });
};




/***/ }),

/***/ "./emotes.js":
/*!*******************!*\
  !*** ./emotes.js ***!
  \*******************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   containsEmote: () => (/* binding */ containsEmote),
/* harmony export */   getEmote: () => (/* binding */ getEmote),
/* harmony export */   initializeEmotes: () => (/* binding */ initializeEmotes),
/* harmony export */   loadEmotes: () => (/* binding */ loadEmotes)
/* harmony export */ });
const emotes = new Map();
let emotesDebug = true;
let emoteRegex;
let globalEmotesLoaded = false;
let currentUserObject;

const loadTwitchEmotes = async (username) => {
  if (!username) return null;

  const query = `query{user(login:"${username}"){subscriptionProducts{emotes{id state text token}}}}`;

  try {
    const response = await fetch("https://gql.twitch.tv/gql", {
      method: "POST",
      headers: {
        "Client-Id": "ue6666qo983tsx6so1t0vnawi233wa",
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors) {
      const errorMessage = data.errors[0].message;
      throw new Error(`Twitch API request failed: ${errorMessage}`);
    }

    data.data.user.subscriptionProducts.forEach((product) => {
      product.emotes.forEach((emote) => {
        emotes.set(emote.token, {
          url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/2.0`,
        });
      });
    });

    return emotes;
  } catch (error) {
    console.error("Error fetching emotes:", error);
    throw error;
  }
};

const loadGlobalTwitchEmotes = async (emoteSetId) => {
  if (!emoteSetId) return null;

  const query = `
    query {
      emoteSet(id: "${emoteSetId}") { 
        emotes { id token }
      }
    }
  `;

  try {
    const response = await fetch("https://gql.twitch.tv/gql", {
      method: "POST",
      headers: {
        "Client-Id": "ue6666qo983tsx6so1t0vnawi233wa",
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors) {
      const errorMessage = data.errors[0].message;
      throw new Error(`Twitch API request failed: ${errorMessage}`);
    }
    if (data && data.data && data.data.emoteSet && data.data.emoteSet.emotes) {
      data.data.emoteSet.emotes.forEach((emote) => {
        emotes.set(emote.token, {
          url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/2.0`,
        });
      });
    }
  } catch (error) {
    console.error("Error fetching emotes:", error);
    throw error;
  }
};

async function loadFFZEmotes(id) {
  try {
    const response = await fetch(
      `https://api.frankerfacez.com/v1/room/id/${id}`
    );
    if (!response.ok) {
      throw new Error(`FFZ HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.sets && data.room && data.room.set) {
      for (const emote of data.sets[data.room.set].emoticons) {
        if (emote.name && emote.urls && emote.urls[1]) {
          emotes.set(emote.name, {
            name: emote.name,
            url: emote.urls[1],
            bigUrl: emote.urls[4],
            height: emote.height || null,
            width: emote.width || null,
            service: "ffz"
          });
        }
      }
    }
  } catch (error) {
    if (emotesDebug) {
      console.error(`Error loading FFZ emotes for ${username}:`, error.message);
    }
  }
}

async function loadBTTVEmotes(userId) {
  try {
    const response = await fetch(
      `https://api.betterttv.net/3/cached/users/twitch/${userId}`
    );
    if (!response.ok) {
      throw new Error(`BTTV HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const allEmotes = [
      ...(data.channelEmotes || []),
      ...(data.sharedEmotes || []),
    ];
    for (const emote of allEmotes) {
      if (emote.code && emote.id) {
        emotes.set(emote.code, {
          name: emote.code,
          url: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
          bigUrl: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
          width: emote.width || null,
          height: emote.height || null,
          service: "bttv"
        });
      }
    }
  } catch (error) {
    if (emotesDebug) {
      console.error(
        `Error loading BTTV emotes for user ${userId}:`,
        error.message
      );
    }
  }
}

async function load7TVEmotes(userId) {
  try {
    const response = await fetch(`https://7tv.io/v3/users/twitch/${userId}`);
    if (!response.ok) {
      throw new Error(`7TV HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.emote_set && data.emote_set.emotes) {
      for (const emote of data.emote_set.emotes) {
        const file = emote.data?.host?.files.find((f) => f.name === "1x.webp");
        if (emote.name && emote.id && file) {
          emotes.set(emote.name, {
            name: emote.name,
            url: `https:${emote.data.host.url}/1x.webp`,
            bigUrl: `https:${emote.data.host.url}/3x.webp`,
            width: file.width || null,
            height: file.height || null,
            modifier: emote.flags > 0,
            service: "7tv"
          });
        }
      }
    }
  } catch (error) {
    if (emotesDebug) {
      console.error(
        `Error loading 7TV emotes for user ${userId}:`,
        error.message
      );
    }
  }
}

async function loadGlobalEmotes() {
  try {
    const [ffzResponse, bttvResponse, sevenTVResponse] = await Promise.all([
      fetch("https://api.frankerfacez.com/v1/set/global/ids"),
      fetch("https://api.betterttv.net/3/cached/emotes/global"),
      fetch("https://7tv.io/v3/emote-sets/global"),
    ]);

    if (!ffzResponse.ok)
      throw new Error(`FFZ Global HTTP error! status: ${ffzResponse.status}`);
    if (!bttvResponse.ok)
      throw new Error(`BTTV Global HTTP error! status: ${bttvResponse.status}`);
    if (!sevenTVResponse.ok)
      throw new Error(
        `7TV Global HTTP error! status: ${sevenTVResponse.status}`
      );

    const [ffzGlobal, bttvGlobal, sevenTVGlobal] = await Promise.all([
      ffzResponse.json(),
      bttvResponse.json(),
      sevenTVResponse.json(),
    ]);

    // Populate FFZ global emotes
    if (ffzGlobal && ffzGlobal.sets && ffzGlobal.sets[3]) {
      for (const emote of ffzGlobal.sets[3].emoticons) {
        if (emote.name && emote.urls && emote.urls[1]) {
          emotes.set(emote.name, {
            name: emote.name,
            url: emote.urls[1],
            bigUrl: emote.urls[4],
            height: emote.height || null,
            width: emote.width || null,
            service: "ffz"
          });
        }
      }
    }

    // Populate BTTV global emotes
    if (bttvGlobal) {
      for (const emote of bttvGlobal) {
        if (emote.code && emote.id) {
          emotes.set(emote.code, {
            name: emote.code,
            url: `https://cdn.betterttv.net/emote/${emote.id}/1x`,
            bigUrl: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
            width: emote.width || null,
            height: emote.height || null,
            service: "bttv"
          });
        }
      }
    }

    // Populate 7TV global emotes
    if (sevenTVGlobal && sevenTVGlobal.emotes) {
      for (const emote of sevenTVGlobal.emotes) {
        const file = emote.data?.host?.files.find((f) => f.name === "1x.webp");
        if (emote.name && emote.id && file) {
          emotes.set(emote.name, {
            name: emote.name,
            url: `https:${emote.data.host.url}/1x.webp`,
            bigUrl: `https:${emote.data.host.url}/3x.webp`,
            width: file.width || null,
            height: file.height || null,
            modifier: emote.flags > 0,
            service: "7tv"
          });
        }
      }
    }

    if (emotesDebug) {
      console.info("Loaded global emotes:", emotes.size);
    }
  } catch (error) {
    if (emotesDebug) {
      console.error("Error loading global emotes:", error.message);
    }
  }
}

async function loadEmotes(userObject) {
  // Check if all required fields are present
  if (!userObject || !userObject.username || !userObject.id) {
    if (emotesDebug) {
      console.error("Invalid userObject provided:", userObject);
    }
    return;
  }

  // Check if emotes are already loaded for this user
  if (currentUserObject && currentUserObject.id === userObject.id) {
    if (emotesDebug) {
      console.info(`Emotes already loaded for ${userObject.username}`);
    }
    return; 
  }

  // Update currentUserObject to the new user
  currentUserObject = userObject; 

  if (emotesDebug) {
    console.info(`Loading emotes for channel: ${userObject.username}`);
  }

  try {
    await Promise.all([
      loadFFZEmotes(userObject.id),
      loadBTTVEmotes(userObject.id),
      load7TVEmotes(userObject.id),
    ]);

    emoteRegex = createEmoteRegex(emotes);

    if (emotesDebug) {
      console.info(`Loaded ${emotes.size} channel emotes`);
    }
  } catch (error) {
    if (emotesDebug) {
      console.error("Failed to load channel emotes:", error);
    }
  }
}

function getEmote(emoteName) {
  return emotes.get(emoteName);
}

const createEmoteRegex = (emoteMap) => {
  const escapedEmoteNames = Array.from(emoteMap.keys()).map((name) => {
    // Escape all special regex characters, including the colon
    return name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); 
  });

  // Use a more flexible pattern to match emotes
  return new RegExp(
    escapedEmoteNames.map((name) => `(${name})`).join("|"), 
    "i"
  );
};

const containsEmote = (element) => emoteRegex.test(element.textContent);

async function initializeEmotes() {
  // Load global emotes once
  if (!globalEmotesLoaded)  {
    await loadGlobalEmotes();
    globalEmotesLoaded = true;
  }
  
  emoteRegex = createEmoteRegex(emotes);
}

// Export necessary functions and the debug variable



/***/ }),

/***/ "./lib.js":
/*!****************!*\
  !*** ./lib.js ***!
  \****************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getAuthTokenCookie: () => (/* binding */ getAuthTokenCookie),
/* harmony export */   getTwitchUserId: () => (/* binding */ getTwitchUserId)
/* harmony export */ });
function getAuthTokenCookie() {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    // Does this cookie string begin with the name we want?
    if (cookie.startsWith("auth-token=")) {
      return cookie.substring("auth-token=".length, cookie.length);
    }
  }
  return null; // Cookie not found
}

// Fetch Twitch user ID by username
const getTwitchUserId = async (username) => {
  if (!username) return null;

  const response = await fetch("https://gql.twitch.tv/gql", {
    method: "POST",
    headers: {
      "Client-Id": "ue6666qo983tsx6so1t0vnawi233wa",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `{user(login:"${username}" lookupType:ALL){id}}`,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();

  return data?.data?.user?.id
    ? { id: data.data.user.id, username: username }
    : null;
};

// Listen for navigation changes to detect new usernames





/***/ }),

/***/ "./navigation.js":
/*!***********************!*\
  !*** ./navigation.js ***!
  \***********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   matchChannelName: () => (/* binding */ matchChannelName),
/* harmony export */   urlChangeHandler: () => (/* binding */ urlChangeHandler)
/* harmony export */ });
/* harmony import */ var _lib_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lib.js */ "./lib.js");
/* harmony import */ var _emotes_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./emotes.js */ "./emotes.js");



// Keep track of the current username

let currentUsername = null;

// Log website navigation

let navDebug = true;


// Ignored pages for URL changes

const ignoredPages = {
  settings: true,
  payments: true,
  inventory: true,
  messages: true,
  subscriptions: true,
  friends: true,
  directory: true,
  videos: true,
  prime: true,
  downloads: true,
};

function matchChannelName(url) {
  if (!url) return undefined;

  const match = url.match(
    /^https?:\/\/(?:www\.)?twitch\.tv\/(\w+)\/?(?:\?.*)?$/
  );

  if (match && !ignoredPages[match[1]]) {
    return match[1];
  }

  return undefined;
}

// if (window.navigation) {
//   window.navigation.addEventListener("navigate", async (event) => {
//     const newUsername = matchChannelName(event.destination.url);

//     if (newUsername) {
//       await urlChangeHandler(newUsername);
//     }
//   });
// }

const urlChangeHandler = async (newUsername) => {
  // Check if the username has actually changed

  if (newUsername !== currentUsername) {
    if (navDebug) {
      console.info("URL changed, loading emotes for new user:", newUsername);
    }

    currentUsername = newUsername; // Update the current username

    const data = await (0,_lib_js__WEBPACK_IMPORTED_MODULE_0__.getTwitchUserId)(newUsername);
    await (0,_emotes_js__WEBPACK_IMPORTED_MODULE_1__.initializeEmotes)();
    await (0,_emotes_js__WEBPACK_IMPORTED_MODULE_1__.loadEmotes)({ id: data.id, username: data.username });
  } else {
    if (navDebug) {
      console.info("URL did not change, skipping emote loading.");
    }
  }
};




/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _lib_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lib.js */ "./lib.js");
/* harmony import */ var _emotes_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./emotes.js */ "./emotes.js");
/* harmony import */ var _dom2_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./dom2.js */ "./dom2.js");
/* harmony import */ var _navigation_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./navigation.js */ "./navigation.js");









(0,_dom2_js__WEBPACK_IMPORTED_MODULE_2__.setupChatObserver)();

async function main() {
  await (0,_dom2_js__WEBPACK_IMPORTED_MODULE_2__.addModifierStyles)();
  await (0,_emotes_js__WEBPACK_IMPORTED_MODULE_1__.initializeEmotes)();
  (0,_dom2_js__WEBPACK_IMPORTED_MODULE_2__.manageEventListeners)();
  const currentUsername = (0,_navigation_js__WEBPACK_IMPORTED_MODULE_3__.matchChannelName)(window.location.href);

  if (currentUsername) {
    const data = await (0,_lib_js__WEBPACK_IMPORTED_MODULE_0__.getTwitchUserId)(currentUsername);
    await (0,_emotes_js__WEBPACK_IMPORTED_MODULE_1__.loadEmotes)({ id: data.id, username: data.username });
  }
}

main().catch(console.error);

})();


//# sourceMappingURL=bundle.js.map