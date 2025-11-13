document.addEventListener("DOMContentLoaded", () => {
  const apiURL = "https://topembed.pw/api.php?format=json";
  const loadingDiv = document.getElementById("loading");
  
  // Menu Elements
  const navMenu = document.getElementById("nav-menu");
  const prioritySports = ["Football", "Basketball", "Baseball", "Tennis", "UFC", "F1", "Cricket", "Boxing", "American Football", "Ice Hockey"];

  // Category Elements
  const categoriesGrid = document.getElementById("categories-grid");
  const categoriesSection = document.getElementById("categories-section");
  const scheduleButtonWrapper = document.getElementById("schedule-btn-wrapper");

  // Sticky Menu Logic
  const stickyMenu = document.getElementById('sticky-menu');
  const mainContent = document.querySelector('main');
  // Get the initial position of the navigation bar
  const stickyPos = stickyMenu.offsetTop;

  function handleStickyMenu() {
    if (window.pageYOffset >= stickyPos) {
      stickyMenu.classList.add('sticky');
      mainContent.style.paddingTop = stickyMenu.offsetHeight + 'px';
    } else {
      stickyMenu.classList.remove('sticky');
      mainContent.style.paddingTop = '0';
    }
  }

  window.addEventListener('scroll', handleStickyMenu);

  // Show loader initially
  loadingDiv.style.display = "block";
  categoriesSection.style.display = "none";
  scheduleButtonWrapper.style.display = "none";

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

      // --- 1. DYNAMIC MENU GENERATION (Updated) ---
      const sortedByLive = Object.values(categories).sort((a, b) => b.liveCount - a.liveCount);
      let menuItems = [];
      const addedSports = new Set();
      const maxDynamicItems = 3; // Controls how many sports to show after Home and Schedule

      // Add categories with the most live matches
      sortedByLive.forEach(cat => {
        if (cat.liveCount > 0 && menuItems.length < maxDynamicItems) {
          menuItems.push(cat.name);
          addedSports.add(cat.name);
        }
      });

      // Fill remaining slots with priority sports
      prioritySports.forEach(sport => {
        if (!addedSports.has(sport) && menuItems.length < maxDynamicItems) {
          menuItems.push(sport);
        }
      });
      
      // Build the menu HTML with Home and Schedule first
      let menuHTML = `
        <li class="menu-item"><a href="/" class="active">Home</a></li>
        <li class="menu-item"><a href="/schedule/">Schedule</a></li>
      `;
      menuItems.forEach(item => {
        menuHTML += `<li class="menu-item"><a href="/schedule/?sport=${encodeURIComponent(item)}">${item}</a></li>`;
      });
      navMenu.innerHTML = menuHTML;

      // --- 2. DYNAMIC CATEGORY CARD GENERATION ---
      const allSortedCategories = Object.values(categories).sort((a, b) => b.liveCount - a.liveCount);
      categoriesGrid.innerHTML = ""; 

      if (allSortedCategories.length > 0) {
        allSortedCategories.forEach(category => {
          const categoryCard = document.createElement("a");
          categoryCard.href = `/schedule/?sport=${encodeURIComponent(category.name)}`;
          categoryCard.className = "category-card";
          let liveBadge = (category.liveCount > 0) 
            ? `<span class="live-badge">${category.liveCount} Live</span>` 
            : '';
          categoryCard.innerHTML = `
            <span class="category-name">${category.name}</span>
            ${liveBadge}
          `;
          categoriesGrid.appendChild(categoryCard);
        });
      } else {
        categoriesGrid.innerHTML = `<p>No sports categories available right now.</p>`;
      }

      // Hide loader and show content
      loadingDiv.style.display = "none";
      categoriesSection.style.display = "block";
      scheduleButtonWrapper.style.display = "block";
    })
    .catch(err => {
      loadingDiv.innerHTML = `<p style="color:red;">⚠ Error loading content.</p>`;
      console.error(err);
    });

  // Sticky ad close button
  const closeAd = document.getElementById('close-ad');
  const stickyAd = document.getElementById('sticky-footer-ad');
  if (closeAd && stickyAd) {
    closeAd.addEventListener('click', () => {
      stickyAd.style.display = 'none';
    });
  }
});
