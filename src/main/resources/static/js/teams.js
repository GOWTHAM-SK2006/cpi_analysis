/**
 * teams.js — Teams page logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast } from './layout.js';

requireAuth();
renderNavbar('teams.html');

let allTeams = [];
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
    allTeams = await api.teams.getAll();
    renderTeams(allTeams);
  } catch (e) {
    showToast('Failed to load teams', 'error');
  }
}

function renderTeams(teams) {
  if (!teams.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = teams.map(t => `
    <div class="bg-brand-card border border-brand-border rounded-2xl px-5 py-4 flex items-center justify-between gap-4 hover:border-brand-orange/40 transition-all duration-200" style="box-shadow:0 4px 20px rgba(0,0,0,0.4)">
      <div class="flex items-center gap-4 min-w-0">
        <div class="w-10 h-10 flex-shrink-0 bg-brand-orange/10 border border-brand-orange/20 rounded-xl flex items-center justify-center text-lg">🛡️</div>
        <div class="min-w-0">
          <div class="font-bold text-white text-sm truncate">${t.name}</div>
          <div class="text-brand-muted text-xs mt-0.5 truncate">${t.description || 'No description'}</div>
        </div>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button onclick="editTeam(${t.id})"
          class="text-xs font-bold px-3 py-1.5 rounded-lg border border-brand-border text-gray-300 hover:border-brand-orange hover:text-brand-orange transition-all">
          Edit
        </button>
        <button onclick="deleteTeam(${t.id}, '${t.name.replace(/'/g,"\\'")}'')"
          class="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-900/40 text-red-400 hover:bg-red-950/20 transition-all">
          Delete
        </button>
      </div>
    </div>`).join('');
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

// Close on backdrop click
modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });

loadTeams();
