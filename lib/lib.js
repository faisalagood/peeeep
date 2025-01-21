const TWITCH_CLIENT_ID = "ue6666qo983tsx6so1t0vnawi233wa";
const API_TIMEOUT = 5000;

const gqlRequest = async (query) => {
  const response = await fetch("https://gql.twitch.tv/gql", {
    method: "POST",
    headers: {
      "Client-Id": TWITCH_CLIENT_ID,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query })
  });
  
  if (!response.ok) return null;
  return response.json();
};

export const getTwitchUserId = async (username) => {
  if (!username) return null;
  
  try {
    const data = await gqlRequest(`{user(login:"${username}" lookupType:ALL){id}}`);
    
    return data?.data?.user?.id
      ? { id: data.data.user.id, username }
      : null;
  } catch (error) {
    console.error("[PEEEEP] Failed to get user ID:", error);
    return null;
  }
};

export const awaitElement = (selector, timeout = API_TIMEOUT) => {
  return new Promise((resolve, reject) => {
    let startTime = performance.now();

    const checkElement = () => {
      const element = document.querySelector(selector);
      
      if (element?.isConnected) {
        resolve(element);
        return;
      }

      if (performance.now() - startTime >= timeout) {
        reject(new Error(`Connected element not found within ${timeout}ms: ${selector}`));
        return;
      }

      requestAnimationFrame(checkElement);
    };

    requestAnimationFrame(checkElement);
  });
};