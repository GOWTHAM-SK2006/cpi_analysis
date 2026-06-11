/**
 * players.js — Players page logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast, openModal, closeModal } from './layout.js';

requireAuth();
renderNavbar('players.html');

let allPlayers = [];
let allTeams   = [];
let editingId  = null;

const listEl      = document.getElementById('players-list');
const emptyEl     = document.getElementById('players-empty');
const modalTitle  = document.getElementById('modal-title');
const searchInput = document.getElementById('search-input');
const form        = document.getElementById('player-form');
const teamSelect  = document.getElementById('player-team');

const ROLES         = ['Batsman','Bowler','All-Rounder','Wicketkeeper'];
const BATTING_STYLES = ['Right-hand bat','Left-hand bat'];
const BOWLING_STYLES = ['Right-arm fast','Right-arm medium','Right-arm off-break','Left-arm fast','Left-arm orthodox','None'];

async function init() {
  [allTeams, allPlayers] = await Promise.all([api.teams.getAll(), api.players.getAll()]);
  populateTeamSelect();
  renderPlayers(allPlayers);
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
  listEl.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Name</th><th>Age</th><th>Role</th><th>Batting</th><th>Bowling</th><th>Team</th><th>Actions</th>
        </tr></thead>
        <tbody>${players.map(p => `
          <tr>
            <td><a href="player-detail.html?id=${p.id}" style="color:var(--orange);font-weight:600;">${p.name}</a></td>
            <td>${p.age}</td>
            <td><span class="badge badge-orange">${p.role}</span></td>
            <td style="color:var(--text-secondary);font-size:0.82rem;">${p.battingStyle}</td>
            <td style="color:var(--text-secondary);font-size:0.82rem;">${p.bowlingStyle}</td>
            <td style="color:var(--text-secondary);font-size:0.82rem;">${p.teamName}</td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-secondary btn-sm" onclick="editPlayer(${p.id})">Edit</button>
                <button class="btn btn-danger btn-sm"    onclick="deletePlayer(${p.id}, '${p.name}')">Delete</button>
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
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
  openModal('player-modal');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById('player-name').value.trim(),
    age: parseInt(document.getElementById('player-age').value),
    role: document.getElementById('player-role').value,
    battingStyle: document.getElementById('player-batting').value,
    bowlingStyle: document.getElementById('player-bowling').value,
    teamId: parseInt(document.getElementById('player-team').value),
  };
  try {
    if (editingId) { await api.players.update(editingId, body); showToast('Player updated'); }
    else           { await api.players.create(body);            showToast('Player added'); }
    closeModal('player-modal');
    allPlayers = await api.players.getAll();
    renderPlayers(allPlayers);
  } catch (err) { showToast(err.message, 'error'); }
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
  openModal('player-modal');
};

window.deletePlayer = async (id, name) => {
  if (!confirm(`Delete player "${name}"?`)) return;
  try {
    await api.players.delete(id);
    showToast('Player deleted');
    allPlayers = await api.players.getAll();
    renderPlayers(allPlayers);
  } catch (err) { showToast(err.message, 'error'); }
};

document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn =>
  btn.addEventListener('click', () => closeModal('player-modal'))
);

init().catch(() => showToast('Failed to load data', 'error'));
