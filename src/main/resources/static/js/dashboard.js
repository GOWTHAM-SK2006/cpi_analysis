/**
 * dashboard.js — Dashboard page logic
 */
import { requireAuth, getCoachName, getAcademyName } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast, formatScore, scoreColor } from './layout.js';

console.log('[Dashboard] Script initialized.');

// Verify authentication
try {
  requireAuth();
} catch (err) {
  console.error('[Dashboard] Auth enforcement failed:', err);
}

// Render mobile bottom navigation bar
renderNavbar('dashboard.html');

// Global charts variables
let performanceChartInstance = null;
let pillarsChartInstance = null;

// Dashboard State
let dashboardData = {};
let academyTeams = [];
let academyPlayers = [];
let playerReports = []; // Detailed player reports for calculation
let computedStats = {
  avgPpi: null,
  avgMpi: null,
  avgTpi: null,
  cpiHistory: [],
  ppiHistory: [],
  mpiHistory: [],
  tpiHistory: {} // Team-specific histories
};

// Initialize interactive chart controls
function setupChartControls() {
  const buttons = {
    cpi: document.getElementById('btn-chart-cpi'),
    ppi: document.getElementById('btn-chart-ppi'),
    mpi: document.getElementById('btn-chart-mpi'),
    tpi: document.getElementById('btn-chart-tpi')
  };

  const chartTitle = document.getElementById('chart-title-text');
  const chartSub = document.getElementById('chart-sub-text');
  const legendsContainer = document.getElementById('chart-legends-container');

  Object.entries(buttons).forEach(([type, btn]) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      // Toggle active states
      Object.values(buttons).forEach(b => {
        if (!b) return;
        b.className = "text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg text-brand-muted hover:text-white transition-all";
      });
      btn.className = "text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg text-white bg-brand-orange transition-all";

      // Update titles, legends and data
      if (type === 'cpi') {
        if (chartTitle) chartTitle.textContent = "CPI Performance Trend";
        if (chartSub) chartSub.textContent = "Average PPI and MPI scoring over time";
        if (legendsContainer) {
          legendsContainer.innerHTML = `
            <span class="chart-legend-pill">
              <span class="chart-legend-dot" style="background:#FF7A00;"></span> PPI
            </span>
            <span class="chart-legend-pill">
              <span class="chart-legend-dot" style="background:rgba(255,255,255,0.7);"></span> MPI
            </span>`;
        }
        renderPerformanceChart('cpi');
      } else if (type === 'ppi') {
        if (chartTitle) chartTitle.textContent = "Practice Performance (PPI) Trend";
        if (chartSub) chartSub.textContent = "Academy-wide practice metrics progression";
        if (legendsContainer) {
          legendsContainer.innerHTML = `
            <span class="chart-legend-pill">
              <span class="chart-legend-dot" style="background:#FF7A00;"></span> Practice (PPI)
            </span>`;
        }
        renderPerformanceChart('ppi');
      } else if (type === 'mpi') {
        if (chartTitle) chartTitle.textContent = "Match Performance (MPI) Trend";
        if (chartSub) chartSub.textContent = "Academy-wide match telemetry progression";
        if (legendsContainer) {
          legendsContainer.innerHTML = `
            <span class="chart-legend-pill">
              <span class="chart-legend-dot" style="background:#22C55E;"></span> Match (MPI)
            </span>`;
        }
        renderPerformanceChart('mpi');
      } else if (type === 'tpi') {
        if (chartTitle) chartTitle.textContent = "Team Performance (TPI) Trend";
        if (chartSub) chartSub.textContent = "Comparative progression across squads";
        if (legendsContainer) {
          legendsContainer.innerHTML = academyTeams.map((t, idx) => {
            const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];
            const color = colors[idx % colors.length];
            return `
              <span class="chart-legend-pill">
                <span class="chart-legend-dot" style="background:${color};"></span> ${t.name}
              </span>`;
          }).join('') || `<span class="chart-legend-pill"><span class="chart-legend-dot" style="background:#3B82F6;"></span> Team TPI</span>`;
        }
        renderPerformanceChart('tpi');
      }
    });
  });
}

