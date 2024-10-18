const e=async e=>{if(!e)return null;const t=await fetch("https://gql.twitch.tv/gql",{method:"POST",headers:{"Client-Id":"ue6666qo983tsx6so1t0vnawi233wa","Content-Type":"application/json"},body:JSON.stringify({query:`{user(login:"${e}" lookupType:ALL){id}}`})});if(!t.ok)return null;const n=await t.json();return n?.data?.user?.id?{id:n.data.user.id,username:e}:null},t=new Map;let n,i,o=!1;async function r(e){try{const n=await fetch(`https://api.frankerfacez.com/v1/room/id/${e}`);if(!n.ok)throw new Error(`FFZ HTTP error! status: ${n.status}`);const i=await n.json();if(i&&i.sets&&i.room&&i.room.set)for(const e of i.sets[i.room.set].emoticons)e.name&&e.urls&&e.urls[1]&&t.set(e.name,{name:e.name,url:e.urls[1],bigUrl:e.urls[2],height:e.height||null,width:e.width||null,service:"ffz"})}catch(e){}}async function a(e){try{const n=await fetch(`https://api.betterttv.net/3/cached/users/twitch/${e}`);if(!n.ok)throw new Error(`BTTV HTTP error! status: ${n.status}`);const i=await n.json(),o=[...i.channelEmotes||[],...i.sharedEmotes||[]];for(const e of o)e.code&&e.id&&t.set(e.code,{name:e.code,url:`https://cdn.betterttv.net/emote/${e.id}/1x`,bigUrl:`https://cdn.betterttv.net/emote/${e.id}/3x`,width:e.width||null,height:e.height||null,service:"bttv"})}catch(e){}}async function s(e){try{const n=await fetch(`https://7tv.io/v3/users/twitch/${e}`);if(!n.ok)throw new Error(`7TV HTTP error! status: ${n.status}`);const i=await n.json();if(i&&i.emote_set&&i.emote_set.emotes)for(const e of i.emote_set.emotes){const n=e.data?.host?.files.find((e=>"1x.webp"===e.name));e.name&&e.id&&n&&t.set(e.name,{name:e.name,url:`https:${e.data.host.url}/1x.webp`,bigUrl:`https:${e.data.host.url}/3x.webp`,width:n.width||null,height:n.height||null,modifier:e.flags>0,service:"7tv"})}}catch(e){}}async function c(e){if(e&&e.username&&e.id&&(!i||i.id!==e.id)){i=e;try{await Promise.all([r(e.id),a(e.id),s(e.id)]),n=l(t)}catch(e){}}}function d(e){return t.get(e)}const l=e=>{const t=Array.from(e.keys()).map((e=>e.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&")));return new RegExp(t.map((e=>`\\b(${e})\\b`)).join("|"),"i")};async function m(){o||(await async function(){try{const[e,n,i]=await Promise.all([fetch("https://api.frankerfacez.com/v1/set/global/ids"),fetch("https://api.betterttv.net/3/cached/emotes/global"),fetch("https://7tv.io/v3/emote-sets/global")]);if(!e.ok)throw new Error(`FFZ Global HTTP error! status: ${e.status}`);if(!n.ok)throw new Error(`BTTV Global HTTP error! status: ${n.status}`);if(!i.ok)throw new Error(`7TV Global HTTP error! status: ${i.status}`);const[o,r,a]=await Promise.all([e.json(),n.json(),i.json()]);if(o&&o.sets&&o.sets[3])for(const e of o.sets[3].emoticons)e.name&&e.urls&&e.urls[1]&&t.set(e.name,{name:e.name,url:e.urls[1],url:e.urls[2],height:e.height||null,width:e.width||null,service:"ffz"});if(r)for(const e of r)e.code&&e.id&&t.set(e.code,{name:e.code,url:`https://cdn.betterttv.net/emote/${e.id}/1x`,bigUrl:`https://cdn.betterttv.net/emote/${e.id}/3x`,width:e.width||null,height:e.height||null,service:"bttv"});if(a&&a.emotes)for(const e of a.emotes){const n=e.data?.host?.files.find((e=>"1x.webp"===e.name));e.name&&e.id&&n&&t.set(e.name,{name:e.name,url:`https:${e.data.host.url}/1x.webp`,bigUrl:`https:${e.data.host.url}/3x.webp`,width:n.width||null,height:n.height||null,modifier:e.flags>0,service:"7tv"})}}catch(e){}}(),o=!0),n=l(t)}const u="PROCESSING",h="PROCESSING_MODIFIER",f=e=>{const t=document.createElement("span");return t.classList.add("text-fragment"),t.textContent=e.trim(),t},p=(e,t,n,i,o)=>{if(e.nodeType===Node.TEXT_NODE)return e.textContent.split(/\s+/).reduce(((e,t)=>((e,t,n,i,o)=>{if("@"===e[0])return{fragment:t,text:n,modifierDiv:i,currentState:o};const r=d(e);if(r){n.trim()&&(t.appendChild(f(n)),n="");const e=(e=>{const t=document.createElement("img");return t.src=e.url,t.alt=e.name,t.className="unreadable",e.modifier&&t.classList.add("modifier"),t})(r);r.modifier?(o===u&&(o=h,i=(()=>{const e=document.createElement("div");return e.classList.add("modifier-container"),e})(),t.lastElementChild instanceof HTMLImageElement&&i.appendChild(t.lastElementChild)),i.appendChild(e)):(o===h&&(t.appendChild(i),i=null,o=u),t.appendChild(e))}else n+=` ${e} `;return{fragment:t,text:n,modifierDiv:i,currentState:o}})(t,e.fragment,e.text,e.modifierDiv,e.currentState)),{fragment:t,text:n,modifierDiv:i,currentState:o});if(e.nodeType===Node.ELEMENT_NODE){if(!e.classList.contains("chat-line__message--emote"))return Array.from(e.childNodes).reduce(((e,t)=>p(t,e.fragment,e.text,e.modifierDiv,e.currentState)),{fragment:t,text:n,modifierDiv:i,currentState:o});{const n=e.cloneNode(!0);n.className="unreadable",t.appendChild(n),o===h&&(t.appendChild(i),i=null,o=u)}}return{fragment:t,text:n,modifierDiv:i,currentState:o}},g=e=>{var t;if(e&&(t=e,n.test(t.textContent))){const{fragment:t,text:n,modifierDiv:i}=(e=>{let t=u,n=new DocumentFragment;return Array.from(e.childNodes).reduce(((e,t)=>p(t,e.fragment,e.text,e.modifierDiv,e.currentState)),{fragment:n,text:"",modifierDiv:null,currentState:t})})(e),o=((e,t,n)=>(t.trim()&&e.appendChild(f(t)),n&&e.appendChild(n),e))(t,n,i);e.replaceChildren(o)}},w=()=>{document.querySelector(".root").addEventListener("mouseover",(function(e){const t=e.target.closest(".unreadable");if(t){const n=t.closest(".modifier-container"),i=n?Array.from(n.querySelectorAll(".unreadable")):[t],o=document.createElement("div");o.classList.add("emote-tooltip"),i.forEach(((e,t)=>{const n=e.getAttribute("alt"),r=d(n),a=document.createElement("div");a.classList.add("emote-content");const s=document.createElement("div");s.classList.add("emote-preview");const c=document.createElement("img");c.src=r.bigUrl,c.alt=n,s.appendChild(c),a.appendChild(s);const l=document.createElement("div");l.classList.add("emote-info");const m=document.createElement("div");m.classList.add("emote-name"),m.textContent=n;const u=document.createElement("div");if(u.classList.add("emote-service"),u.textContent=r.service.toUpperCase()+" Emote",l.appendChild(m),l.appendChild(u),a.appendChild(l),o.appendChild(a),t<i.length-1){const e=document.createElement("div");e.classList.add("emote-separator"),o.appendChild(e)}})),document.body.appendChild(o),Object.assign(o.style,{position:"absolute",backgroundColor:"#18181b",color:"white",padding:"8px",borderRadius:"4px",boxShadow:"0 2px 10px rgba(0,0,0,0.2)",zIndex:"1000",fontSize:"14px"}),o.querySelectorAll(".emote-content").forEach((e=>{Object.assign(e.style,{display:"flex",alignItems:"center",gap:"8px",padding:"4px 0"})})),o.querySelectorAll(".emote-preview").forEach((e=>{Object.assign(e.style,{width:"40px",height:"40px",backgroundColor:"transparent",display:"flex",justifyContent:"center",alignItems:"center",borderRadius:"4px"})})),o.querySelectorAll(".emote-preview img").forEach((e=>{Object.assign(e.style,{maxWidth:"100%",maxHeight:"100%"})})),o.querySelectorAll(".emote-info").forEach((e=>{Object.assign(e.style,{display:"flex",flexDirection:"column"})})),o.querySelectorAll(".emote-name").forEach((e=>{Object.assign(e.style,{fontWeight:"bold"})})),o.querySelectorAll(".emote-service").forEach((e=>{Object.assign(e.style,{fontSize:"12px",opacity:"0.8"})})),o.querySelectorAll(".emote-separator").forEach((e=>{Object.assign(e.style,{height:"1px",backgroundColor:"rgba(255, 255, 255, 0.1)",margin:"4px 0"})}));const r=e=>{const t=o.getBoundingClientRect(),n=(window.innerWidth,e.clientX),i=e.clientY;o.style.left=n-t.width-10+"px",i+t.height>window.innerHeight?o.style.top=window.innerHeight-t.height+"px":o.style.top=`${i}px`};r(e),document.addEventListener("mousemove",r),(n||t).addEventListener("mouseleave",(()=>{o.remove(),document.removeEventListener("mousemove",r)}),{once:!0})}}))},v={settings:!0,payments:!0,inventory:!0,messages:!0,subscriptions:!0,friends:!0,directory:!0,videos:!0,prime:!0,downloads:!0};function y(e){if(!e)return;const t=e.match(/^https?:\/\/(?:www\.)?twitch\.tv\/(\w+)\/?(?:\?.*)?$/);return t&&!v[t[1]]?t[1]:void 0}window.navigation.addEventListener("navigate",(async e=>{const t=y(e.destination.url);t&&await b(t)}));const b=async t=>{console.info("URL changed, loading emotes for new user:",t);const n=await e(t);await m(),await c({id:n.id,username:n.username})};(()=>{let e=!1;new MutationObserver((t=>{for(let n=0;n<t.length;n++){const i=t[n];if("childList"===i.type)for(let t=0;t<i.addedNodes.length;t++){const n=i.addedNodes[t];1===n.nodeType&&"chat-line__message"===n.className&&(e||(w(),e=!0),g(n.querySelector('[data-a-target="chat-line-message-body"]')))}}})).observe(document,{childList:!0,subtree:!0})})(),async function(){await async function(){const e=document.createElement("style");e.textContent="\n      .modifier-container {\n        display: unset; /* Remove inherited display properties */\n        display: inline-grid; /* Use grid for stacking */\n        justify-items: center; /* Center items horizontally */\n      }\n\n      .chat-line__no-background * {\n        align-items: center;\n        vertical-align: middle;\n      }\n\n      .modifier {\n        z-index: 1;\n      }\n\n      .modifier-container img {\n        grid-area: 1 / 1; /* Stack all images in the same grid area */\n        width: min-content; /* Make images fill the container width */\n        height: min-content; /* Maintain aspect ratio */\n      }\n      \n      \n      .emote-tooltip {\n        position: absolute;\n        background-color: black;\n        color: white;\n        padding: 5px;\n        border-radius: 4px;\n        font-size: 12px;\n        pointer-events: none; /* Make sure the tooltip doesn't interfere with mouse events */\n        z-index: 1000;\n      }\n    ",document.head.appendChild(e)}(),await m();const t=y(window.location.href);if(t){w();const n=await e(t);await c({id:n.id,username:n.username})}}().catch(console.error);
//# sourceMappingURL=bundle.js.map