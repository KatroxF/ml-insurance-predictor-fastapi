

const API_BASE=window.location.hostname=="localhost"
?"http://127.0.0.1:8000"
:"https://your-backend-name.onrender.com"


function getToken() {
  return localStorage.getItem("access_token") || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}


function guardAuth() {
  if (!getToken()) {
    window.location.href = "login.html";
  }
}


const usersState = {
  currentPage: 1,
  totalPages: 1,
  limit: 10,
  allData: [],        
  filtered: [],       
  sortKey: null,
  sortDir: "asc",
};

const predsState = {
  currentPage: 1,
  totalPages: 1,
  limit: 10,
  allData: [],
  filtered: [],
  sortKey: null,
  sortDir: "asc",
};


let overviewChart = null;
let mainChart = null;
let smokerChart = null;
let ageChart = null;



document.addEventListener("DOMContentLoaded", () => {
  guardAuth();
  setDateBadge();
  initSidebarNav();
  initMobileMenu();
  initUserTableControls();
  initPredTableControls();
  loadOverview();           
});


function setDateBadge() {
  const el = document.getElementById("currentDate");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


function initSidebarNav() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section");
  const pageTitle = document.getElementById("pageTitle");

  const sectionTitles = {
    overview: "Overview",
    users: "Registered Users",
    predictions: "Prediction History",
    analytics: "Analytics",
  };

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const target = item.dataset.section;

      
      navItems.forEach((n) => n.classList.remove("active"));
      item.classList.add("active");

      
      if (pageTitle) pageTitle.textContent = sectionTitles[target] || target;

      
      sections.forEach((s) => s.classList.remove("active"));
      const activeSection = document.getElementById(`section-${target}`);
      if (activeSection) activeSection.classList.add("active");

      
      document.querySelector(".sidebar").classList.remove("open");

      
      if (target === "users") loadUsers(1);
      if (target === "predictions") loadPredictions(1);
      if (target === "analytics") loadAnalytics();
    });
  });
}


function initMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  if (!toggle || !sidebar) return;

  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  
  document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove("open");
    }
  });
}


async function loadOverview() {
  try {
    const res = await fetch(`${API_BASE}/stats`, { headers: authHeaders() });

    if (res.status === 401) { guardAuth(); return; }
    if (!res.ok) throw new Error("Stats fetch failed");

    const stats = await res.json();

    
    animateNumber("totalUsersNum", stats.total_users);
    animateNumber("totalPredictionsNum", stats.total_predictions);
    document.getElementById("avgPredictionNum").textContent =
      "$" + stats.avg_prediction.toLocaleString();
    document.getElementById("smokerNum").textContent =
      stats.smoker_rate + "%";

    
    drawOverviewChart(stats.trend);

  } catch (err) {
    console.error("Overview load error:", err);
    showApiError("section-overview", "Could not load overview stats. Check your connection and token.");
  }
}


function animateNumber(elId, target) {
  const el = document.getElementById(elId);
  if (!el) return;
  let start = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      el.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      el.textContent = start.toLocaleString();
    }
  }, 30);
}


function drawOverviewChart(trend) {
  const ctx = document.getElementById("overviewChart");
  if (!ctx) return;

  if (overviewChart) overviewChart.destroy();

  const labels = trend.map((_, i) => `#${i + 1}`);

  overviewChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Insurance Cost",
          data: trend,
          borderColor: "#00d4b4",
          backgroundColor: "rgba(0,212,180,0.08)",
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: "#00d4b4",
          pointBorderColor: "#0a0e1a",
          pointBorderWidth: 2,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#131c35",
          borderColor: "rgba(0,212,180,0.25)",
          borderWidth: 1,
          titleColor: "#7889aa",
          bodyColor: "#e8edf7",
          callbacks: {
            label: (ctx) => " $" + ctx.parsed.y.toLocaleString(),
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { color: "#7889aa", font: { size: 11 } },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: {
            color: "#7889aa",
            font: { size: 11 },
            callback: (v) => "$" + v.toLocaleString(),
          },
        },
      },
    },
  });
}

