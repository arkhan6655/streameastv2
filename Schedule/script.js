document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://topembed.pw/api.php?format=json";

  const pageTitle = document.getElementById("page-title"),
        pageHeading = document.getElementById("page-heading"),
        pageDescription = document.getElementById("page-description"),
        navMenu = document.getElementById("nav-menu"),
        statusBtns = document.querySelectorAll(".status-filters .filter-btn"),
        sportSelect = document.getElementById("sport-select"),
        liveCountSpan = document.getElementById("live-count"),
        tablePlaceholder = document.getElementById("table-placeholder"),
        matchesTable = document.getElementById("matches-table"),
        matchesBody = document.getElementById("matches-body"),
        stickyMenu = document.getElementById('sticky-menu'),
        mainContent = document.querySelector('main'),
        // Ad Elements
        closeAdBtn = document.getElementById("close-ad"),
        stickyAd = document.getElementById("sticky-footer-ad"),
        closeDesktopAdBtn = document.getElementById("close-desktop-ad"),
        desktopStickyAd = document.getElementById("desktop-sticky-ad");

  let allMatches = [];
  let state = { sport: "all", status: "all" };
  let menuData = null;
  const prioritySports = ["Football", "Basketball", "Baseball", "Tennis", "UFC", "Motorsport"];

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
    const maxDynamicItems = isMobile ? 3 : 8;
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
    let menuHTML = `<li class="menu-item"><a href="/" class="active">Home</a></li>`;
    // FIX: Encoded the item for the URL to handle spaces correctly
    menuItems.forEach(item => { menuHTML += `<li class="menu-item"><a href="/Schedule/?sport=${encodeURIComponent(item)}">${item}</a></li>`;});
    navMenu.innerHTML = menuHTML;
  }
  
  function handleURLParams() {
    // Read "?sport=" from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const sportParam = urlParams.get('sport');
    
    if (sportParam) {
        state.sport = sportParam.toLowerCase();
    } else {
        // Fallback to hash if needed, or default to "all"
        const hash = decodeURIComponent(window.location.hash.replace("#/", "").toLowerCase());
        state.sport = hash || "all";
    }

    // Update the dropdown to match
    if(sportSelect.querySelector(`option[value="${state.sport}"]`)) {
        sportSelect.value = state.sport;
    } else {
        sportSelect.value = 'all';
    }
    
    updateUI();
  }

  function updateUI() {
    renderFilteredMatches();
    updatePageMeta();
    updateActiveButtons();
    updateLiveCount();
  }
  
  function formatTime(unix) {
    return new Date(unix * 1000).toLocaleString(undefined, {
      weekday: "short", 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    });
  }

  function createAdRow() {
    const adRow = document.createElement("tr");
    adRow.className = "ad-row";
    adRow.innerHTML = `<td colspan="5">
      <div class="ad-placeholder ad-placeholder-table">
         <a href="https://amzn.to/3JDrf3v" target="_blank" rel="nofollow noopener sponsored"><img src="/amazon72890.webp"/></a>
      </div>
    </td>`;
    return adRow;
  }

  function renderFilteredMatches() {
    let filtered = allMatches;
    if (state.sport !== "all") {
      filtered = filtered.filter(m => m.sport.toLowerCase() === state.sport);
    }
    if (state.status !== "all") {
      filtered = filtered.filter(m => m.status === state.status);
    }

    matchesBody.innerHTML = "";
    
    if (filtered.length === 0) {
      matchesBody.appendChild(createAdRow());
      const noMatchRow = document.createElement('tr');
      noMatchRow.innerHTML = `<tr><td colspan="5">⚠ No matches found for this filter.</td></tr>`;
      matchesBody.appendChild(noMatchRow);
      return;
    }
    
    const fragment = document.createDocumentFragment();
    let matchRowCount = 0;

    filtered.forEach(m => {
      matchRowCount++;
      
      let badge = '';
      if (m.status === 'live') badge = '<span class="badge live"></span>';
      else if (m.status === 'finished') badge = '<span class="badge finished"></span>';
      
      const row = document.createElement("tr");
      if (m.status === 'finished') row.classList.add('finished-match');

      row.innerHTML = `
        <td>${m.time}</td>
        <td>${m.sport}</td>
        <td>${m.tournament}</td>
        <td>${m.match} ${badge}</td>
        <td><a class="watch-btn" href="${m.url}">Watch</a></td>`;
      fragment.appendChild(row);

      // Ad injection logic
      if (matchRowCount === 3 || (matchRowCount > 3 && (matchRowCount - 3) % 7 === 0)) {
        fragment.appendChild(createAdRow());
      }
    });
    matchesBody.appendChild(fragment);
  }

  function updatePageMeta() {
    const sportName = state.sport === 'all' ? 'Full Sports' : state.sport.charAt(0).toUpperCase() + state.sport.slice(1);
    const title = `Streameast V2 ${sportName} Schedule`;
    pageTitle.textContent = title;
    pageHeading.textContent = title;
    pageDescription.textContent = `See the ${sportName} schedule on streameast V2 and find your favorite match.`;
  }
  
  function updateActiveButtons() {
    statusBtns.forEach(btn => btn.classList.toggle('active', btn.id.startsWith(state.status)));
  }

  function updateLiveCount() {
    const liveMatches = allMatches.filter(match => {
      if (state.sport === 'all') {
        return match.status === 'live';
      }
      return match.status === 'live' && match.sport.toLowerCase() === state.sport;
    });
    liveCountSpan.textContent = liveMatches.length;
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

  async function initializePage() {
    setupAdEventListeners();
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
      const data = await response.json();
      
      if (!data || !data.events) throw new Error("Invalid API response format");

      const now = Math.floor(Date.now() / 1000);
      const sports = new Set();
      const tempMenuData = {};

      for (const date in data.events) {
        const eventsForDay = Array.isArray(data.events[date]) ? data.events[date] : [data.events[date]];

        eventsForDay.forEach((event, idx) => {
          const diffMinutes = (now - event.unix_timestamp) / 60;
          const sportName = event.sport ? event.sport.toLowerCase() : '';

          if (sportName === 'cricket' && diffMinutes >= 480) return;
          if (sportName !== 'cricket' && diffMinutes >= 180) return;
          
          let status;
          if (diffMinutes < 0) status = "upcoming";
          else if (diffMinutes >= 0 && diffMinutes < 150) status = "live";
          else status = "finished";

          if (event.sport && event.match && event.unix_timestamp) {
            const uniqueString = `${event.unix_timestamp}_${event.sport}_${event.match}`;
            const uniqueId = btoa(unescape(encodeURIComponent(uniqueString)));
            
            allMatches.push({
                time: formatTime(event.unix_timestamp),
                sport: event.sport,
                tournament: event.tournament || "-",
                match: event.match || "-",
                status,
                url: `/Matchinformation/?id=${uniqueId}`
            });
            
            sports.add(event.sport);
            
            if (!tempMenuData[event.sport]) tempMenuData[event.sport] = { liveCount: 0, name: event.sport };
            if (status === 'live') tempMenuData[event.sport].liveCount++;
          }
        });
      }
      
      menuData = Object.values(tempMenuData).sort((a, b) => b.liveCount - a.liveCount);
      [...sports].sort().forEach(sport => {
        sportSelect.appendChild(new Option(sport, sport.toLowerCase()));
      });
      
      statusBtns.forEach(btn => btn.addEventListener("click", (e) => { state.status = e.currentTarget.id.replace('-btn', ''); updateUI(); }));
      sportSelect.addEventListener("change", (e) => { 
    // When user changes dropdown, update URL without reloading
    const newSport = e.target.value;
    const newUrl = newSport === 'all' ? '/Schedule/' : `/Schedule/?sport=${encodeURIComponent(newSport)}`;
    window.history.pushState({path: newUrl}, '', newUrl);
    handleURLParams();
});
      window.addEventListener("popstate", handleURLParams);
      window.addEventListener('resize', generateNavMenu);
      window.addEventListener('scroll', handleStickyMenu);
      handleURLParams();
      generateNavMenu();

      tablePlaceholder.style.display = "none";
      matchesTable.style.display = "table";

    } catch (err) {
      console.error("Failed to load match data:", err);
      tablePlaceholder.style.display = "none";
      matchesTable.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">⚠ Error loading matches. The API might be temporarily unavailable or contain invalid characters.</td></tr>`;
      matchesTable.style.display = "table";
    }
  }

  initializePage();
});
