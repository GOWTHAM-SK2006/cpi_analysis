/**
 * match.js — Match Sessions + MPI Score logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast } from './layout.js';

requireAuth();

const isMatchScore = window.location.pathname.includes('match-score');
if (isMatchScore) { renderNavbar('match-sessions.html'); initScorePage(); }
else              { renderNavbar('match-sessions.html'); initSessionsPage(); }

// ── SESSIONS PAGE ────────────────────────────────────────────────────────────
async function initSessionsPage() {
  const modalEl = document.getElementById('session-modal');

  function openModal()  { modalEl.classList.remove('hidden'); modalEl.classList.add('flex'); }
  function closeModal() { modalEl.classList.add('hidden'); modalEl.classList.remove('flex'); }

  let teams = [], sessions = [];
  try {
    [teams, sessions] = await Promise.all([api.teams.getAll(), api.matchSessions.getAll()]);
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
      await api.matchSessions.create({
        teamId:   parseInt(teamSelect.value),
        opponent: document.getElementById('session-opponent').value.trim(),
        date:     document.getElementById('session-date').value,
        notes:    document.getElementById('session-notes').value.trim(),
      });
      showToast('Match session created ✓');
      closeModal();
      sessions = await api.matchSessions.getAll();
      renderSessions(sessions);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.textContent = 'Create Match'; btn.disabled = false;
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
    <div class="bg-brand-card border border-brand-border rounded-2xl px-5 py-4 flex items-center justify-between gap-4 hover:border-brand-orange/40 transition-all duration-200" style="box-shadow:0 4px 20px rgba(0,0,0,0.4)">
      <div class="flex items-center gap-4 min-w-0">
        <div class="w-10 h-10 flex-shrink-0 bg-brand-orange/10 border border-brand-orange/20 rounded-xl flex items-center justify-center text-lg">🏏</div>
        <div class="min-w-0">
          <div class="font-bold text-white text-sm">vs ${s.opponent}</div>
          <div class="text-brand-muted text-xs mt-0.5">
            ${s.teamName} · 📅 ${s.date}${s.notes ? ' · ' + s.notes : ''}
          </div>
        </div>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <a href="match-score.html?sessionId=${s.id}&teamId=${s.teamId}"
          class="text-xs font-bold px-3 py-1.5 rounded-lg bg-brand-orange hover:bg-orange-600 text-white transition-all">
          Score Players
        </a>
        <button onclick="deleteSession(${s.id})"
          class="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-900/40 text-red-400 hover:bg-red-950/20 transition-all">
          Delete
        </button>
      </div>
    </div>`).join('');
}

window.deleteSession = async (id) => {
  if (!confirm('Delete this match session?')) return;
  try {
    await api.matchSessions.delete(id);
    showToast('Deleted');
    renderSessions(await api.matchSessions.getAll());
  } catch (err) { showToast(err.message, 'error'); }
};

// ── SCORE PAGE ───────────────────────────────────────────────────────────────
async function initScorePage() {
  const params    = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId');
  const teamId    = params.get('teamId');
  if (!sessionId) { window.location.href = 'match-sessions.html'; return; }

  let players = [], existing = [];
  try {
    [players, existing] = await Promise.all([api.players.getAll(teamId), api.mpi.getBySession(sessionId)]);
  } catch {
    showToast('Failed to load data', 'error');
    return;
  }

  const scoreMap = {};
  existing.forEach(s => { scoreMap[s.playerId] = s; });

  const container = document.getElementById('score-list');
  const pillars = ['technicalExecution','decisionMaking','matchAwareness','mentalResilience','competitiveImpact'];
  const labels  = ['Technical Execution','Decision Making','Match Awareness','Mental Resilience','Competitive Impact'];

  if (!players.length) {
    container.innerHTML = `
      <div class="bg-brand-card border border-brand-border rounded-2xl p-12 text-center">
        <div class="text-5xl mb-4">👤</div>
        <h3 class="text-lg font-bold text-white">No players in this team</h3>
        <p class="text-brand-muted text-sm mt-1">Add players to the squad first.</p>
      </div>`;
    return;
  }

  container.innerHTML = players.map(p => {
    const ex = scoreMap[p.id];

    const sliders = pillars.map((key, i) => `
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-center">
          <label class="text-xs font-semibold text-brand-muted">${labels[i]}</label>
          <span class="text-xs font-black text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2 py-0.5 rounded-md min-w-[28px] text-center" id="val-${p.id}-${key}">${ex ? ex[key] : 5}</span>
        </div>
        <input type="range" min="1" max="10" value="${ex ? ex[key] : 5}"
          id="slider-${p.id}-${key}"
          oninput="document.getElementById('val-${p.id}-${key}').textContent=this.value"
          class="w-full h-2 rounded-full appearance-none bg-brand-border cursor-pointer">
      </div>`).join('');

    const badge = ex
      ? `<span class="text-xs font-bold bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-1 rounded-lg">MPI: ${ex.mpi.toFixed(1)}</span>`
      : `<span class="text-xs font-bold bg-brand-border/50 border border-brand-border text-brand-muted px-2.5 py-1 rounded-lg">Not scored</span>`;

    return `
      <div class="bg-brand-card border border-brand-border rounded-2xl p-6" style="box-shadow:0 4px 20px rgba(0,0,0,0.4)">
        <div class="flex justify-between items-center mb-6">
          <div>
            <div class="font-bold text-white text-base">${p.name}</div>
            <div class="text-brand-muted text-xs mt-0.5">${p.role}</div>
          </div>
          ${badge}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          ${sliders}
        </div>
        <button onclick="saveScore(${sessionId},${p.id})"
          class="w-full bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-sm py-3 rounded-xl transition-all active:scale-[0.98]">
          Save MPI Score
        </button>
      </div>`;
  }).join('');
}

window.saveScore = async (sessionId, playerId) => {
  const pillars = ['technicalExecution','decisionMaking','matchAwareness','mentalResilience','competitiveImpact'];
  const body = { playerId };
  pillars.forEach(k => { body[k] = parseInt(document.getElementById(`slider-${playerId}-${k}`).value); });
  try {
    await api.mpi.save(sessionId, body);
    showToast('MPI score saved ✓');
    initScorePage();
  } catch (err) { showToast(err.message, 'error'); }
};