// ============================================================
// USERS TABLE
// ============================================================
function initUserTableControls() {
  // Search
  const searchInput = document.getElementById("userSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyUsersFilter();
      renderUsersTable();
      renderPagination("users");
    });
  }

  // Date filter
  const dateFilter = document.getElementById("userDateFilter");
  if (dateFilter) {
    dateFilter.addEventListener("change", () => {
      applyUsersFilter();
      renderUsersTable();
      renderPagination("users");
    });
  }

  // Page size
  const pageSizeSelect = document.getElementById("userPageSize");
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", (e) => {
      usersState.limit = parseInt(e.target.value);
      usersState.currentPage = 1;
      loadUsers(1);
    });
  }

  // Column sort
  document.querySelectorAll("#usersTable th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (usersState.sortKey === key) {
        usersState.sortDir = usersState.sortDir === "asc" ? "desc" : "asc";
      } else {
        usersState.sortKey = key;
        usersState.sortDir = "asc";
      }
      updateSortIcons("usersTable", key, usersState.sortDir);
      applyUsersFilter();
      renderUsersTable();
    });
  });
}

async function loadUsers(page = 1) {
  usersState.currentPage = page;

  const tbody = document.getElementById("usersTableBody");
  if (tbody) tbody.innerHTML = renderLoadingRows(5, 5);

  try {
    const res = await fetch(
      `${API_BASE}/dashboard?page=${page}&limit=${usersState.limit}`,
      { headers: authHeaders() }
    );

    if (res.status === 401) { guardAuth(); return; }
    if (res.status === 403) {
      showTableError("usersTableBody", 5, "Access denied. Admin role required.");
      return;
    }
    if (!res.ok) throw new Error("Failed to fetch users");

    const result = await res.json();

    usersState.allData = result.data;
    usersState.totalPages = Math.ceil(result.total / usersState.limit);

    applyUsersFilter();
    renderUsersTable();
    renderPagination("users");

  } catch (err) {
    console.error("Load users error:", err);
    showTableError("usersTableBody", 5, "Could not load users. Is the backend running?");
  }
}

function applyUsersFilter() {
  const query = (document.getElementById("userSearch")?.value || "").toLowerCase();
  const dateFilter = document.getElementById("userDateFilter")?.value || "all";

  let data = [...usersState.allData];

  // Search filter
  if (query) {
    data = data.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    );
  }

  // Date filter
  if (dateFilter !== "all") {
    const now = new Date();
    data = data.filter((u) => {
      if (!u.created_at) return false;
      const created = new Date(u.created_at);
      if (dateFilter === "today") {
        return created.toDateString() === now.toDateString();
      }
      if (dateFilter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return created >= weekAgo;
      }
      if (dateFilter === "month") {
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }

  // Sort
  if (usersState.sortKey) {
    data.sort((a, b) => {
      let valA = a[usersState.sortKey];
      let valB = b[usersState.sortKey];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return usersState.sortDir === "asc" ? -1 : 1;
      if (valA > valB) return usersState.sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  usersState.filtered = data;
}

function renderUsersTable() {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  const data = usersState.filtered;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>No users found</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((user) => {
      const createdAt = user.created_at
        ? new Date(user.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "—";

      return `
        <tr>
          <td><span class="id-badge">#${user.id}</span></td>
          <td>${escapeHtml(user.username)}</td>
          <td>${escapeHtml(user.email)}</td>
          <td>${createdAt}</td>
          <td><span class="status-active">Active</span></td>
        </tr>`;
    })
    .join("");
}


function initPredTableControls() {
  
  const searchInput = document.getElementById("predSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyPredsFilter();
      renderPredsTable();
      renderPagination("predictions");
    });
  }

  
  const smokerFilter = document.getElementById("smokerFilter");
  if (smokerFilter) {
    smokerFilter.addEventListener("change", () => {
      applyPredsFilter();
      renderPredsTable();
      renderPagination("predictions");
    });
  }

  
  const ageFilter = document.getElementById("predAgeFilter");
  if (ageFilter) {
    ageFilter.addEventListener("change", () => {
      applyPredsFilter();
      renderPredsTable();
      renderPagination("predictions");
    });
  }

  
  const pageSizeSelect = document.getElementById("predPageSize");
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", (e) => {
      predsState.limit = parseInt(e.target.value);
      predsState.currentPage = 1;
      loadPredictions(1);
    });
  }

  
  document.querySelectorAll("#predictionsTable th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (predsState.sortKey === key) {
        predsState.sortDir = predsState.sortDir === "asc" ? "desc" : "asc";
      } else {
        predsState.sortKey = key;
        predsState.sortDir = "asc";
      }
      updateSortIcons("predictionsTable", key, predsState.sortDir);
      applyPredsFilter();
      renderPredsTable();
    });
  });
}

