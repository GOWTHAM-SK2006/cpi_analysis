/**
 * reports.js — Reports page logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast, formatScore, scoreColor } from './layout.js';

requireAuth();
renderNavbar('reports.html');

let allTeams = [], allPlayers = [];

async function init() {
  try {
    [allTeams, allPlayers] = await Promise.all([api.teams.getAll(), api.players.getAll()]);
    const teamSel   = document.getElementById('report-team');
    const playerSel = document.getElementById('report-player');
    teamSel.innerHTML   = '<option value="">Select Team</option>'   + allTeams.map(t   => `<option value="${t.id}">${t.name}</option>`).join('');
    playerSel.innerHTML = '<option value="">Select Player</option>' + allPlayers.map(p => `<option value="${p.id}">${p.name} (${p.teamName})</option>`).join('');
  } catch { showToast('Failed to load data', 'error'); }
}

document.getElementById('gen-player-btn').addEventListener('click', async () => {
  const playerId = document.getElementById('report-player').value;
  if (!playerId) { showToast('Select a player', 'error'); return; }
  try {
    const data = renderPlayerReport(await api.reports.player(playerId));
    document.getElementById('report-output').innerHTML = data;
  } catch (err) { showToast(err.message, 'error'); }
});

document.getElementById('gen-team-btn').addEventListener('click', async () => {
  const teamId = document.getElementById('report-team').value;
  if (!teamId) { showToast('Select a team', 'error'); return; }
  try {
    const players = await api.reports.team(teamId);
    document.getElementById('report-output').innerHTML =
      players.map(renderPlayerReport).join('<hr style="border-color:var(--border);margin:1.5rem 0;">');
  } catch (err) { showToast(err.message, 'error'); }
});

function renderPlayerReport(d) {
  const ppi = d.averagePpi, mpi = d.averageMpi, cpi = d.cpi;
  const pill = (label, val) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border);">
      <span style="color:var(--text-secondary);font-size:0.85rem;">${label}</span>
      <span style="font-weight:700;color:${scoreColor(val)};">${formatScore(val)}</span>
    </div>`;
  return `
    <div class="card" style="margin-bottom:1rem;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;">
        <div>
          <div style="font-size:1.2rem;font-weight:800;">${d.name}</div>
          <div style="color:var(--text-secondary);font-size:0.85rem;margin-top:0.25rem;">
            ${d.role} · ${d.teamName} · Age ${d.age}
          </div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:2rem;font-weight:900;color:${scoreColor(cpi)};">${formatScore(cpi)}</div>
          <div style="font-size:0.7rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.08em;">CPI</div>
        </div>
      </div>
      ${pill('Practice Performance Index (PPI)', ppi)}
      ${pill('Match Performance Index (MPI)',    mpi)}
      ${pill('Cullinan Performance Index (CPI)', cpi)}
      <div style="margin-top:1rem;">
        <div style="font-size:0.75rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.5rem;">
          PPI Sessions: ${d.ppiHistory.length} · MPI Sessions: ${d.mpiHistory.length}
        </div>
      </div>
    </div>`;
}

init();
