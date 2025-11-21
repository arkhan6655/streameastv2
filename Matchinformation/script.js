document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://topembed.pw/api.php?format=json";
  // IMPORTANT: Make sure this is the correct URL for your final streaming page.
  const STREAM_PAGE_URL = "https://raaj648.github.io/newstreampage/"; // Example: /stream/ or https://yoursite.com/streampage/
  const DISCORD_SERVER_ID = "1422384816472457288"; // Replace with your server ID if you have one

  const pageTitle = document.getElementById("page-title"),
        pageHeading = document.getElementById("page-heading"),
        pageDescription = document.getElementById("page-description"),
        navMenu = document.getElementById("nav-menu"),
        countdownContainer = document.getElementById("countdown-container"),
        streamCountSpan = document.getElementById("stream-count"),
        placeholderGrid = document.getElementById("stream-links-placeholder"),
        realGrid = document.getElementById("stream-links-grid"),
        stickyMenu = document.getElementById('sticky-menu'),
        mainContent = document.querySelector('main'),
        // Ad Elements
        closeAdBtn = document.getElementById("close-ad"),
        stickyAd = document.getElementById("sticky-footer-ad"),
        closeDesktopAdBtn = document.getElementById("close-desktop-ad"),
        desktopStickyAd = document.getElementById("desktop-sticky-ad");

  let countdownInterval;
  let menuData = null;
  const prioritySports = ["Football", "Basketball", "Baseball", "Tennis", "UFC", "Motorsport"];

  // --- MENU & STICKY HEADER LOGIC ---
  function handleStickyMenu() {
    const stickyPos = stickyMenu.offsetTop;
    if (window.pageYOffset > stickyPos) {
      if (!stickyMenu.classList.contains('sticky')) {
        mainContent.style.paddingTop = stickyMenu.offsetHeight + 'px';
        stickyMenu.classList.add('sticky');
      }
    } else {
      if (stickyMenu.classList.contains('sticky')) {
        mainContent.style.paddingTop = '0';
        stickyMenu.classList.remove('sticky');
      }
    }
  }

  function generateNavMenu() {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const maxDynamicItems = isMobile ? 2 : 7;
    let menuItems = [];
    const addedSports = new Set();
    if (menuData) {
      menuData.forEach(cat => {
        if (cat.liveCount > 0 && menuItems.length < maxDynamicItems) {
          menuItems.push(cat.name);
          addedSports.add(cat.name);
        }
      });
    }
    prioritySports.forEach(sport => {
      if (!addedSports.has(sport) && menuItems.length < maxDynamicItems) menuItems.push(sport);
    });
    let menuHTML = `<li class="menu-item"><a href="/">Home</a></li><li class="menu-item"><a href="/Schedule/">Schedule</a></li>`;
    // FIX: Encoded the item for the URL to ensure links back to the schedule page work for all sport names.
    menuItems.forEach(item => { menuHTML += `<li class="menu-item"><a href="/Schedule/?sport=${encodeURIComponent(item)}">${item}</a></li>`; });
    navMenu.innerHTML = menuHTML;
  }
  
  // --- PAGE-SPECIFIC LOGIC (No changes below this line) ---
  function updatePageMeta(matchInfo) {
    const title = `${matchInfo.match} Live Streaming Links`;
    pageTitle.textContent = title;
    pageHeading.textContent = `${matchInfo.match} Live Streaming Links`;
    pageDescription.textContent = `To watch ${matchInfo.match} (${matchInfo.tournament}) streams, scroll down and choose a stream link of your choice. If no links appear, the event may not be live yet.`;
  }

  function startCountdown(targetTimestamp) {
    countdownContainer.style.display = "block";
    countdownInterval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = targetTimestamp - now;
      if (diff <= 0) {
        clearInterval(countdownInterval);
        countdownContainer.style.display = "none";
        return;
      }
      const d=Math.floor(diff/(3600*24)),h=Math.floor(diff%(3600*24)/3600),m=Math.floor(diff%3600/60),s=Math.floor(diff%60);
      document.getElementById("days").textContent = d.toString().padStart(2, '0');
      document.getElementById("hours").textContent = h.toString().padStart(2, '0');
      document.getElementById("minutes").textContent = m.toString().padStart(2, '0');
      document.getElementById("seconds").textContent = s.toString().padStart(2, '0');
    }, 1000);
  }

  function getChannelName(url, index) {
    const lastPart = url.substring(url.lastIndexOf('/') + 1);
    const decodedPart = decodeURIComponent(lastPart);
    const isGeneric = /^(ex)?\d{3,}$/.test(decodedPart) || decodedPart.length < 3;
    return isGeneric ? `Stream Link ${index + 1}` : decodedPart;
  }

  function renderChannels(channels, matchId) {
    streamCountSpan.textContent = channels.length;
    realGrid.innerHTML = "";
    if (channels.length > 0) {
      channels.forEach((channelUrl, index) => {
        const channelName = getChannelName(channelUrl, index);
        const streamLink = document.createElement("a");
        streamLink.className = "stream-link";
        streamLink.href = `${STREAM_PAGE_URL}?id=${matchId}&stream=${encodeURIComponent(channelUrl)}`;
        streamLink.target = "_blank";
        streamLink.rel = "nofollow";

        const newTabIcon = `<svg class="new-tab-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`;
        streamLink.innerHTML = `<div class="stream-link-content"><span class="stream-info">${channelName} ${newTabIcon}</span><span class="watch-now-btn">Watch Now!</span></div>`;
        realGrid.appendChild(streamLink);
      });
    } else {
      realGrid.innerHTML = "<p>No stream links are available at the moment. Please check back closer to the event time.</p>";
    }
    placeholderGrid.style.display = "none";
    realGrid.style.display = "grid";
  }
  
  // --- DISCORD WIDGET LOGIC ---
  async function loadDiscordWidget() {
    if (!DISCORD_SERVER_ID) return;
    const apiUrl = `https://discord.com/api/guilds/${DISCORD_SERVER_ID}/widget.json`;
    const onlineCountEl = document.getElementById("discord-online-count");
    const membersListEl = document.getElementById("discord-members-list");
    const joinButton = document.getElementById("discord-join-button");

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch Discord data');
      const data = await response.json();
      if (onlineCountEl) onlineCountEl.textContent = data.presence_count || '0';
      if (joinButton && data.instant_invite) joinButton.href = data.instant_invite;
      if (membersListEl) {
        membersListEl.innerHTML = ''; 
        const fragment = document.createDocumentFragment();
        if (data.members && data.members.length > 0) {
          data.members.slice(0, 5).forEach(member => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="member-avatar"><img src="${member.avatar_url}" alt="${member.username}"><span class="online-indicator"></span></div><span class="member-name">${member.username}</span>`;
            fragment.appendChild(li);
          });
        }
        if (data.instant_invite) {
            const moreLi = document.createElement('li');
            moreLi.className = 'more-members-link';
            moreLi.innerHTML = `<p>and more in our <a href="${data.instant_invite}" target="_blank" rel="noopener noreferrer nofollow">Discord!</a></p>`;
            fragment.appendChild(moreLi);
        }
        membersListEl.appendChild(fragment);
      }
    } catch (error) {
      console.error("Error loading Discord widget:", error);
      const widgetContainer = document.getElementById("discord-widget-container");
      if (widgetContainer) widgetContainer.innerHTML = '<p>Could not load Discord widget.</p>';
    }
  }

  // --- AD EVENT LISTENERS ---
  function setupAdEventListeners() {
    if (closeAdBtn && stickyAd) {
      closeAdBtn.addEventListener("click", () => { 
        stickyAd.style.display = "none"; 
      });
    }
    if (closeDesktopAdBtn && desktopStickyAd) {
      closeDesktopAdBtn.addEventListener("click", () => {
        desktopStickyAd.style.display = "none";
      });
    }
  }

  // --- INITIALIZATION ---
  async function initializePage() {
    setupAdEventListeners();
    try {
      const params = new URLSearchParams(window.location.search);
      const matchIdFromUrl = params.get('id');
      if (!matchIdFromUrl) throw new Error("No match ID provided in URL.");
      
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      if (!data || !data.events) throw new Error("Invalid API response format");

      let foundMatch = null;
      const tempMenuData = {};
      const now = Math.floor(Date.now() / 1000);

      for (const date in data.events) {
        const eventsForDay = Array.isArray(data.events[date]) ? data.events[date] : [data.events[date]];

        for (const event of eventsForDay) {
          if (!foundMatch && event.sport && event.match && event.unix_timestamp) {
            const uniqueString = `${event.unix_timestamp}_${event.sport}_${event.match}`;
            const uniqueId = btoa(unescape(encodeURIComponent(uniqueString)));
            
            if (uniqueId === matchIdFromUrl) {
              foundMatch = event;
            }
          }
          
          if (event.sport) {
            const diffMinutes = (now - event.unix_timestamp) / 60;
            const isLive = diffMinutes >= 0 && diffMinutes < 150;
            if (!tempMenuData[event.sport]) tempMenuData[event.sport] = { liveCount: 0, name: event.sport };
            if (isLive) tempMenuData[event.sport].liveCount++;
          }
        }
      }

      menuData = Object.values(tempMenuData).sort((a, b) => b.liveCount - a.liveCount);
      generateNavMenu();

      if (!foundMatch) throw new Error("Match not found in the API data.");

      updatePageMeta(foundMatch);
      const channelUrls = (foundMatch.channels.channel || foundMatch.channels || []).map(c => typeof c === 'object' ? c.channel : c).filter(Boolean);
      
      renderChannels(channelUrls, matchIdFromUrl);

      if (foundMatch.unix_timestamp > now) {
        startCountdown(foundMatch.unix_timestamp);
      }

      loadDiscordWidget();

    } catch (err) {
      console.error("Error initializing page:", err);
      pageHeading.textContent = "Error Loading Match";
      pageDescription.textContent = "The requested match could not be found. Please return to the schedule.";
      placeholderGrid.style.display = "none";
    }
  }
  
  window.addEventListener('scroll', handleStickyMenu);
  window.addEventListener('resize', generateNavMenu);
  initializePage();
});