async function loadPredictions(page = 1) {
  predsState.currentPage = page;

  const tbody = document.getElementById("predictionsTableBody");
  if (tbody) tbody.innerHTML = renderLoadingRows(7, 8);

  try {
    const res = await fetch(
      `${API_BASE}/predictions?page=${page}&limit=${predsState.limit}`,
      { headers: authHeaders() }
    );

    if (res.status === 401) { guardAuth(); return; }
    if (res.status === 403) {
      showTableError("predictionsTableBody", 7, "Access denied. Admin role required.");
      return;
    }
    if (!res.ok) throw new Error("Failed to fetch predictions");

    const result = await res.json();

    predsState.allData = result.data;
    predsState.totalPages = Math.ceil(result.total / predsState.limit);

    applyPredsFilter();
    renderPredsTable();
    renderPagination("predictions");

  } catch (err) {
    console.error("Load predictions error:", err);
    showTableError("predictionsTableBody", 7, "Could not load predictions. Add the /predictions endpoint to your FastAPI.");
  }
}

function applyPredsFilter() {
  const query = (document.getElementById("predSearch")?.value || "").toLowerCase();
  const smokerVal = document.getElementById("smokerFilter")?.value || "all";
  const ageVal = document.getElementById("predAgeFilter")?.value || "all";

  let data = [...predsState.allData];

  
  if (query) {
    data = data.filter((p) => String(p.user_id).includes(query));
  }

  
  if (smokerVal === "yes") data = data.filter((p) => p.smoker_encoded === 1);
  if (smokerVal === "no") data = data.filter((p) => p.smoker_encoded === 0);

  
  if (ageVal !== "all") {
    const [minStr, maxStr] = ageVal.split("-");
    const min = parseInt(minStr);
    const max = maxStr ? parseInt(maxStr) : Infinity;
    if (ageVal === "60+") {
      data = data.filter((p) => p.age >= 60);
    } else {
      data = data.filter((p) => p.age >= min && p.age <= max);
    }
  }

  
  if (predsState.sortKey) {
    data.sort((a, b) => {
      const valA = a[predsState.sortKey];
      const valB = b[predsState.sortKey];
      if (valA < valB) return predsState.sortDir === "asc" ? -1 : 1;
      if (valA > valB) return predsState.sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  predsState.filtered = data;
}

function renderPredsTable() {
  const tbody = document.getElementById("predictionsTableBody");
  if (!tbody) return;

  const data = predsState.filtered;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <p>No predictions found</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((p) => {
      const smokerClass = p.smoker_encoded === 1 ? "smoker-yes" : "smoker-no";
      const smokerLabel = p.smoker_encoded === 1 ? "Yes" : "No";
      return `
        <tr>
          <td><span class="id-badge">#${p.id}</span></td>
          <td>${p.user_id}</td>
          <td>${p.age}</td>
          <td>${p.bmi.toFixed(1)}</td>
          <td>${p.children}</td>
          <td><span class="smoker-badge ${smokerClass}">${smokerLabel}</span></td>
          <td><span class="prediction-val">$${p.prediction.toLocaleString()}</span></td>
        </tr>`;
    })
    .join("");
}


function renderPagination(type) {
  const isUsers = type === "users";
  const state = isUsers ? usersState : predsState;
  const loadFn = isUsers ? loadUsers : loadPredictions;
  const containerId = isUsers ? "usersPagination" : "predictionsPagination";
  const dataLen = state.filtered.length;
  const totalCount = state.allData.length;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  
  const infoEl = document.createElement("div");
  infoEl.className = "pagination-info";
  const start = dataLen === 0 ? 0 : (state.currentPage - 1) * state.limit + 1;
  const end = Math.min(state.currentPage * state.limit, totalCount);
  infoEl.textContent = `Showing ${start}–${end} of ${totalCount} entries`;
  container.appendChild(infoEl);

  
  const btnsWrap = document.createElement("div");
  btnsWrap.className = "pagination-buttons";

  
  const prevBtn = document.createElement("button");
  prevBtn.className = "page-btn";
  prevBtn.textContent = "Prev";
  prevBtn.disabled = state.currentPage === 1;
  prevBtn.addEventListener("click", () => loadFn(state.currentPage - 1));
  btnsWrap.appendChild(prevBtn);

  
  const pages = buildPageRange(state.currentPage, state.totalPages);

  pages.forEach((p) => {
    if (p === "...") {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      ellipsis.style.cssText = "color: var(--text-muted); padding: 0 4px; display:flex; align-items:center;";
      btnsWrap.appendChild(ellipsis);
    } else {
      const btn = document.createElement("button");
      btn.className = "page-btn" + (p === state.currentPage ? " active" : "");
      btn.textContent = p;
      btn.addEventListener("click", () => loadFn(p));
      btnsWrap.appendChild(btn);
    }
  });

  
  const nextBtn = document.createElement("button");
  nextBtn.className = "page-btn";
  nextBtn.textContent = "Next";
  nextBtn.disabled = state.currentPage === state.totalPages || state.totalPages === 0;
  nextBtn.addEventListener("click", () => loadFn(state.currentPage + 1));
  btnsWrap.appendChild(nextBtn);

  container.appendChild(btnsWrap);
}


function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}


async function loadAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/stats`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Stats fetch failed");
    const stats = await res.json();

    
    drawMainChart(stats.trend, "line");
    drawSmokerChart(stats.smoker_count, stats.non_smoker_count);

    
    await loadAgeDistribution();

    
    const chartTypeSelect = document.getElementById("chartTypeSelect");
    if (chartTypeSelect) {
      chartTypeSelect.addEventListener("change", (e) => {
        drawMainChart(stats.trend, e.target.value);
      });
    }

  } catch (err) {
    console.error("Analytics error:", err);
  }
}

async function loadAgeDistribution() {
  try {
    
    const res = await fetch(`${API_BASE}/predictions?page=1&limit=100`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const result = await res.json();
    const ageBuckets = { "18-30": 0, "31-45": 0, "46-60": 0, "60+": 0 };
    result.data.forEach((p) => {
      if (p.age <= 30) ageBuckets["18-30"]++;
      else if (p.age <= 45) ageBuckets["31-45"]++;
      else if (p.age <= 60) ageBuckets["46-60"]++;
      else ageBuckets["60+"]++;
    });
    drawAgeChart(ageBuckets);
  } catch (err) {
    drawAgeChart({ "18-30": 0, "31-45": 0, "46-60": 0, "60+": 0 });
  }
}


function drawMainChart(trend, type) {
  const ctx = document.getElementById("mainChart");
  if (!ctx) return;
  if (mainChart) mainChart.destroy();

  const labels = trend.map((_, i) => `Entry ${i + 1}`);
  const color = type === "bar" ? "rgba(0,212,180,0.6)" : "#00d4b4";

  mainChart = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [
        {
          label: "Prediction Cost",
          data: trend,
          borderColor: "#00d4b4",
          backgroundColor: color,
          borderWidth: type === "line" ? 2 : 0,
          borderRadius: type === "bar" ? 6 : 0,
          tension: 0.4,
          fill: type === "line",
          pointRadius: type === "line" ? 4 : 0,
          pointBackgroundColor: "#00d4b4",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#131c35",
          borderColor: "rgba(0,212,180,0.25)",
          borderWidth: 1,
          titleColor: "#7889aa",
          bodyColor: "#e8edf7",
          callbacks: {
            label: (ctx) => " $" + ctx.parsed.y.toLocaleString(),
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { color: "#7889aa", maxTicksLimit: 10 },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: {
            color: "#7889aa",
            callback: (v) => "$" + v.toLocaleString(),
          },
        },
      },
    },
  });
}


function drawSmokerChart(smokers, nonSmokers) {
  const ctx = document.getElementById("smokerChart");
  if (!ctx) return;
  if (smokerChart) smokerChart.destroy();

  smokerChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Smoker", "Non-Smoker"],
      datasets: [
        {
          data: [smokers, nonSmokers],
          backgroundColor: [
            "rgba(251,113,133,0.75)",
            "rgba(0,212,180,0.6)",
          ],
          borderColor: ["#fb7185", "#00d4b4"],
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#7889aa",
            font: { size: 12 },
            padding: 16,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: "#131c35",
          borderColor: "rgba(0,212,180,0.25)",
          borderWidth: 1,
          titleColor: "#7889aa",
          bodyColor: "#e8edf7",
        },
      },
    },
  });
}


function drawAgeChart(buckets) {
  const ctx = document.getElementById("ageChart");
  if (!ctx) return;
  if (ageChart) ageChart.destroy();

  ageChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(buckets),
      datasets: [
        {
          label: "Users",
          data: Object.values(buckets),
          backgroundColor: [
            "rgba(79,142,247,0.6)",
            "rgba(167,139,250,0.6)",
            "rgba(251,191,36,0.6)",
            "rgba(251,113,133,0.6)",
          ],
          borderColor: [
            "#4f8ef7",
            "#a78bfa",
            "#fbbf24",
            "#fb7185",
          ],
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#131c35",
          borderColor: "rgba(0,212,180,0.25)",
          borderWidth: 1,
          titleColor: "#7889aa",
          bodyColor: "#e8edf7",
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#7889aa" },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { color: "#7889aa", stepSize: 1 },
          beginAtZero: true,
        },
      },
    },
  });
}


function updateSortIcons(tableId, activeKey, dir) {
  document.querySelectorAll(`#${tableId} th.sortable`).forEach((th) => {
    th.classList.remove("sorted-asc", "sorted-desc");
    if (th.dataset.sort === activeKey) {
      th.classList.add(dir === "asc" ? "sorted-asc" : "sorted-desc");
    }
  });
}

function renderLoadingRows(cols, rows) {
  return Array.from({ length: rows })
    .map(
      () => `
      <tr>
        ${Array.from({ length: cols })
          .map(
            () => `
          <td>
            <div style="height:14px; background:rgba(255,255,255,0.06);
              border-radius:4px; animation: pulse 1.5s infinite;"></div>
          </td>`
          )
          .join("")}
      </tr>`
    )
    .join("");
}


function showTableError(tbodyId, cols, message) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = `
    <tr>
      <td colspan="${cols}">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p>${escapeHtml(message)}</p>
        </div>
      </td>
    </tr>`;
}


function showApiError(sectionId, message) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const banner = document.createElement("div");
  banner.style.cssText = `
    background: rgba(251,113,133,0.1);
    border: 1px solid rgba(251,113,133,0.3);
    color: #fb7185;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.875rem;
    margin-bottom: 20px;
  `;
  banner.textContent = message;
  section.insertBefore(banner, section.querySelector(".stat-grid") || section.children[1]);
}


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
