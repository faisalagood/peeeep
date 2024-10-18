const State = {
  START: 'START',
  TEXT: 'TEXT',
  FIRST_PARTY_EMOTE: 'FIRST_PARTY_EMOTE',
  THIRD_PARTY_EMOTE: 'THIRD_PARTY_EMOTE',
  END: 'END'
};

function processChatLine(nodes) {
  let currentState = State.START;
  let currentNodeIndex = 0;
  const fragment = document.createDocumentFragment();

  while (currentNodeIndex < nodes.length) {
    const currentNode = nodes[currentNodeIndex];

    switch (currentState) {
      case State.START:
        if (currentNode.nodeType === Node.TEXT_NODE) {
          currentState = State.TEXT;
          processTextNode(currentNode, fragment);
        } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
          if (isFirstPartyEmote(currentNode)) {
            currentState = State.FIRST_PARTY_EMOTE;
            processFirstPartyEmoteNode(currentNode, fragment);
          } else if (isThirdPartyEmote(currentNode)) {
            currentState = State.THIRD_PARTY_EMOTE;
            processThirdPartyEmoteNode(currentNode, fragment);
          } else {
            // Handle other element types if needed
            fragment.appendChild(currentNode.cloneNode(true));
          }
        }
        break;

      case State.TEXT:
        // This state might need further refinement depending on your needs
        currentState = State.START; // Move to the next node
        break;

      case State.FIRST_PARTY_EMOTE:
        currentState = State.START; // Move to the next node
        break;

      case State.THIRD_PARTY_EMOTE:
        currentState = State.START; // Move to the next node
        break;
    }

    currentNodeIndex++;
  }

  currentState = State.END;
  console.log('End of chat line processing');
  return fragment;
}

// Placeholder functions - you'll need to implement these based on your HTML structure
function isFirstPartyEmote(node) {
  // Example: Check if the node has a specific class or attribute
  return node.classList.contains('first-party-emote');
}

function isThirdPartyEmote(node) {
  // Example: Check if the node has a specific class or attribute
  return node.classList.contains('third-party-emote');
}

function processTextNode(node, fragment) {
  // You might split the text node here if needed
  fragment.appendChild(node.cloneNode(true));
}

function processFirstPartyEmoteNode(node, fragment) {
  // Process the emote node (e.g., replace it with an <img> tag)
  const img = document.createElement('img');
  img.src = getEmoteUrl(node); // Example: get the emote URL
  img.alt = getEmoteName(node); // Example: get the emote name
  fragment.appendChild(img); 
}

function processThirdPartyEmoteNode(node, fragment) {
  // Process the emote node (similar to first-party, but with different logic)
  // ... (implementation depends on your third-party emote structure)
  const img = document.createElement('img');
  img.src = getThirdPartyEmoteUrl(node); // Example: get the emote URL
  img.alt = getThirdPartyEmoteName(node); // Example: get the emote name
  fragment.appendChild(img); 
}

// Example functions to get emote URLs and names (you'll need to customize these)
function getEmoteUrl(node) {
  // Logic to extract the emote URL from the node (e.g., from an attribute)
  // Example: return node.getAttribute('data-emote-url');
  return 'https://example.com/first-party-emote.png'; // Replace with your actual logic
}

function getEmoteName(node) {
  // Logic to extract the emote name from the node
  // Example: return node.getAttribute('data-emote-name');
  return 'firstPartyEmote'; // Replace with your actual logic
}

function getThirdPartyEmoteUrl(node) {
  // Logic to extract the emote URL from the node (e.g., from an attribute)
  // Example: return node.getAttribute('data-emote-url');
  return 'https://example.com/third-party-emote.png'; // Replace with your actual logic
}

function getThirdPartyEmoteName(node) {
  // Logic to extract the emote name from the node
  // Example: return node.getAttribute('data-emote-name');
  return 'thirdPartyEmote'; // Replace with your actual logic
}