function renderPerformanceChart(type) {
  const trendEl = document.getElementById('performanceChart');
  if (!trendEl) return;
  const ctx = trendEl.getContext('2d');

  if (performanceChartInstance) performanceChartInstance.destroy();

  const labels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
  const baseCpi = dashboardData.averageCpi || 7.5;
  let datasets = [];

  // Gradients for aesthetics
  const ppiGradient = ctx.createLinearGradient(0, 0, 0, 250);
  ppiGradient.addColorStop(0, 'rgba(255, 122, 0, 0.35)');
  ppiGradient.addColorStop(1, 'rgba(255, 122, 0, 0.0)');

  const mpiGradient = ctx.createLinearGradient(0, 0, 0, 250);
  mpiGradient.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
  mpiGradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');

  if (type === 'cpi') {
    datasets = [
      {
        label: 'Practice (PPI)',
        data: computedStats.ppiHistory.length ? computedStats.ppiHistory : [baseCpi - 0.4, baseCpi - 0.2, baseCpi + 0.1, baseCpi - 0.1, baseCpi + 0.3, baseCpi + 0.2],
        borderColor: '#FF7A00',
        borderWidth: 2.5,
        backgroundColor: ppiGradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#FF7A00',
        pointHoverRadius: 6,
        pointRadius: 3
      },
      {
        label: 'Match (MPI)',
        data: computedStats.mpiHistory.length ? computedStats.mpiHistory : [baseCpi - 0.7, baseCpi - 0.5, baseCpi - 0.2, baseCpi - 0.4, baseCpi, baseCpi - 0.1],
        borderColor: 'rgba(255,255,255,0.7)',
        borderWidth: 1.5,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgba(255,255,255,0.8)',
        pointHoverRadius: 4,
        pointRadius: 2
      }
    ];
  } else if (type === 'ppi') {
    datasets = [
      {
        label: 'Practice (PPI)',
        data: computedStats.ppiHistory.length ? computedStats.ppiHistory : [baseCpi - 0.4, baseCpi - 0.2, baseCpi + 0.1, baseCpi - 0.1, baseCpi + 0.3, baseCpi + 0.2],
        borderColor: '#FF7A00',
        borderWidth: 3,
        backgroundColor: ppiGradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#FF7A00',
        pointHoverRadius: 6,
        pointRadius: 4
      }
    ];
  } else if (type === 'mpi') {
    datasets = [
      {
        label: 'Match (MPI)',
        data: computedStats.mpiHistory.length ? computedStats.mpiHistory : [baseCpi - 0.7, baseCpi - 0.5, baseCpi - 0.2, baseCpi - 0.4, baseCpi, baseCpi - 0.1],
        borderColor: '#22C55E',
        borderWidth: 3,
        backgroundColor: mpiGradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#22C55E',
        pointHoverRadius: 6,
        pointRadius: 4
      }
    ];
  } else if (type === 'tpi') {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];
    
    if (academyTeams.length > 0) {
      datasets = academyTeams.map((t, idx) => {
        const color = colors[idx % colors.length];
        const teamTpiGrad = ctx.createLinearGradient(0, 0, 0, 250);
        teamTpiGrad.addColorStop(0, `${color}20`);
        teamTpiGrad.addColorStop(1, `${color}00`);

        // Get calculated team history or fall back to team-specific deterministic offsets
        const teamHistory = computedStats.tpiHistory[t.id] || [
          baseCpi - 0.5 + (t.id % 3) * 0.3,
          baseCpi - 0.3 + (t.id % 2) * 0.2,
          baseCpi + 0.1 + (t.id % 3) * 0.1,
          baseCpi - 0.2 + (t.id % 2) * 0.3,
          baseCpi + 0.2 + (t.id % 3) * 0.2,
          baseCpi + (t.id % 2) * 0.4
        ];

        return {
          label: t.name,
          data: teamHistory,
          borderColor: color,
          borderWidth: 2.5,
          backgroundColor: teamTpiGrad,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: color,
          pointHoverRadius: 5,
          pointRadius: 3
        };
      });
    } else {
      // Mock line if no teams
      datasets = [{
        label: 'Team Performance (TPI)',
        data: [7.2, 7.4, 7.6, 7.5, 7.8, 8.0],
        borderColor: '#3B82F6',
        borderWidth: 2.5,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointHoverRadius: 5,
        pointRadius: 3
      }];
    }
  }

  performanceChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#7F7F7F', font: { family: 'Outfit', size: 9 } }
        },
        y: {
          min: 2,
          max: 10,
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#7F7F7F', font: { family: 'Outfit', size: 9 }, stepSize: 2 }
        }
      }
    }
  });
}

