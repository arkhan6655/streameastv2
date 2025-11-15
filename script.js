document.addEventListener("DOMContentLoaded", () => {
  const apiURL = "https://topembed.pw/api.php?format=json";
  
  const categoriesPlaceholder = document.getElementById("categories-placeholder");
  const categoriesGrid = document.getElementById("categories-grid");
  
  const navMenu = document.getElementById("nav-menu");
  const prioritySports = ["Football", "Basketball", "Baseball", "Tennis", "UFC", "F1", "Cricket", "Boxing", "American Football", "Ice Hockey"];
  const categoriesSection = document.getElementById("categories-section");
  const scheduleButtonWrapper = document.getElementById("schedule-btn-wrapper");

  const stickyMenu = document.getElementById('sticky-menu');
  const mainContent = document.querySelector('main');
  const stickyPos = stickyMenu.offsetTop;

  // Ad Elements
  const closeAdBtn = document.getElementById("close-ad"),
        stickyAd = document.getElementById("sticky-footer-ad"),
        closeDesktopAdBtn = document.getElementById("close-desktop-ad"),
        desktopStickyAd = document.getElementById("desktop-sticky-ad");

  let sportsData = null;

  function handleStickyMenu() {
    if (window.pageYOffset >= stickyPos) {
      stickyMenu.classList.add('sticky');
      mainContent.style.paddingTop = stickyMenu.offsetHeight + 'px';
    } else {
      stickyMenu.classList.remove('sticky');
      mainContent.style.paddingTop = '0';
    }
  }

  function generateNavMenu() {
    if (!sportsData) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const maxDynamicItems = isMobile ? 3 : 8;
    let menuItems = [];
    const addedSports = new Set();
    
    sportsData.sortedByLive.forEach(cat => {
      if (cat.liveCount > 0 && menuItems.length < maxDynamicItems) {
        menuItems.push(cat.name);
        addedSports.add(cat.name);
      }
    });
    
    prioritySports.forEach(sport => {
      if (!addedSports.has(sport) && menuItems.length < maxDynamicItems) {
        menuItems.push(sport);
      }
    });
    
    let menuHTML = `<li class="menu-item schedule-item"><a href="/schedule/">Schedule</a></li>`;
    menuItems.forEach(item => {
      menuHTML += `<li class="menu-item"><a href="/Schedule/#/${encodeURIComponent(item)}">${item}</a></li>`;
    });
    navMenu.innerHTML = menuHTML;
  }

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

  function initializePage() {
    setupAdEventListeners(); // Set up ad listeners right away
    
    fetch(apiURL)
      .then(res => res.json())
      .then(data => {
        const now = Math.floor(Date.now() / 1000);
        const categories = {};

        if (data.events) {
          for (const date in data.events) {
            data.events[date].forEach(event => {
              const sport = event.sport;
              if (!sport) return;
              if (!categories[sport]) {
                categories[sport] = { liveCount: 0, name: sport };
              }
              
              const diffMinutes = (now - event.unix_timestamp) / 60;
              
              if (diffMinutes >= 0 && diffMinutes < 150) {
                categories[sport].liveCount++;
              }
            });
          }
        }
        
        sportsData = { sortedByLive: Object.values(categories).sort((a, b) => b.liveCount - a.liveCount) };
        generateNavMenu();

        categoriesGrid.innerHTML = ""; 
        if (sportsData.sortedByLive.length > 0) {
          sportsData.sortedByLive.forEach(category => {
            const categoryCard = document.createElement("a");
            categoryCard.href = `/Schedule/#/${encodeURIComponent(category.name)}`;
            categoryCard.className = "category-card";
            let liveBadge = (category.liveCount > 0) ? `<span class="live-badge">${category.liveCount} Live</span>` : '';
            categoryCard.innerHTML = `<span class="category-name">${category.name}</span>${liveBadge}`;
            categoriesGrid.appendChild(categoryCard);
          });
        } else {
          categoriesGrid.innerHTML = `<p>No sports categories available right now.</p>`;
        }

        categoriesPlaceholder.style.display = 'none';
        categoriesGrid.style.display = 'grid';
        scheduleButtonWrapper.style.display = 'block';
      })
      .catch(err => {
        categoriesPlaceholder.style.display = 'none';
        categoriesSection.innerHTML = `<p style="color:red; text-align: center;">⚠ Error loading content. Please try again later.</p>`;
        console.error(err);
      });
  }

  window.addEventListener('scroll', handleStickyMenu);
  window.addEventListener('resize', generateNavMenu);
  initializePage();
});
