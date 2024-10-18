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


export {
  getTwitchUserId,
  getAuthTokenCookie,
};