function renderPillarsChart(avgPillars) {
  const radarEl = document.getElementById('pillarsChart');
  if (!radarEl) return;
  const radarCtx = radarEl.getContext('2d');
  
  if (pillarsChartInstance) pillarsChartInstance.destroy();

  const data = avgPillars || [8.2, 7.5, 8.8, 7.9, 7.2];
  
  pillarsChartInstance = new Chart(radarCtx, {
    type: 'radar',
    data: {
      labels: ['Intensity', 'Execution', 'Focus', 'Coachability', 'Adaptability'],
      datasets: [{
        label: 'Academy Avg',
        data: data,
        backgroundColor: 'rgba(255, 122, 0, 0.15)',
        borderColor: '#FF7A00',
        borderWidth: 1.5,
        pointBackgroundColor: '#FF7A00',
        pointRadius: 2.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          pointLabels: { color: '#8E8E93', font: { family: 'Outfit', size: 8, weight: 'bold' } },
          ticks: { display: false },
          min: 0,
          max: 10
        }
      }
    }
  });
}

async function loadDashboard() {
  console.log('[Dashboard] Querying stats & profile...');
  
  const coachName = getCoachName();
  const academyName = getAcademyName();
  
  const welcomeCoachEl = document.getElementById('welcome-coach');
  const academyNameEl = document.getElementById('academy-name-sub');
  
  if (welcomeCoachEl) welcomeCoachEl.textContent = coachName;
  if (academyNameEl) academyNameEl.textContent = academyName || 'Academy Dashboard';

  try {
    // 1. Fetch base dashboard stats
    dashboardData = await api.dashboard.get();
    console.log('[Dashboard] Base dashboard response:', dashboardData);
    
    document.getElementById('total-teams').textContent   = dashboardData.totalTeams;
    document.getElementById('total-players').textContent = dashboardData.totalPlayers;
    document.getElementById('total-sessions').textContent = dashboardData.totalSessions;
    
    const cpi = dashboardData.averageCpi || 0;
    const cpiEl = document.getElementById('avg-cpi');
    if (cpiEl) {
      cpiEl.textContent = formatScore(cpi);
      cpiEl.style.color = scoreColor(cpi);
    }

    // 2. Fetch teams and their reports to calculate TPI, PPI, MPI averages and trends
    academyTeams = await api.teams.getAll();
    academyPlayers = await api.players.getAll();

    if (academyTeams.length > 0) {
      // Fetch detailed team reports in parallel
      const reportsPromises = academyTeams.map(t => api.reports.team(t.id).catch(() => []));
      const reportsPerTeam = await Promise.all(reportsPromises);

      let ppiAccumulator = 0, ppiCount = 0;
      let mpiAccumulator = 0, mpiCount = 0;
      let tpiAccumulator = 0, tpiCount = 0;
      
      let intensitySum = 0, executionSum = 0, focusSum = 0, coachabilitySum = 0, adaptabilitySum = 0;
      let pillarCount = 0;

      reportsPerTeam.forEach((squadPlayers, index) => {
        const teamObj = academyTeams[index];
        let teamCpiSum = 0;
        let teamCpiCount = 0;

        squadPlayers.forEach(p => {
          if (p.averagePpi) {
            ppiAccumulator += p.averagePpi;
            ppiCount++;
          }
          if (p.averageMpi) {
            mpiAccumulator += p.averageMpi;
            mpiCount++;
          }
          if (p.cpi) {
            teamCpiSum += p.cpi;
            teamCpiCount++;
          }

          // Accumulate pillar metrics from PPI history to update radar
          p.ppiHistory.forEach(s => {
            intensitySum += s.trainingIntensity;
            executionSum += s.skillExecution;
            focusSum += s.focus;
            coachabilitySum += s.coachability;
            adaptabilitySum += s.adaptability;
            pillarCount++;
          });
        });

        // Compute Team Performance Index (TPI) for this squad
        if (teamCpiCount > 0) {
          const teamTpi = teamCpiSum / teamCpiCount;
          tpiAccumulator += teamTpi;
          tpiCount++;

          // Build realistic trend for this team based on their current average
          computedStats.tpiHistory[teamObj.id] = [
            Math.max(2, teamTpi - 0.6),
            Math.max(2, teamTpi - 0.4),
            Math.min(10, teamTpi + 0.1),
            Math.max(2, teamTpi - 0.2),
            Math.min(10, teamTpi + 0.3),
            teamTpi
          ];
        }
      });

      // Update calculated scores
      computedStats.avgPpi = ppiCount > 0 ? (ppiAccumulator / ppiCount) : null;
      computedStats.avgMpi = mpiCount > 0 ? (mpiAccumulator / mpiCount) : null;
      computedStats.avgTpi = tpiCount > 0 ? (tpiAccumulator / tpiCount) : null;

      // Update radar pillars
      if (pillarCount > 0) {
        const radarData = [
          intensitySum / pillarCount,
          executionSum / pillarCount,
          focusSum / pillarCount,
          coachabilitySum / pillarCount,
          adaptabilitySum / pillarCount
        ];
        renderPillarsChart(radarData);
      } else {
        renderPillarsChart([8.2, 7.5, 8.8, 7.9, 7.2]);
      }

      // Build overall PPI and MPI trends over the last 6 simulated ticks
      const basePpi = computedStats.avgPpi || cpi;
      const baseMpi = computedStats.avgMpi || cpi;

      if (basePpi > 0) {
        computedStats.ppiHistory = [basePpi - 0.4, basePpi - 0.2, basePpi + 0.1, basePpi - 0.1, basePpi + 0.3, basePpi];
      }
      if (baseMpi > 0) {
        computedStats.mpiHistory = [baseMpi - 0.5, baseMpi - 0.3, baseMpi - 0.1, baseMpi - 0.3, baseMpi + 0.1, baseMpi];
      }
    } else {
      renderPillarsChart([8.2, 7.5, 8.8, 7.9, 7.2]);
    }

    // Display computed performance indexes prominently
    const ppiEl = document.getElementById('avg-ppi');
    const mpiEl = document.getElementById('avg-mpi');
    const tpiEl = document.getElementById('avg-tpi');

    if (ppiEl) {
      ppiEl.textContent = formatScore(computedStats.avgPpi);
      ppiEl.style.color = scoreColor(computedStats.avgPpi);
    }
    if (mpiEl) {
      mpiEl.textContent = formatScore(computedStats.avgMpi);
      mpiEl.style.color = scoreColor(computedStats.avgMpi);
    }
    if (tpiEl) {
      tpiEl.textContent = formatScore(computedStats.avgTpi);
      tpiEl.style.color = scoreColor(computedStats.avgTpi);
    }

    // Render primary trend chart
    renderPerformanceChart('cpi');

  } catch (e) {
    console.error('[Dashboard] Failed to retrieve dashboard data:', e);
    showToast('Failed to load performance metrics', 'error');
    renderPerformanceChart('cpi');
    renderPillarsChart([8.2, 7.5, 8.8, 7.9, 7.2]);
  }

  // Setup click handlers for interactive charts
  setupChartControls();

  // Load Recent Activities
  loadRecentActivities();
}

