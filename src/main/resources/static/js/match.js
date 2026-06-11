/**
 * match.js — Match Sessions + MPI Score logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast, openModal, closeModal } from './layout.js';

requireAuth();
const isMatchScore = window.location.pathname.includes('match-score');
if (isMatchScore) { renderNavbar('match-sessions.html'); initScorePage(); }
else              { renderNavbar('match-sessions.html'); initSessionsPage(); }

async function initSessionsPage() {
  let teams = [], sessions = [];
  try { [teams, sessions] = await Promise.all([api.teams.getAll(), api.matchSessions.getAll()]); }
  catch { showToast('Failed to load data', 'error'); return; }

  const teamSelect = document.getElementById('session-team');
  teamSelect.innerHTML = '<option value="">Select Team</option>' +
    teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  renderSessions(sessions);

  document.getElementById('add-session-btn').addEventListener('click', () => {
    document.getElementById('session-form').reset(); openModal('session-modal');
  });
  document.getElementById('session-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api.matchSessions.create({
        teamId:   parseInt(teamSelect.value),
        opponent: document.getElementById('session-opponent').value.trim(),
        date:     document.getElementById('session-date').value,
        notes:    document.getElementById('session-notes').value.trim(),
      });
      showToast('Match session created'); closeModal('session-modal');
      sessions = await api.matchSessions.getAll(); renderSessions(sessions);
    } catch (err) { showToast(err.message, 'error'); }
  });
  document.querySelectorAll('.modal-close,.btn-cancel').forEach(b =>
    b.addEventListener('click', () => closeModal('session-modal')));
}

function renderSessions(sessions) {
  const listEl = document.getElementById('sessions-list');
  const emptyEl = document.getElementById('sessions-empty');
  if (!sessions.length) { listEl.innerHTML = ''; emptyEl.classList.remove('hidden'); return; }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = sessions.map(s => `
    <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;">
      <div>
        <div style="font-weight:700;">vs ${s.opponent}</div>
        <div style="color:var(--text-secondary);font-size:0.82rem;margin-top:0.2rem;">
          ${s.teamName} · 📅 ${s.date} ${s.notes ? '· ' + s.notes : ''}
        </div>
      </div>
      <div class="flex gap-1">
        <a href="match-score.html?sessionId=${s.id}&teamId=${s.teamId}" class="btn btn-primary btn-sm">Score Players</a>
        <button class="btn btn-danger btn-sm" onclick="deleteSession(${s.id})">Delete</button>
      </div>
    </div>`).join('');
}

window.deleteSession = async (id) => {
  if (!confirm('Delete this match session?')) return;
  try { await api.matchSessions.delete(id); showToast('Deleted');
    renderSessions(await api.matchSessions.getAll()); }
  catch (err) { showToast(err.message, 'error'); }
};

async function initScorePage() {
  const params    = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId');
  const teamId    = params.get('teamId');
  if (!sessionId) { window.location.href = 'match-sessions.html'; return; }

  let players = [], existing = [];
  try { [players, existing] = await Promise.all([api.players.getAll(teamId), api.mpi.getBySession(sessionId)]); }
  catch { showToast('Failed to load', 'error'); return; }

  const scoreMap = {};
  existing.forEach(s => { scoreMap[s.playerId] = s; });
  const container = document.getElementById('score-list');
  const pillars = ['technicalExecution','decisionMaking','matchAwareness','mentalResilience','competitiveImpact'];
  const labels  = ['Technical Execution','Decision Making','Match Awareness','Mental Resilience','Competitive Impact'];

  if (!players.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">👤</div><h3>No players in this team</h3></div>';
    return;
  }
  container.innerHTML = players.map(p => {
    const ex = scoreMap[p.id];
    const sliders = pillars.map((key, i) => `
      <div class="slider-group">
        <div class="slider-label">
          <span>${labels[i]}</span>
          <span class="slider-value" id="val-${p.id}-${key}">${ex ? ex[key] : 5}</span>
        </div>
        <input type="range" min="1" max="10" value="${ex ? ex[key] : 5}" id="slider-${p.id}-${key}"
               oninput="document.getElementById('val-${p.id}-${key}').textContent=this.value">
      </div>`).join('');
    return `
      <div class="card" style="margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">
          <div><div style="font-weight:700;">${p.name}</div>
               <div style="color:var(--text-secondary);font-size:0.8rem;">${p.role}</div></div>
          ${ex ? `<span class="badge badge-green">MPI: ${ex.mpi.toFixed(1)}</span>` : '<span class="badge badge-gray">Not scored</span>'}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem;">${sliders}</div>
        <button class="btn btn-primary btn-sm" onclick="saveScore(${sessionId},${p.id})">Save MPI Score</button>
      </div>`;
  }).join('');
}

window.saveScore = async (sessionId, playerId) => {
  const pillars = ['technicalExecution','decisionMaking','matchAwareness','mentalResilience','competitiveImpact'];
  const body = { playerId };
  pillars.forEach(k => { body[k] = parseInt(document.getElementById(`slider-${playerId}-${k}`).value); });
  try { await api.mpi.save(sessionId, body); showToast('MPI score saved ✓'); initScorePage(); }
  catch (err) { showToast(err.message, 'error'); }
};
