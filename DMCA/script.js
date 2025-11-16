document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://topembed.pw/api.php?format=json";

  // --- DOM Element References ---
  const navMenu = document.getElementById("nav-menu"),
        stickyMenu = document.getElementById('sticky-menu'),
        mainContent = document.querySelector('main'),
        // Ad Elements
        closeAdBtn = document.getElementById("close-ad"),
        stickyAd = document.getElementById("sticky-footer-ad"),
        closeDesktopAdBtn = document.getElementById("close-desktop-ad"),
        desktopStickyAd = document.getElementById("desktop-sticky-ad");

  let menuData = null;
  const prioritySports = ["Football", "Basketball", "Baseball", "Tennis", "UFC", "F1"];
  const stickyPos = stickyMenu.offsetTop;

  // --- MENU & STICKY HEADER LOGIC ---
  function handleStickyMenu() {
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
    if (!menuData) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const maxDynamicItems = isMobile ? 3 : 7;
    const menuItems = new Set();

    menuData.forEach(cat => {
      if (cat.liveCount > 0 && menuItems.size < maxDynamicItems) {
        menuItems.add(cat.name);
      }
    });
    
    prioritySports.forEach(sport => {
      if (menuItems.size < maxDynamicItems) menuItems.add(sport);
    });
    
    let menuHTML = `<li class="menu-item"><a href="/">Home</a></li><li class="menu-item"><a href="/Schedule/">Schedule</a></li>`;
    menuItems.forEach(item => { 
      menuHTML += `<li class="menu-item"><a href="/Schedule/#/${encodeURIComponent(item)}">${item}</a></li>`; 
    });
    navMenu.innerHTML = menuHTML;
  }
  
  // --- AD EVENT LISTENERS ---
  function setupAdEventListeners() {
    if (closeAdBtn && stickyAd) {
      closeAdBtn.addEventListener("click", () => { stickyAd.style.display = "none"; });
    }
    if (closeDesktopAdBtn && desktopStickyAd) {
      closeDesktopAdBtn.addEventListener("click", () => { desktopStickyAd.style.display = "none"; });
    }
  }

  // --- INITIALIZATION ---
  async function initializePage() {
    setupAdEventListeners();
    // Discord widget function is not called on this page

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      if (!data || !data.events) return;

      const now = Math.floor(Date.now() / 1000);
      const tempMenuData = {};

      for (const date in data.events) {
        data.events[date].forEach(event => {
          if (event.sport) {
            const diffMinutes = (now - event.unix_timestamp) / 60;
            const isLive = diffMinutes >= 0 && diffMinutes < 150;
            if (!tempMenuData[event.sport]) tempMenuData[event.sport] = { liveCount: 0, name: event.sport };
            if (isLive) tempMenuData[event.sport].liveCount++;
          }
        });
      }
      menuData = Object.values(tempMenuData).sort((a, b) => b.liveCount - a.liveCount);
      generateNavMenu();

    } catch (err) {
      console.error("Could not fetch live sports data for menu:", err);
      // Generate a fallback menu if API fails
      let menuHTML = `<li class="menu-item"><a href="/">Home</a></li><li class="menu-item"><a href="/schedule/">Schedule</a></li>`;
      prioritySports.slice(0,5).forEach(item => { 
        menuHTML += `<li class="menu-item"><a href="/schedule/#/${encodeURIComponent(item)}">${item}</a></li>`; 
      });
      navMenu.innerHTML = menuHTML;
    }
  }
  
  window.addEventListener('scroll', handleStickyMenu);
  window.addEventListener('resize', generateNavMenu);
  initializePage();

});