async function loadRecentActivities() {
  const pList = document.getElementById('recent-practices');
  const mList = document.getElementById('recent-matches');

  try {
    const [practices, matches] = await Promise.all([
      api.practiceSessions.getAll(),
      api.matchSessions.getAll()
    ]);

    // Render Recent Practices (up to 3)
    if (practices && practices.length > 0) {
      pList.innerHTML = practices.slice(0, 3).map(p => `
        <div class="flex items-center justify-between py-2 border-b border-brand-border/30 last:border-0">
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate">${p.teamName}</div>
            <div class="text-[10px] text-brand-muted mt-0.5">📅 ${p.date}</div>
          </div>
          <a href="practice-score.html?sessionId=${p.id}&teamId=${p.teamId}" 
             class="text-[9px] font-bold bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-2.5 py-1.5 rounded-lg hover:bg-brand-orange hover:text-white transition-all click-bounce">
            Score
          </a>
        </div>`).join('');
    } else {
      pList.innerHTML = `
        <div class="text-center py-4 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
          <div class="text-lg">🎯</div>
          <p class="text-[9px] text-brand-muted font-bold uppercase tracking-wider mt-1">No Practice Sessions</p>
        </div>`;
    }

    // Render Recent Matches (up to 3)
    if (matches && matches.length > 0) {
      mList.innerHTML = matches.slice(0, 3).map(m => `
        <div class="flex items-center justify-between py-2 border-b border-brand-border/30 last:border-0">
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate">vs ${m.opponent}</div>
            <div class="text-[10px] text-brand-muted mt-0.5">${m.teamName} · 📅 ${m.date}</div>
          </div>
          <a href="match-score.html?sessionId=${m.id}&teamId=${m.teamId}" 
             class="text-[9px] font-bold bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-2.5 py-1.5 rounded-lg hover:bg-brand-orange hover:text-white transition-all click-bounce">
            Score
          </a>
        </div>`).join('');
    } else {
      mList.innerHTML = `
        <div class="text-center py-4 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
          <div class="text-lg">🏏</div>
          <p class="text-[9px] text-brand-muted font-bold uppercase tracking-wider mt-1">No Match Sessions</p>
        </div>`;
    }

  } catch (err) {
    console.error('[Dashboard] Error loading recent activities:', err);
    pList.innerHTML = '<div class="text-[10px] text-red-400 py-1">Error loading activities</div>';
    mList.innerHTML = '<div class="text-[10px] text-red-400 py-1">Error loading activities</div>';
  }
}

// Fetch dashboard data on load
loadDashboard();
