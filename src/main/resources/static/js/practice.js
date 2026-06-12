/**
 * practice.js — Practice Sessions + PPI Score logic (premium UI)
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast } from './layout.js';

requireAuth();

const isPracticeScore = window.location.pathname.includes('practice-score');

if (isPracticeScore) {
  renderNavbar('practice-sessions.html');
  initScorePage();
} else {
  renderNavbar('practice-sessions.html');
  initSessionsPage();
}

// ── Helper: format ISO date → "Jun 12, 2026" ──────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}, ${parts[0]}`;
}

// ── SESSIONS PAGE ─────────────────────────────────────────────────────────────
async function initSessionsPage() {
  const modalEl = document.getElementById('session-modal');

  function openModal()  { modalEl.classList.remove('hidden'); modalEl.classList.add('flex'); }
  function closeModal() { modalEl.classList.add('hidden'); modalEl.classList.remove('flex'); }

  let teams = [], sessions = [];
  try {
    [teams, sessions] = await Promise.all([api.teams.getAll(), api.practiceSessions.getAll()]);
  } catch {
    showToast('Failed to load data', 'error');
    return;
  }

  const teamSelect = document.getElementById('session-team');
  teamSelect.innerHTML = '<option value="">Select Team</option>' +
    teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

  renderSessions(sessions);

  document.getElementById('add-session-btn').addEventListener('click', () => {
    document.getElementById('session-form').reset();
    openModal();
  });

  document.getElementById('session-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('[type="submit"]');
    btn.textContent = 'Creating...'; btn.disabled = true;
    try {
      await api.practiceSessions.create({
        teamId: parseInt(teamSelect.value),
        date:   document.getElementById('session-date').value,
        notes:  document.getElementById('session-notes').value.trim(),
      });
      showToast('Session created ✓');
      closeModal();
      sessions = await api.practiceSessions.getAll();
      renderSessions(sessions);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.textContent = 'Save Log'; btn.disabled = false;
    }
  });

  document.querySelectorAll('.modal-close,.btn-cancel').forEach(b =>
    b.addEventListener('click', closeModal)
  );
  modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });
}

function renderSessions(sessions) {
  const listEl  = document.getElementById('sessions-list');
  const emptyEl = document.getElementById('sessions-empty');
  const metaEl  = document.getElementById('sessions-meta');

  if (!sessions.length) {
    listEl.innerHTML = '';
    if (metaEl) metaEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  // ── Stat Strip ──────────────────────────────────────────────────────────────
  if (metaEl) {
    const teamSet = new Set(sessions.map(s => s.teamId));
    const latestDate = formatDate(
      sessions.slice().sort((a, b) => b.date.localeCompare(a.date))[0]?.date
    );

    metaEl.innerHTML = `
      <div class="stat-strip mb-1">
        <div class="stat-strip-item">
          <span class="stat-strip-label">Total Sessions</span>
          <span class="stat-strip-value">${sessions.length}</span>
        </div>
        <div class="stat-strip-divider"></div>
        <div class="stat-strip-item">
          <span class="stat-strip-label">Squads</span>
          <span class="stat-strip-value">${teamSet.size}</span>
        </div>
        <div class="stat-strip-divider"></div>
        <div class="stat-strip-item">
          <span class="stat-strip-label">Latest</span>
          <span class="stat-strip-value" style="font-size:0.75rem;">${latestDate}</span>
        </div>
        <div class="live-indicator" style="margin-left:auto;">
          <span class="live-dot"></span>
          PPI Active
        </div>
      </div>`;
  }

  // ── Session Cards ────────────────────────────────────────────────────────────
  listEl.innerHTML = sessions.map(s => `
    <div class="glass-card overflow-hidden flex">
      <div class="session-card-line session-card-line--practice"></div>
      <div class="p-5 flex flex-col gap-4 flex-grow min-w-0">

        <!-- Header -->
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-brand-orange/10 border border-brand-orange/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
            🎯
          </div>
          <div class="flex-grow min-w-0">
            <h3 class="text-sm font-black text-white tracking-tight truncate">${s.teamName}</h3>
            <div class="date-chip mt-1.5">📅 ${formatDate(s.date)}</div>
          </div>
          <span class="text-[9px] font-bold text-brand-orange bg-brand-orange/10 border border-brand-orange/15 px-2 py-1 rounded-lg uppercase tracking-wider flex-shrink-0">PPI</span>
        </div>

        ${s.notes ? `<div class="session-notes">${s.notes}</div>` : ''}

        <!-- Actions -->
        <div class="flex gap-2 mt-auto">
          <a href="practice-score.html?sessionId=${s.id}&teamId=${s.teamId}"
             class="flex-1 text-center text-[10px] font-black bg-brand-orange hover:bg-brand-orangeHover text-white px-4 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
            Score Players
          </a>
          <button onclick="deleteSession(${s.id})"
                  class="text-[10px] font-black bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
            Delete
          </button>
        </div>

      </div>
    </div>`).join('');
}

window.deleteSession = async (id) => {
  if (!confirm('Delete this practice session?')) return;
  try {
    await api.practiceSessions.delete(id);
    showToast('Session deleted');
    renderSessions(await api.practiceSessions.getAll());
  } catch (err) { showToast(err.message, 'error'); }
};

// ── SCORE PAGE ────────────────────────────────────────────────────────────────
async function initScorePage() {
  const params    = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId');
  const teamId    = params.get('teamId');
  if (!sessionId) { window.location.href = 'practice-sessions.html'; return; }

  let players = [], existing = [];
  try {
    [players, existing] = await Promise.all([
      api.players.getAll(teamId),
      api.ppi.getBySession(sessionId),
    ]);
  } catch {
    showToast('Failed to load data', 'error');
    return;
  }

  const scoreMap = {};
  existing.forEach(s => { scoreMap[s.playerId] = s; });

  const container = document.getElementById('score-list');
  const pillars   = ['trainingIntensity','skillExecution','focus','coachability','adaptability'];
  const labels    = ['Training Intensity','Skill Execution','Focus','Coachability','Adaptability'];

  if (!players.length) {
    container.innerHTML = `
      <div class="glass-card p-12 text-center">
        <div class="text-4xl mb-3">👤</div>
        <h3 class="text-sm font-black text-white uppercase tracking-wider">No players in this team</h3>
        <p class="text-xs text-brand-muted mt-1">Add players to the squad first.</p>
      </div>`;
    return;
  }

  container.innerHTML = players.map(p => {
    const ex = scoreMap[p.id];

    const sliders = pillars.map((key, i) => `
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <label class="text-[10px] font-bold text-brand-muted uppercase tracking-wider">${labels[i]}</label>
          <span class="text-xs font-black text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2.5 py-0.5 rounded-md min-w-[32px] text-center" id="val-${p.id}-${key}">${ex ? ex[key] : 5}</span>
        </div>
        <input type="range" min="1" max="10" value="${ex ? ex[key] : 5}"
          id="slider-${p.id}-${key}"
          oninput="document.getElementById('val-${p.id}-${key}').textContent=this.value"
          class="w-full app-slider">
      </div>`).join('');

    const badge = ex
      ? `<span class="score-badge score-badge--${ex.ppi >= 7.5 ? 'high' : ex.ppi >= 5 ? 'mid' : 'low'}">PPI ${ex.ppi.toFixed(1)}</span>`
      : `<span class="score-badge score-badge--none">Not Scored</span>`;

    return `
      <div class="glass-card p-6 md:p-8">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="font-black text-white text-base tracking-tight">${p.name}</h3>
            <p class="text-brand-muted text-xs mt-0.5">${p.role} · ${p.teamName}</p>
          </div>
          ${badge}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          ${sliders}
        </div>
        <button onclick="saveScore(${sessionId},${p.id})"
          class="w-full bg-brand-orange hover:bg-brand-orangeHover text-white font-extrabold text-xs py-3 rounded-xl transition-all click-bounce uppercase tracking-wider">
          Save PPI Score
        </button>
      </div>`;
  }).join('');
}

window.saveScore = async (sessionId, playerId) => {
  const pillars = ['trainingIntensity','skillExecution','focus','coachability','adaptability'];
  const body = { playerId };
  pillars.forEach(k => {
    body[k] = parseInt(document.getElementById(`slider-${playerId}-${k}`).value);
  });
  try {
    await api.ppi.save(sessionId, body);
    showToast('PPI score saved ✓');
    initScorePage();
  } catch (err) { showToast(err.message, 'error'); }
};
