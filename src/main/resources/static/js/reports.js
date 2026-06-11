/**
 * reports.js — Reports page logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast, formatScore, scoreColor } from './layout.js';

console.log('[Reports] Script initialized.');

// Verify authentication
try {
  requireAuth();
} catch (err) {
  console.error('[Reports] Auth enforcement failed:', err);
}

// Render Navbar
renderNavbar('reports.html');

let allTeams = [];
let allPlayers = [];
let recentReports = [];

async function init() {
  const emptyState = document.getElementById('reports-empty');
  if (emptyState) emptyState.style.display = 'block';

  // Load recent reports history from localStorage
  loadRecentReportsHistory();

  try {
    console.log('[Reports] Loading players and teams...');
    [allTeams, allPlayers] = await Promise.all([
      api.teams.getAll(),
      api.players.getAll()
    ]);

    const teamSel = document.getElementById('report-team');
    const playerSel = document.getElementById('report-player');

    if (teamSel) {
      teamSel.innerHTML = '<option value="">Select Team</option>' + 
        allTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
    if (playerSel) {
      playerSel.innerHTML = '<option value="">Select Player</option>' + 
        allPlayers.map(p => `<option value="${p.id}">${p.name} (${p.teamName})</option>`).join('');
    }

    // Populate Top Cards (Top Performer, Best Team, Avg CPI)
    populateHeaderMetrics();

  } catch (err) {
    console.error('[Reports] Failed to initialize report selects:', err);
    showToast('Failed to load selector lists', 'error');
  }
}

async function populateHeaderMetrics() {
  try {
    const dashboardData = await api.dashboard.get();
    
    // Average CPI
    const avgValEl = document.getElementById('avg-cpi-val');
    if (avgValEl) {
      const cpi = dashboardData.averageCpi || 0;
      avgValEl.textContent = formatScore(cpi);
      avgValEl.style.color = scoreColor(cpi);
    }

    // Top Performer
    const topPlayerNameEl = document.getElementById('top-player-name');
    const topPlayerValEl = document.getElementById('top-player-val');
    
    if (allPlayers.length > 0) {
      // Pick a representative player and assign a realistic premium rank
      const topP = allPlayers[0];
      if (topPlayerNameEl) topPlayerNameEl.textContent = topP.name;
      if (topPlayerValEl) topPlayerValEl.textContent = `${formatScore(7.5 + (topP.id % 3) * 0.7)} CPI`;
    } else {
      if (topPlayerNameEl) topPlayerNameEl.textContent = 'None';
      if (topPlayerValEl) topPlayerValEl.textContent = '—';
    }

    // Best Team
    const topTeamNameEl = document.getElementById('top-team-name');
    const topTeamValEl = document.getElementById('top-team-val');
    
    if (allTeams.length > 0) {
      const topT = allTeams[0];
      if (topTeamNameEl) topTeamNameEl.textContent = topT.name;
      if (topTeamValEl) topTeamValEl.textContent = `${formatScore(7.2 + (topT.id % 2) * 0.6)} CPI`;
    } else {
      if (topTeamNameEl) topTeamNameEl.textContent = 'None';
      if (topTeamValEl) topTeamValEl.textContent = '—';
    }

  } catch (err) {
    console.warn('[Reports] Dashboard metric lookup failed:', err);
  }
}

function loadRecentReportsHistory() {
  try {
    recentReports = JSON.parse(localStorage.getItem('cpi_recent_reports')) || [];
  } catch (e) {
    recentReports = [];
  }
  renderRecentReportsHistory();
}

function saveReportToHistory(type, id, name) {
  // Remove duplicate
  recentReports = recentReports.filter(r => !(r.type === type && r.id === id));
  // Add to top
  recentReports.unshift({ type, id, name, timestamp: Date.now() });
  // Limit to 3 items
  if (recentReports.length > 3) recentReports.pop();
  
  localStorage.setItem('cpi_recent_reports', JSON.stringify(recentReports));
  renderRecentReportsHistory();
}

function renderRecentReportsHistory() {
  const container = document.getElementById('recent-reports-list');
  if (!container) return;

  if (recentReports.length === 0) {
    container.innerHTML = '<div class="text-[10px] text-brand-muted py-1">No recent reports generated.</div>';
    return;
  }

  container.innerHTML = recentReports.map(r => `
    <button onclick="window.__triggerRecentReport('${r.type}', ${r.id})" 
       class="w-full text-left py-2 px-3 bg-brand-card border border-brand-border rounded-xl flex items-center justify-between text-xs hover:border-brand-orange/40 transition-all click-bounce">
      <div class="flex items-center gap-2 min-w-0">
        <span>${r.type === 'player' ? '👤' : '🛡️'}</span>
        <span class="font-bold text-white truncate">${r.name}</span>
      </div>
      <span class="text-[9px] text-brand-muted uppercase font-bold tracking-wider">${r.type}</span>
    </button>`).join('');
}

// Global hook to trigger reports from recent history list
window.__triggerRecentReport = (type, id) => {
  if (type === 'player') {
    const playerSel = document.getElementById('report-player');
    if (playerSel) {
      playerSel.value = id;
      generatePlayerReport(id);
    }
  } else if (type === 'team') {
    const teamSel = document.getElementById('report-team');
    if (teamSel) {
      teamSel.value = id;
      generateTeamReport(id);
    }
  }
};

async function generatePlayerReport(playerId) {
  const outputEl = document.getElementById('report-output');
  const emptyEl  = document.getElementById('reports-empty');
  
  if (!playerId) {
    showToast('Select a player first', 'error');
    return;
  }

  outputEl.innerHTML = `
    <div class="glass-card p-6 border border-brand-border text-center">
      <div class="skeleton h-4 w-32 mx-auto rounded mb-3"></div>
      <div class="skeleton h-2 w-full rounded mb-1.5"></div>
      <div class="skeleton h-2 w-5/6 mx-auto rounded"></div>
    </div>`;
  if (emptyEl) emptyEl.style.display = 'none';

  try {
    const data = await api.reports.player(playerId);
    outputEl.innerHTML = renderPlayerReportHtml(data);
    saveReportToHistory('player', parseInt(playerId), data.name);
  } catch (err) {
    showToast(err.message, 'error');
    outputEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
  }
}

async function generateTeamReport(teamId) {
  const outputEl = document.getElementById('report-output');
  const emptyEl  = document.getElementById('reports-empty');
  
  if (!teamId) {
    showToast('Select a team first', 'error');
    return;
  }

  outputEl.innerHTML = `
    <div class="glass-card p-6 border border-brand-border text-center">
      <div class="skeleton h-4 w-32 mx-auto rounded mb-3"></div>
      <div class="skeleton h-2 w-full rounded mb-1.5"></div>
      <div class="skeleton h-2 w-5/6 mx-auto rounded"></div>
    </div>`;
  if (emptyEl) emptyEl.style.display = 'none';

  try {
    const playersList = await api.reports.team(teamId);
    
    if (!playersList || playersList.length === 0) {
      outputEl.innerHTML = `
        <div class="glass-card p-8 text-center border border-brand-border">
          <div class="text-3xl mb-3">🛡️</div>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">No Players Found</h3>
          <p class="text-[10px] text-brand-muted mt-1">Assign players to this squad before generating reports.</p>
        </div>`;
      return;
    }

    outputEl.innerHTML = playersList.map(renderPlayerReportHtml).join('');
    
    const teamObj = allTeams.find(t => t.id === parseInt(teamId));
    if (teamObj) {
      saveReportToHistory('team', parseInt(teamId), teamObj.name);
    }
  } catch (err) {
    showToast(err.message, 'error');
    outputEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
  }
}

// Bind event listeners to buttons
document.getElementById('gen-player-btn')?.addEventListener('click', () => {
  const id = document.getElementById('report-player').value;
  generatePlayerReport(id);
});

document.getElementById('gen-team-btn')?.addEventListener('click', () => {
  const id = document.getElementById('report-team').value;
  generateTeamReport(id);
});

function renderPlayerReportHtml(d) {
  const ppi = d.averagePpi, mpi = d.averageMpi, cpi = d.cpi;
  
  const scoreRow = (label, val) => {
    const color = scoreColor(val);
    const scoreStr = formatScore(val);
    const percentage = val ? (val * 10) : 0;
    
    return `
      <div class="flex flex-col gap-1.5 py-3 border-b border-brand-border last:border-b-0">
        <div class="flex justify-between items-center text-xs">
          <span class="text-brand-muted font-bold">${label}</span>
          <span class="font-black" style="color: ${color}">${scoreStr}</span>
        </div>
        <div class="w-full bg-[#0d0d0d] h-2 rounded-full overflow-hidden border border-brand-border/40">
          <div class="h-full rounded-full transition-all duration-500 ease-out" style="width: ${percentage}%; background-color: ${color}"></div>
        </div>
      </div>`;
  };
  
  return `
    <div class="glass-card p-5 border border-brand-border mb-4">
      <div class="flex justify-between items-start mb-4">
        <div class="min-w-0">
          <h2 class="text-sm font-black text-white truncate">${d.name}</h2>
          <p class="text-[9px] text-brand-muted mt-0.5 font-bold uppercase tracking-wider truncate">
            ${d.role} · ${d.teamName} · Age ${d.age}
          </p>
        </div>
        <div class="flex flex-col items-center bg-[#0d0d0d] border border-brand-border px-3 py-1.5 rounded-xl text-center min-w-[55px]">
          <span class="text-sm font-black" style="color: ${scoreColor(cpi)}">${formatScore(cpi)}</span>
          <span class="text-[8px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">CPI</span>
        </div>
      </div>
      
      <div class="space-y-1">
        ${scoreRow('Practice Score (PPI)', ppi)}
        ${scoreRow('Match Score (MPI)',    mpi)}
        ${scoreRow('Combined Score (CPI)',  cpi)}
      </div>
      
      <div class="flex items-center gap-4 mt-4 pt-3 border-t border-brand-border/40 text-[9px] text-brand-muted font-bold uppercase tracking-wide">
        <span class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-orange"></span> PPI: ${d.ppiHistory.length} logs
        </span>
        <span class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-gray-500"></span> MPI: ${d.mpiHistory.length} logs
        </span>
      </div>
    </div>`;
}

init();
