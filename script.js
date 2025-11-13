document.addEventListener("DOMContentLoaded", () => {
  const apiURL = "https://topembed.pw/api.php?format=json";
  const loadingDiv = document.getElementById("loading");
  
  const navMenu = document.getElementById("nav-menu");
  const prioritySports = ["Football", "Basketball", "Baseball", "Tennis", "UFC", "F1", "Cricket", "Boxing", "American Football", "Ice Hockey"];

  const categoriesGrid = document.getElementById("categories-grid");
  const categoriesSection = document.getElementById("categories-section");
  const scheduleButtonWrapper = document.getElementById("schedule-btn-wrapper");

  const stickyMenu = document.getElementById('sticky-menu');
  const mainContent = document.querySelector('main');
  const stickyPos = stickyMenu.offsetTop;

  let sportsData = null; // Variable to store fetched API data

  function handleStickyMenu() {
    if (window.pageYOffset >= stickyPos) {
      stickyMenu.classList.add('sticky');
      mainContent.style.paddingTop = stickyMenu.offsetHeight + 'px';
    } else {
      stickyMenu.classList.remove('sticky');
      mainContent.style.paddingTop = '0';
    }
  }

  // --- REBUILDS THE MENU BASED ON SCREEN SIZE ---
  function generateNavMenu() {
    if (!sportsData) return; // Don't run if data isn't fetched yet

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const maxDynamicItems = isMobile ? 3 : 8; // 3 for mobile, 8 for desktop

    let menuItems = [];
    const addedSports = new Set();
    
    // Prioritize sports with live matches
    sportsData.sortedByLive.forEach(cat => {
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
    
    // Build menu HTML with a special class for the schedule item
    let menuHTML = `
      <li class="menu-item"><a href="/" class="active">Home</a></li>
      <li class="menu-item schedule-item"><a href="/schedule/">Schedule</a></li>
    `;
    menuItems.forEach(item => {
      menuHTML += `<li class="menu-item"><a href="/schedule/?sport=${encodeURIComponent(item)}">${item}</a></li>`;
    });
    
    navMenu.innerHTML = menuHTML;
  }

  // --- FETCHES DATA ONCE AND THEN BUILDS THE PAGE ---
  function initializePage() {
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

        // Store sorted data globally for reuse
        sportsData = {
          sortedByLive: Object.values(categories).sort((a, b) => b.liveCount - a.liveCount)
        };
        
        // Build the menu for the first time
        generateNavMenu();

        // Generate category cards
        categoriesGrid.innerHTML = ""; 
        if (sportsData.sortedByLive.length > 0) {
          sportsData.sortedByLive.forEach(category => {
            const categoryCard = document.createElement("a");
            categoryCard.href = `/schedule/?sport=${encodeURIComponent(category.name)}`;
            categoryCard.className = "category-card";
            let liveBadge = (category.liveCount > 0) ? `<span class="live-badge">${category.liveCount} Live</span>` : '';
            categoryCard.innerHTML = `<span class="category-name">${category.name}</span>${liveBadge}`;
            categoriesGrid.appendChild(categoryCard);
          });
        } else {
          categoriesGrid.innerHTML = `<p>No sports categories available right now.</p>`;
        }

        loadingDiv.style.display = "none";
        categoriesSection.style.display = "block";
        scheduleButtonWrapper.style.display = "block";
      })
      .catch(err => {
        loadingDiv.innerHTML = `<p style="color:red;">⚠ Error loading content.</p>`;
        console.error(err);
      });
  }

  window.addEventListener('scroll', handleStickyMenu);
  // Re-run menu generation on resize to switch between mobile/desktop layouts
  window.addEventListener('resize', generateNavMenu);

  initializePage();
});
