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

const awaitElement = (selector, timeout = 5000) => {
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

export { getTwitchUserId, awaitElement };