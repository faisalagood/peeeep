 // Default to false for production
 let emotesDebug = false;

 // Separate maps for global and channel emotes
 const globalEmotes = new Map();
 const channelEmotes = new Map();
 let channelEmoteRegex = null;
 let globalEmoteRegex = null;
 let currentChannelId = null;
 let initializePromise = null;
 
 
 // Utility function to create base emote image element
 const createBaseEmoteImage = (name, url, modifier = false) => {
   const img = document.createElement("img");
   img.src = url;
   img.alt = name;
   img.classList.add("simple-emote-extension");
   if (modifier) img.classList.add("modifier");
   return img;
 };
 
 // Utility function to create regex from emote names
 const createEmoteRegex = (emoteMap) => {
   if (emoteMap.size === 0) return null;
   const escapedEmoteNames = [...emoteMap.keys()].map(name => 
     name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
   );
   return new RegExp(`(${escapedEmoteNames.join("|")})`, "i");
 };
 
 // Utility function to handle API responses
 const handleApiResponse = async (response, errorMessage) => {
   if (!response.ok) {
     throw new Error(`${errorMessage} Status: ${response.status}`);
   }
   return response.json();
 };
 
 // Load FFZ emotes
 async function loadFFZEmotes(id, targetMap) {
   try {
     const data = await handleApiResponse(
       await fetch(`https://api.frankerfacez.com/v1/room/id/${id}`),
       "FFZ HTTP error!"
     );
     
     if (data?.sets?.[data.room?.set]?.emoticons) {
       data.sets[data.room.set].emoticons.forEach(emote => {
         if (emote.name && emote.urls?.[1]) {
           targetMap.set(emote.name, {
             name: emote.name,
             url: emote.urls[1],
             bigUrl: emote.urls[4] || emote.urls[1],
             height: emote.height,
             width: emote.width,
             service: "ffz",
             element: createBaseEmoteImage(emote.name, emote.urls[1])
           });
         }
       });
     }
   } catch (error) {
     emotesDebug && console.error("FFZ emotes error:", error.message);
   }
 }
 
 // Load BTTV emotes
 async function loadBTTVEmotes(userId, targetMap) {
   try {
     const data = await handleApiResponse(
       await fetch(`https://api.betterttv.net/3/cached/users/twitch/${userId}`),
       "BTTV HTTP error!"
     );
     
     [...(data.channelEmotes || []), ...(data.sharedEmotes || [])].forEach(emote => {
       if (emote.code && emote.id) {
         const url = `https://cdn.betterttv.net/emote/${emote.id}/1x`;
         targetMap.set(emote.code, {
           name: emote.code,
           url,
           bigUrl: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
           width: emote.width,
           height: emote.height,
           service: "bttv",
           element: createBaseEmoteImage(emote.code, url)
         });
       }
     });
   } catch (error) {
     emotesDebug && console.error("BTTV emotes error:", error.message);
   }
 }
 
 // Load 7TV emotes
 async function load7TVEmotes(userId, targetMap) {
   try {
     const data = await handleApiResponse(
       await fetch(`https://7tv.io/v3/users/twitch/${userId}`),
       "7TV HTTP error!"
     );
     
     data?.emote_set?.emotes?.forEach(emote => {
       const file = emote.data?.host?.files?.find(f => f.name === "1x.webp");
       if (emote.name && emote.id && file) {
         const url = `https:${emote.data.host.url}/1x.webp`;
         const modifier = Boolean(emote.flags > 0 || emote.data.flags > 0);
         targetMap.set(emote.name, {
           name: emote.name,
           url,
           bigUrl: `https:${emote.data.host.url}/4x.webp`,
           width: file.width,
           height: file.height,
           modifier,
           service: "7tv",
           element: createBaseEmoteImage(emote.name, url, modifier)
         });
       }
     });
   } catch (error) {
     emotesDebug && console.error("7TV emotes error:", error.message);
   }
 }
 
 // Load global emotes (called once)
 async function loadGlobalEmotes() {
   try {
     const [ffzResponse, bttvResponse, sevenTVResponse] = await Promise.all([
       fetch("https://api.frankerfacez.com/v1/set/global/ids"),
       fetch("https://api.betterttv.net/3/cached/emotes/global"),
       fetch("https://7tv.io/v3/emote-sets/global")
     ]);
 
     const [ffzData, bttvData, sevenTVData] = await Promise.all([
       handleApiResponse(ffzResponse, "FFZ Global HTTP error!"),
       handleApiResponse(bttvResponse, "BTTV Global HTTP error!"),
       handleApiResponse(sevenTVResponse, "7TV Global HTTP error!")
     ]);
 
     // Process FFZ global emotes
     ffzData?.sets?.[3]?.emoticons?.forEach(emote => {
       if (emote.name && emote.urls?.[1]) {
         globalEmotes.set(emote.name, {
           name: emote.name,
           url: emote.urls[1],
           bigUrl: emote.urls[4] || emote.urls[1],
           height: emote.height,
           width: emote.width,
           service: "ffz",
           element: createBaseEmoteImage(emote.name, emote.urls[1])
         });
       }
     });
 
     // Process BTTV global emotes
     bttvData?.forEach(emote => {
       if (emote.code && emote.id) {
         const url = `https://cdn.betterttv.net/emote/${emote.id}/1x`;
         globalEmotes.set(emote.code, {
           name: emote.code,
           url,
           bigUrl: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
           width: emote.width,
           height: emote.height,
           service: "bttv",
           element: createBaseEmoteImage(emote.code, url)
         });
       }
     });
 
     // Process 7TV global emotes
     sevenTVData?.emotes?.forEach(emote => {
       const file = emote.data?.host?.files?.find(f => f.name === "1x.webp");
       if (emote.name && emote.id && file) {
         const url = `https:${emote.data.host.url}/1x.webp`;
         const modifier = Boolean(emote.data.flags > 0);
         globalEmotes.set(emote.name, {
           name: emote.name,
           url,
           bigUrl: `https:${emote.data.host.url}/3x.webp`,
           width: file.width,
           height: file.height,
           modifier,
           service: "7tv",
           element: createBaseEmoteImage(emote.name, url, modifier)
         });
       }
     });
 
     globalEmoteRegex = createEmoteRegex(globalEmotes);
     emotesDebug && console.info("Loaded global emotes:", globalEmotes.size);
   } catch (error) {
     emotesDebug && console.error("Global emotes error:", error);
   }
 }
 
 // Modified loadChannelEmotes
 async function loadChannelEmotes(userObject) {
   if (!userObject?.id || userObject.id === currentChannelId) return;
   
   // Clear previous channel emotes first
   clearChannelEmotes();
   currentChannelId = userObject.id;
   
   emotesDebug && console.info(`Loading emotes for channel: ${userObject.username}`);
   
   try {
     // Ensure global emotes are loaded first
     await initializeEmotes();
     
     // Load all channel emotes in parallel
     const results = await Promise.allSettled([
       loadFFZEmotes(userObject.id, channelEmotes),
       loadBTTVEmotes(userObject.id, channelEmotes),
       load7TVEmotes(userObject.id, channelEmotes)
     ]);
     
     // Log any errors but continue
     results.forEach((result, index) => {
       if (result.status === 'rejected') {
         emotesDebug && console.error(`Error loading emotes from source ${index}:`, result.reason);
       }
     });
 
     channelEmoteRegex = createEmoteRegex(channelEmotes);
     emotesDebug && console.info(`Loaded ${channelEmotes.size} channel emotes`);
   } catch (error) {
     emotesDebug && console.error("Channel emotes error:", error);
     // Still create regex even if some emotes failed
     channelEmoteRegex = createEmoteRegex(channelEmotes);
   }
 }
 
 // Clear all channel-specific emotes and reset channel state
 function clearChannelEmotes() {
   channelEmotes.clear();
   channelEmoteRegex = null;
   currentChannelId = null;
   emotesDebug && console.info("Cleared channel emotes");
 }
 
 // Initialize emotes system
 async function initializeEmotes() {
   // Only start one initialization
   if (!initializePromise) {
     initializePromise = (async () => {
       if (globalEmotes.size === 0) {
         await loadGlobalEmotes();
       }
     })();
   }
   return initializePromise;
 }
 
 // Get emote from either global or channel emotes
 function getEmote(emoteName) {
   return channelEmotes.get(emoteName) || globalEmotes.get(emoteName);
 }
 
 // Check if text contains any emotes
 function containsEmote(element) {
   const text = element.textContent;
   return (channelEmoteRegex?.test(text) || globalEmoteRegex?.test(text)) ?? false;
 }
 
 // Create an emote image element using cloneNode for better memory usage
 function createEmoteImage(emote) {
   return emote.element.cloneNode(true);
 }
 
 
 export {
   loadChannelEmotes,
   getEmote,
   initializeEmotes,
   containsEmote,
   createEmoteImage,
   clearChannelEmotes,
   createBaseEmoteImage
 };