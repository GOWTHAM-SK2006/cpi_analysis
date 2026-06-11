/**
 * reports.js — Reports page logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast, formatScore, scoreColor } from './layout.js';

console.log('[Reports] Script initialized.');

// Verify authentication and retrieve token
try {
  requireAuth();
} catch (err) {
  console.error('[Reports] Auth enforcement failed:', err);
}

// Render the navbar
try {
  renderNavbar('reports.html');
} catch (err) {
  console.error('[Reports] Error rendering navbar:', err);
}

let allTeams = [], allPlayers = [];

async function init() {
  const emptyState = document.getElementById('reports-empty');
  emptyState.style.display = 'block';
  
  try {
    console.log('[Reports] Fetching teams and players for selection dropdowns...');
    [allTeams, allPlayers] = await Promise.all([api.teams.getAll(), api.players.getAll()]);
    
    const teamSel   = document.getElementById('report-team');
    const playerSel = document.getElementById('report-player');
    
    teamSel.innerHTML   = '<option value="">Select Team</option>'   + allTeams.map(t   => `<option value="${t.id}">${t.name}</option>`).join('');
    playerSel.innerHTML = '<option value="">Select Player</option>' + allPlayers.map(p => `<option value="${p.id}">${p.name} (${p.teamName})</option>`).join('');
    
    console.log('[Reports] Successfully populated dropdown select lists.');
  } catch (err) {
    console.error('[Reports] Failed to initialize reports lists:', err);
    showToast('Failed to load data', 'error');
  }
}

document.getElementById('gen-player-btn').addEventListener('click', async () => {
  const playerId = document.getElementById('report-player').value;
  const outputEl = document.getElementById('report-output');
  const emptyEl  = document.getElementById('reports-empty');
  
  if (!playerId) {
    showToast('Select a player first', 'error');
    return;
  }
  
  console.log(`[Reports] Generating report for player ID: ${playerId}`);
  outputEl.innerHTML = '<div class="text-center py-12 text-sm text-brand-muted">Generating player report...</div>';
  emptyEl.style.display = 'none';
  
  try {
    const rawData = await api.reports.player(playerId);
    console.log('[Reports] Player report API response:', rawData);
    outputEl.innerHTML = renderPlayerReport(rawData);
  } catch (err) {
    console.error('[Reports] Error generating player report:', err);
    showToast(err.message, 'error');
    outputEl.innerHTML = '';
    emptyEl.style.display = 'block';
  }
});

document.getElementById('gen-team-btn').addEventListener('click', async () => {
  const teamId = document.getElementById('report-team').value;
  const outputEl = document.getElementById('report-output');
  const emptyEl  = document.getElementById('reports-empty');
  
  if (!teamId) {
    showToast('Select a team first', 'error');
    return;
  }
  
  console.log(`[Reports] Generating report for team ID: ${teamId}`);
  outputEl.innerHTML = '<div class="text-center py-12 text-sm text-brand-muted">Generating team report...</div>';
  emptyEl.style.display = 'none';
  
  try {
    const playersList = await api.reports.team(teamId);
    console.log('[Reports] Team report API response:', playersList);
    
    if (!playersList || playersList.length === 0) {
      outputEl.innerHTML = `
        <div class="bg-brand-card border border-brand-border rounded-2xl p-12 text-center custom-shadow">
          <div class="text-4xl mb-3">🛡️</div>
          <h3 class="text-md font-bold text-white">No players found in this team</h3>
          <p class="text-brand-muted text-xs mt-1">Add players to the squad before running team reports.</p>
        </div>`;
      return;
    }
    
    outputEl.innerHTML = playersList.map(renderPlayerReport).join('');
  } catch (err) {
    console.error('[Reports] Error generating team report:', err);
    showToast(err.message, 'error');
    outputEl.innerHTML = '';
    emptyEl.style.display = 'block';
  }
});

function renderPlayerReport(d) {
  const ppi = d.averagePpi, mpi = d.averageMpi, cpi = d.cpi;
  
  const scoreRow = (label, val) => {
    const color = scoreColor(val);
    const scoreStr = formatScore(val);
    const percentage = val ? (val * 10) : 0;
    
    return `
      <div class="flex flex-col gap-1.5 py-3.5 border-b border-brand-border/60 last:border-b-0">
        <div class="flex justify-between items-center text-sm">
          <span class="text-brand-muted font-medium">${label}</span>
          <span class="font-extrabold text-base" style="color: ${color}">${scoreStr}</span>
        </div>
        <div class="w-full bg-brand-bg h-2 rounded-full overflow-hidden border border-brand-border/40">
          <div class="h-full rounded-full transition-all duration-700 ease-out" style="width: ${percentage}%; background-color: ${color}"></div>
        </div>
      </div>`;
  };
  
  return `
    <div class="bg-brand-card border border-brand-border rounded-2xl p-6 custom-shadow mb-6">
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-xl font-bold text-white tracking-tight">${d.name}</h2>
          <p class="text-xs text-brand-muted mt-1 font-semibold uppercase tracking-wider">
            ${d.role} <span class="mx-1.5 text-brand-border">•</span> ${d.teamName} <span class="mx-1.5 text-brand-border">•</span> Age ${d.age}
          </p>
        </div>
        
        <div class="flex flex-col items-center bg-brand-bg border border-brand-border px-4 py-2.5 rounded-xl text-center min-w-[70px]">
          <span class="text-2xl font-black" style="color: ${scoreColor(cpi)}">${formatScore(cpi)}</span>
          <span class="text-[9px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">CPI</span>
        </div>
      </div>
      
      <div class="space-y-1">
        ${scoreRow('Practice Performance Index (PPI)', ppi)}
        ${scoreRow('Match Performance Index (MPI)',    mpi)}
        ${scoreRow('Combined Performance Index (CPI)',  cpi)}
      </div>
      
      <div class="flex items-center gap-4 mt-6 pt-4 border-t border-brand-border/50 text-[11px] text-brand-muted font-semibold">
        <span class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-orange"></span> PPI Sessions: ${d.ppiHistory.length}
        </span>
        <span class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span> MPI Sessions: ${d.mpiHistory.length}
        </span>
      </div>
    </div>`;
}

init();
