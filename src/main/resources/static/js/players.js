/**
 * players.js — Players page logic (premium UI)
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
const searchInput  = document.getElementById('search-input');
const filterTeam   = document.getElementById('filter-team');
const filterRole   = document.getElementById('filter-role');
const form         = document.getElementById('player-form');
const teamSelect   = document.getElementById('player-team');

function openModal() { modalEl.classList.remove('hidden'); modalEl.classList.add('flex'); }
function closeModal() { modalEl.classList.add('hidden'); modalEl.classList.remove('flex'); }

// ── Helpers ───────────────────────────────────────────────────────────────────
function roleAvatarClass(role) {
  if (!role) return 'role-avatar--batsman';
  const r = role.toLowerCase();
  if (r.includes('bowl')) return 'role-avatar--bowler';
  if (r.includes('all') || r.includes('rounder')) return 'role-avatar--allrounder';
  if (r.includes('keep') || r.includes('wicket')) return 'role-avatar--keeper';
  return 'role-avatar--batsman';
}

function playerInitials(name) {
  if (!name) return '??';
  return name.trim().split(/\s+/).slice(0, 2).map(n => n.charAt(0)).join('').toUpperCase();
}

function roleBadge(role) {
  const colors = {
    'Batsman':     'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Bowler':      'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'All-Rounder': 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
    'Wicketkeeper':'bg-green-500/10 text-green-400 border-green-500/20',
  };
  return colors[role] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}

function performanceBadge(role) {
  const labels = {
    'Batsman': 'Powerplay',
    'Bowler': 'Strike Rate',
    'All-Rounder': 'Versatility',
    'Wicketkeeper': 'Glove Work',
  };
  return labels[role] || 'Potential';
}

function applyFilters() {
  const q = searchInput?.value.toLowerCase() || '';
  const teamId = filterTeam?.value || '';
  const role = filterRole?.value || '';
  const filtered = allPlayers.filter(p => {
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.teamName.toLowerCase().includes(q);
    const matchesTeam = !teamId || String(p.teamId) === teamId;
    const matchesRole = !role || p.role === role;
    return matchesSearch && matchesTeam && matchesRole;
  });
  renderPlayers(filtered);
}

function populateFilterTeamSelect() {
  if (!filterTeam) return;
  filterTeam.innerHTML = '<option value="">All Squads</option>' +
    allTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

// ── Data load ─────────────────────────────────────────────────────────────────
async function init() {
  try {
    [allTeams, allPlayers] = await Promise.all([api.teams.getAll(), api.players.getAll()]);
    populateTeamSelect();
    populateFilterTeamSelect();
    applyFilters();
  } catch {
    showToast('Failed to load roster data', 'error');
  }
}

function populateTeamSelect() {
  teamSelect.innerHTML = '<option value="">Select Team</option>' +
    allTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderPlayers(players) {
  const metaEl = document.getElementById('players-meta');

  if (!players.length) {
    listEl.innerHTML = '';
    if (metaEl) metaEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  // Stat strip
  if (metaEl) {
    const teamSet = new Set(players.map(p => p.teamId));
    const roleCount = players.reduce((acc, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});
    const topRoles = Object.entries(roleCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

    metaEl.innerHTML = `
      <div class="stat-strip mb-1">
        <div class="stat-strip-item">
          <span class="stat-strip-label">Total Athletes</span>
          <span class="stat-strip-value">${players.length}</span>
        </div>
        <div class="stat-strip-divider"></div>
        <div class="stat-strip-item">
          <span class="stat-strip-label">Squads</span>
          <span class="stat-strip-value">${teamSet.size}</span>
        </div>
        ${topRoles.length ? '<div class="stat-strip-divider"></div>' : ''}
        ${topRoles.map(([role, count], i) => `
          ${i > 0 ? '<div class="stat-strip-divider"></div>' : ''}
          <div class="stat-strip-item">
            <span class="stat-strip-label">${role.split('-')[0]}</span>
            <span class="stat-strip-value">${count}</span>
          </div>`).join('')}
      </div>`;
  }

  // Player cards
  listEl.innerHTML = players.map(p => {
    const avatarCls = roleAvatarClass(p.role);
    const badgeCls  = roleBadge(p.role);
    const inits     = playerInitials(p.name);

    return `
      <div class="glass-card p-5 flex flex-col gap-4">

        <!-- Avatar + Name -->
        <div class="flex items-start gap-3">
          <div class="role-avatar ${avatarCls}">${inits}</div>
          <div class="flex-grow min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h3 class="text-sm font-black text-white truncate tracking-tight leading-tight">${p.name}</h3>
              <span class="inline-block text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider flex-shrink-0 ${badgeCls}">
                ${p.role}
              </span>
            </div>
            <p class="text-[10px] text-brand-muted mt-1 font-bold uppercase tracking-wider truncate">
              ${p.teamName} · Age ${p.age}
            </p>
          </div>
        </div>

        <!-- Bio Pills + Performance -->
        <div class="player-bio-strip">
          <span class="pill-tag">🏏 ${p.battingStyle || 'N/A'}</span>
          <span class="pill-tag">⚡ ${p.bowlingStyle || 'None'}</span>
          <span class="pill-tag pill-tag--accent">📊 ${performanceBadge(p.role)}</span>
        </div>

        <div class="border-t border-white/5"></div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <a href="player-detail.html?id=${p.id}"
             class="flex-1 text-center text-[10px] font-black bg-brand-orange hover:bg-brand-orangeHover text-white px-3 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
            Profile
          </a>
          <button onclick="editPlayer(${p.id})"
                  class="text-[10px] font-black bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 px-3 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
            Edit
          </button>
          <button onclick="deletePlayer(${p.id}, '${p.name.replace(/'/g, "\\'")}')"
                  class="text-[10px] font-black bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
            Del
          </button>
        </div>

      </div>`;
  }).join('');
}

// ── Events ────────────────────────────────────────────────────────────────────
searchInput?.addEventListener('input', applyFilters);
filterTeam?.addEventListener('change', applyFilters);
filterRole?.addEventListener('change', applyFilters);

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

  const teamId = parseInt(document.getElementById('player-team').value, 10);
  if (!teamId) {
    showToast('Please select a squad for this athlete', 'error');
    submitBtn.textContent = 'Save Player'; submitBtn.disabled = false;
    return;
  }

  const body = {
    name:         document.getElementById('player-name').value.trim(),
    age:          parseInt(document.getElementById('player-age').value, 10),
    role:         document.getElementById('player-role').value,
    battingStyle: document.getElementById('player-batting').value,
    bowlingStyle: document.getElementById('player-bowling').value,
    teamId,
  };

  try {
    const saved = editingId
      ? await api.players.update(editingId, body)
      : await api.players.create(body);

    try {
      allPlayers = await api.players.getAll();
    } catch (reloadErr) {
      const idx = allPlayers.findIndex(p => p.id === saved.id);
      if (idx >= 0) allPlayers[idx] = saved;
      else allPlayers.push(saved);
    }

    populateFilterTeamSelect();
    closeModal();
    applyFilters();
    showToast(editingId ? 'Player updated ✓' : 'Player added ✓');
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
    applyFilters();
  } catch (err) { showToast(err.message, 'error'); }
};

document.querySelectorAll('.modal-close, .btn-cancel').forEach(btn =>
  btn.addEventListener('click', closeModal)
);
modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });

init().catch(() => showToast('Failed to load data', 'error'));
