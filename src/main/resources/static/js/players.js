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

// Role badge color helper
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
    showToast('Failed to load data', 'error');
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

  // Render as responsive card grid
  listEl.innerHTML = `
    <div class="bg-brand-card border border-brand-border rounded-2xl overflow-hidden" style="box-shadow:0 4px 20px rgba(0,0,0,0.4)">
      <!-- Table header -->
      <div class="hidden md:grid grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr_1.5fr_auto] px-5 py-3 border-b border-brand-border gap-4">
        ${['Name','Age','Role','Batting','Bowling','Team','Actions'].map(h =>
          `<div class="text-[10px] font-bold uppercase tracking-widest text-brand-muted">${h}</div>`
        ).join('')}
      </div>
      <!-- Rows -->
      ${players.map(p => `
        <div class="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1.5fr_1.5fr_1.5fr_auto] px-5 py-4 border-b border-brand-border/60 last:border-b-0 gap-2 md:gap-4 items-center hover:bg-brand-orange/[0.02] transition-colors">
          <div>
            <a href="player-detail.html?id=${p.id}" class="font-bold text-sm text-brand-orange hover:underline">${p.name}</a>
            <div class="text-xs text-brand-muted md:hidden mt-0.5">${p.teamName} · Age ${p.age}</div>
          </div>
          <div class="hidden md:block text-sm text-gray-300">${p.age}</div>
          <div>
            <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleBadge(p.role)}">${p.role}</span>
          </div>
          <div class="hidden md:block text-xs text-brand-muted">${p.battingStyle}</div>
          <div class="hidden md:block text-xs text-brand-muted">${p.bowlingStyle}</div>
          <div class="hidden md:block text-xs text-brand-muted">${p.teamName}</div>
          <div class="flex gap-2">
            <button onclick="editPlayer(${p.id})"
              class="text-xs font-bold px-3 py-1.5 rounded-lg border border-brand-border text-gray-300 hover:border-brand-orange hover:text-brand-orange transition-all">
              Edit
            </button>
            <button onclick="deletePlayer(${p.id}, '${p.name.replace(/'/g,"\\'")}')"
              class="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-900/40 text-red-400 hover:bg-red-950/20 transition-all">
              Delete
            </button>
          </div>
        </div>`).join('')}
    </div>`;
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
