/**
 * layout.js — Shared navbar renderer and toast notifications
 */
import { getCoachName, getAcademyName, logout } from './auth.js';

export function renderNavbar(activePage = '') {
  const nav = [
    { href: 'dashboard.html',         label: 'Dashboard',  icon: '⊞' },
    { href: 'teams.html',             label: 'Teams',      icon: '🛡' },
    { href: 'players.html',           label: 'Players',    icon: '👤' },
    { href: 'practice-sessions.html', label: 'Practice',   icon: '🎯' },
    { href: 'match-sessions.html',    label: 'Matches',    icon: '🏏' },
    { href: 'reports.html',           label: 'Reports',    icon: '📊' },
  ];

  const links = nav.map(n => `
    <a href="${n.href}" class="nav-link ${activePage === n.href ? 'active' : ''}">
      <span>${n.icon}</span>${n.label}
    </a>`).join('');

  const html = `
  <nav class="navbar">
    <div class="container flex items-center justify-between">
      <a href="dashboard.html" class="navbar-brand">CPI<span>.</span></a>
      <div class="navbar-nav">${links}</div>
      <div class="flex items-center gap-2">
        <span style="font-size:0.8rem;color:var(--text-secondary);display:none" id="coach-name-nav"></span>
        <button class="btn btn-secondary btn-sm" onclick="window.__logout()">Logout</button>
      </div>
    </div>
  </nav>`;

  document.getElementById('navbar-placeholder').innerHTML = html;
  const el = document.getElementById('coach-name-nav');
  if (el) { el.textContent = getCoachName(); el.style.display = ''; }
  window.__logout = logout;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ─── Modal helpers ────────────────────────────────────────────────────────────
export function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
export function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ─── Score color helper ───────────────────────────────────────────────────────
export function scoreColor(val) {
  if (!val) return 'var(--text-muted)';
  if (val >= 7.5) return 'var(--success)';
  if (val >= 5)   return 'var(--orange)';
  return 'var(--danger)';
}

export function formatScore(val) {
  return val != null ? val.toFixed(1) : '—';
}
