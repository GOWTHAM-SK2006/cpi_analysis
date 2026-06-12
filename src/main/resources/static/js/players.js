/**
 * players.js — Players page logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast } from './layout.js';

requireAuth();
renderNavbar('players.html');

let allPlayers = [];
let allTeams   = [];
let editingId  = null;

const listEl      = document.getElementById('players-list');
const emptyEl     = document.getElementById('players-empty');
const modalEl     = document.getElementById('player-modal');
const modalTitle  = document.getElementById('modal-title');
const searchInput = document.getElementById('search-input');
const form        = document.getElementById('player-form');
const teamSelect  = document.getElementById('player-team');

function openModal() {
  modalEl.classList.remove('hidden');
  modalEl.classList.add('flex');
}
function closeModal() {
  modalEl.classList.add('hidden');
  modalEl.classList.remove('flex');
}

// Role badge styling
function roleBadge(role) {
  const colors = {
    'Batsman':     'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Bowler':      'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'All-Rounder': 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
    'Wicketkeeper':'bg-green-500/10 text-green-400 border-green-500/20',
  };
  return colors[role] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}

async function init() {
  try {
    [allTeams, allPlayers] = await Promise.all([api.teams.getAll(), api.players.getAll()]);
    populateTeamSelect();
    renderPlayers(allPlayers);
  } catch {
    showToast('Failed to load roster data', 'error');
  }
}

function populateTeamSelect() {
  teamSelect.innerHTML = '<option value="">Select Team</option>' +
    allTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

function renderPlayers(players) {
  if (!players.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  listEl.innerHTML = players.map(p => `
    <div class="glass-card p-6 flex flex-col justify-between gap-6">
      
      <!-- Top Section: Avatar, Bio and Role -->
      <div class="flex items-start gap-4">
        <!-- Jersey representation -->
        <div class="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-brand-orange font-black text-sm flex-shrink-0">
          #${p.id}
        </div>
        <div class="min-w-0 flex-grow">
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-base font-black text-white truncate tracking-tight">${p.name}</h3>
            <span class="inline-block text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider ${roleBadge(p.role)}">
              ${p.role}
            </span>
          </div>
          <p class="text-xs text-brand-muted mt-1 font-bold uppercase tracking-wider">${p.teamName} · Age ${p.age}</p>
        </div>
      </div>

      <!-- Center details: Specs styles -->
      <div class="grid grid-cols-2 gap-2 border-y border-white/5 py-4">
        <div>
          <span class="block text-[8px] font-bold text-brand-muted uppercase tracking-widest">Batting</span>
          <span class="text-xs font-semibold text-gray-200 mt-0.5 block truncate">${p.battingStyle || 'None'}</span>
        </div>
        <div>
          <span class="block text-[8px] font-bold text-brand-muted uppercase tracking-widest">Bowling</span>
          <span class="text-xs font-semibold text-gray-200 mt-0.5 block truncate">${p.bowlingStyle || 'None'}</span>
        </div>
      </div>

      <!-- Action items -->
      <div class="flex items-center gap-2">
        <a href="player-detail.html?id=${p.id}" 
           class="flex-1 text-center text-[10px] font-black bg-brand-orange hover:bg-brand-orangeHover text-white px-3 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
          Profile
        </a>
        <button onclick="editPlayer(${p.id})" 
                class="text-[10px] font-black bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 px-3 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
          Edit
        </button>
        <button onclick="deletePlayer(${p.id}, '${p.name.replace(/'/g,"\\'")}')" 
                class="text-[10px] font-black bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
          Delete
        </button>
      </div>

    </div>`).join('');
}

searchInput?.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase();
  renderPlayers(allPlayers.filter(p =>
    p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q)
  ));
});

document.getElementById('add-player-btn').addEventListener('click', () => {
  editingId = null;
  modalTitle.textContent = 'Add Player';
  form.reset();
  populateTeamSelect();
  openModal();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.textContent = 'Saving...'; submitBtn.disabled = true;
  const body = {
    name:         document.getElementById('player-name').value.trim(),
    age:          parseInt(document.getElementById('player-age').value),
    role:         document.getElementById('player-role').value,
    battingStyle: document.getElementById('player-batting').value,
    bowlingStyle: document.getElementById('player-bowling').value,
    teamId:       parseInt(document.getElementById('player-team').value),
  };
  try {
    if (editingId) { await api.players.update(editingId, body); showToast('Player updated ✓'); }
    else           { await api.players.create(body);            showToast('Player added ✓'); }
    closeModal();
    allPlayers = await api.players.getAll();
    renderPlayers(allPlayers);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.textContent = 'Save Player'; submitBtn.disabled = false;
  }
});

window.editPlayer = (id) => {
  const p = allPlayers.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  modalTitle.textContent = 'Edit Player';
  document.getElementById('player-name').value    = p.name;
  document.getElementById('player-age').value     = p.age;
  document.getElementById('player-role').value    = p.role;
  document.getElementById('player-batting').value = p.battingStyle;
  document.getElementById('player-bowling').value = p.bowlingStyle;
  document.getElementById('player-team').value    = p.teamId;
  openModal();
};

window.deletePlayer = async (id, name) => {
  if (!confirm(`Delete player "${name}"? This cannot be undone.`)) return;
  try {
    await api.players.delete(id);
    showToast('Player deleted');
    allPlayers = await api.players.getAll();
    renderPlayers(allPlayers);
  } catch (err) { showToast(err.message, 'error'); }
};

document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn =>
  btn.addEventListener('click', closeModal)
);
modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });

init().catch(() => showToast('Failed to load data', 'error'));
