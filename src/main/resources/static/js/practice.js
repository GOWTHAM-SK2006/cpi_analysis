/**
 * practice.js — Practice Sessions + PPI Score logic
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

// ── SESSIONS PAGE ────────────────────────────────────────────────────────────
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
      btn.textContent = 'Create Session'; btn.disabled = false;
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

  if (!sessions.length) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  listEl.innerHTML = sessions.map(s => `
    <div class="glass-card p-6 md:p-8 flex flex-col justify-between gap-6">
      
      <!-- Top Session Info -->
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 bg-brand-orange/15 border border-brand-orange/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
          🎯
        </div>
        <div class="min-w-0">
          <h3 class="text-base font-black text-white tracking-tight truncate">${s.teamName}</h3>
          <p class="text-xs text-brand-muted mt-1">📅 ${s.date}</p>
          ${s.notes ? `<p class="text-xs text-brand-muted mt-2 italic bg-white/5 border border-white/5 p-2.5 rounded-xl">${s.notes}</p>` : ''}
        </div>
      </div>

      <!-- Action items -->
      <div class="flex items-center gap-2">
        <a href="practice-score.html?sessionId=${s.id}&teamId=${s.teamId}" 
           class="flex-1 text-center text-[10px] font-black bg-brand-orange hover:bg-brand-orangeHover text-white px-4 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
          Score Players
        </a>
        <button onclick="deleteSession(${s.id})" 
                class="text-[10px] font-black bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-4 py-2.5 rounded-xl transition-all click-bounce uppercase tracking-wider">
          Delete
        </button>
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

// ── SCORE PAGE ───────────────────────────────────────────────────────────────
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
      ? `<span class="text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-xl uppercase">PPI: ${ex.ppi.toFixed(1)}</span>`
      : `<span class="text-xs font-bold bg-white/5 border border-white/5 text-brand-muted px-3 py-1 rounded-xl uppercase">Not Scored</span>`;

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
