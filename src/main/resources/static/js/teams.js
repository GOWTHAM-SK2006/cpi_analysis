/**
 * teams.js — Teams page logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast } from './layout.js';

requireAuth();
renderNavbar('teams.html');

let allTeams = [];
let allPlayers = [];
let editingId = null;

const listEl      = document.getElementById('teams-list');
const emptyEl     = document.getElementById('teams-empty');
const modalEl     = document.getElementById('team-modal');
const modalTitle  = document.getElementById('modal-title');
const nameInput   = document.getElementById('team-name');
const descInput   = document.getElementById('team-desc');
const searchInput = document.getElementById('search-input');
const form        = document.getElementById('team-form');

function openModal() {
  modalEl.classList.remove('hidden');
  modalEl.classList.add('flex');
  setTimeout(() => nameInput.focus(), 100);
}
function closeModal() {
  modalEl.classList.add('hidden');
  modalEl.classList.remove('flex');
}

async function loadTeams() {
  try {
    // Parallel fetching of teams and roster
    [allTeams, allPlayers] = await Promise.all([
      api.teams.getAll(),
      api.players.getAll()
    ]);
    
    // Fetch detailed reports for all teams in parallel to compute real TPI, PPI, MPI
    const teamReportsPromises = allTeams.map(t => api.reports.team(t.id).catch(() => []));
    const teamReportsList = await Promise.all(teamReportsPromises);

    const teamsWithScores = allTeams.map((t, idx) => {
      const playersData = teamReportsList[idx];
      let ppiSum = 0, ppiCount = 0;
      let mpiSum = 0, mpiCount = 0;
      let cpiSum = 0, cpiCount = 0;

      playersData.forEach(p => {
        if (p.averagePpi) { ppiSum += p.averagePpi; ppiCount++; }
        if (p.averageMpi) { mpiSum += p.averageMpi; mpiCount++; }
        if (p.cpi) { cpiSum += p.cpi; cpiCount++; }
      });

      return {
        ...t,
        tpi: cpiCount > 0 ? (cpiSum / cpiCount) : null,
        avgPpi: ppiCount > 0 ? (ppiSum / ppiCount) : null,
        avgMpi: mpiCount > 0 ? (mpiSum / mpiCount) : null,
        playerCount: playersData.length
      };
    });

    renderTeams(teamsWithScores);
  } catch (e) {
    showToast('Failed to load squads', 'error');
  }
}

function renderTeams(teams) {
  if (!teams.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  
  listEl.innerHTML = teams.map(t => {
    const tpiStr = t.tpi ? t.tpi.toFixed(1) : '—';
    const tpiColor = t.tpi >= 7.5 ? 'text-green-400 bg-green-500/10 border-green-500/20' : (t.tpi >= 5.0 ? 'text-brand-orange bg-brand-orange/10 border-brand-orange/20' : 'text-gray-400 bg-white/5 border-white/5');
    
    const ppiStr = t.avgPpi ? t.avgPpi.toFixed(1) : '—';
    const mpiStr = t.avgMpi ? t.avgMpi.toFixed(1) : '—';

    return `
      <div class="glass-card p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div class="flex items-start gap-4 min-w-0">
          <!-- Team Logo Shield -->
          <div class="w-14 h-14 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
            🛡️
          </div>
          <div class="min-w-0">
            <h3 class="text-base font-black text-white tracking-tight truncate">${t.name}</h3>
            <p class="text-xs text-brand-muted mt-1 truncate">${t.description || 'No description provided'}</p>
            <div class="flex flex-wrap items-center gap-2 mt-3">
              <span class="inline-flex items-center gap-1.5 text-[10px] font-black text-gray-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-wider">
                🏃 ${t.playerCount} Players
              </span>
              <span class="inline-flex items-center gap-1.5 text-[10px] font-black ${tpiColor} px-3 py-1.5 rounded-xl border uppercase tracking-wider">
                🛡️ TPI: ${tpiStr}
              </span>
              ${t.avgPpi ? `
              <span class="inline-flex items-center gap-1.5 text-[10px] font-black text-brand-orange bg-brand-orange/5 border border-brand-orange/10 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                🎯 PPI: ${ppiStr}
              </span>` : ''}
              ${t.avgMpi ? `
              <span class="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-400 bg-blue-400/5 border border-blue-400/10 px-3 py-1.5 rounded-xl uppercase tracking-wider">
                🏏 MPI: ${mpiStr}
              </span>` : ''}
            </div>
          </div>
        </div>
        
        <!-- Quick Action Buttons -->
        <div class="flex flex-wrap items-center gap-2 sm:self-center">
          <a href="reports.html" 
             onclick="localStorage.setItem('reports_selected_team', ${t.id})"
             class="text-[10px] font-black bg-brand-orange hover:bg-brand-orangeHover text-white px-4 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider text-center">
            Report
          </a>
          <button onclick="editTeam(${t.id})" 
                   class="text-[10px] font-black bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 px-4 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
            Edit
          </button>
          <button onclick="deleteTeam(${t.id}, '${t.name.replace(/'/g,"\\'")}')" 
                   class="text-[10px] font-black bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-4 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
            Delete
          </button>
        </div>
      </div>`;
  }).join('');
}

searchInput?.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  renderTeams(allTeams.filter(t => t.name.toLowerCase().includes(q)));
});

document.getElementById('add-team-btn').addEventListener('click', () => {
  editingId = null;
  modalTitle.textContent = 'New Team';
  nameInput.value = '';
  descInput.value = '';
  openModal();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.textContent = 'Saving...'; submitBtn.disabled = true;
  const body = { name: nameInput.value.trim(), description: descInput.value.trim() };
  try {
    if (editingId) {
      await api.teams.update(editingId, body);
      showToast('Team updated ✓');
    } else {
      await api.teams.create(body);
      showToast('Team created ✓');
    }
    closeModal();
    loadTeams();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.textContent = 'Save Team'; submitBtn.disabled = false;
  }
});

window.editTeam = (id) => {
  const team = allTeams.find(t => t.id === id);
  if (!team) return;
  editingId = id;
  modalTitle.textContent = 'Edit Team';
  nameInput.value = team.name;
  descInput.value = team.description || '';
  openModal();
};

window.deleteTeam = async (id, name) => {
  if (!confirm(`Delete team "${name}"? This cannot be undone.`)) return;
  try {
    await api.teams.delete(id);
    showToast('Team deleted');
    loadTeams();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn =>
  btn.addEventListener('click', closeModal)
);

modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });

loadTeams();
