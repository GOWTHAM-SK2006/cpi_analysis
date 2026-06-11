/**
 * teams.js — Teams page logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast, openModal, closeModal } from './layout.js';

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
    <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;">
      <div>
        <div style="font-weight:700;font-size:1rem;">${t.name}</div>
        <div style="color:var(--text-secondary);font-size:0.82rem;margin-top:0.25rem;">${t.description || 'No description'}</div>
      </div>
      <div class="flex gap-1">
        <button class="btn btn-secondary btn-sm" onclick="editTeam(${t.id})">Edit</button>
        <button class="btn btn-danger btn-sm"    onclick="deleteTeam(${t.id}, '${t.name}')">Delete</button>
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
  openModal('team-modal');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { name: nameInput.value.trim(), description: descInput.value.trim() };
  try {
    if (editingId) {
      await api.teams.update(editingId, body);
      showToast('Team updated');
    } else {
      await api.teams.create(body);
      showToast('Team created');
    }
    closeModal('team-modal');
    loadTeams();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

window.editTeam = async (id) => {
  const team = allTeams.find(t => t.id === id);
  if (!team) return;
  editingId = id;
  modalTitle.textContent = 'Edit Team';
  nameInput.value = team.name;
  descInput.value = team.description || '';
  openModal('team-modal');
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
  btn.addEventListener('click', () => closeModal('team-modal'))
);

loadTeams();
