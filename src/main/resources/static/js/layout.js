/**
 * layout.js — Shared sidebar navigation and toast notifications
 */
import { getCoachName, logout } from './auth.js';

const ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>`,
  teams: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  players: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 14v4"/><path d="M10 16h4"/></svg>`,
  practice: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  matches: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19l4-14"/><path d="M20 19l-4-14"/><path d="M8 19h8"/><ellipse cx="12" cy="5" rx="3" ry="2"/></svg>`,
  reports: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};

export function renderNavbar(activePage = '') {
  const nav = [
    { href: 'dashboard.html',         label: 'Dashboard', icon: ICONS.dashboard, section: 'main' },
    { href: 'teams.html',             label: 'Teams',     icon: ICONS.teams,     section: 'main' },
    { href: 'players.html',           label: 'Players',   icon: ICONS.players,   section: 'main' },
    { href: 'practice-sessions.html', label: 'Practice',  icon: ICONS.practice,  section: 'sessions' },
    { href: 'match-sessions.html',    label: 'Matches',   icon: ICONS.matches,   section: 'sessions' },
    { href: 'reports.html',           label: 'Reports',   icon: ICONS.reports,   section: 'analytics' },
  ];

  const sidebarLinks = nav.map(n => {
    const active = activePage === n.href;
    return `
      <a href="${n.href}" class="sidebar-link${active ? ' sidebar-link-active' : ''}">
        ${active ? '<span class="sidebar-active-bar"></span>' : ''}
        <span class="sidebar-icon">${n.icon}</span>
        <span class="sidebar-label">${n.label}</span>
      </a>`;
  }).join('');

  const mobileLinks = nav.map(n => {
    const active = activePage === n.href;
    return `
      <a href="${n.href}" class="mobile-nav-link${active ? ' mobile-nav-link-active' : ''}">
        <span class="mobile-nav-icon">${n.icon}</span>
        <span class="mobile-nav-label">${n.label.split(' ')[0]}</span>
        ${active ? '<span class="mobile-nav-indicator"></span>' : ''}
      </a>`;
  }).join('');

  const html = `
  <!-- Desktop Sidebar -->
  <aside class="app-sidebar hidden lg:flex">
    <a href="dashboard.html" class="sidebar-brand">
      <div class="sidebar-brand-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7A00" stroke-width="2.5" stroke-linecap="round"><path d="M4 19l4-14"/><path d="M20 19l-4-14"/><ellipse cx="12" cy="5" rx="3" ry="2"/></svg>
      </div>
      <div>
        <div class="sidebar-brand-text">CPI<span>.</span></div>
        <div class="sidebar-tagline">Performance Intelligence</div>
      </div>
    </a>

    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Command Center</div>
      ${sidebarLinks}
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-coach-card">
        <div class="sidebar-coach-avatar">🏏</div>
        <div class="min-w-0">
          <div class="sidebar-coach-name" id="coach-name-nav-desktop">Coach</div>
          <div class="sidebar-coach-role">Head Coach</div>
        </div>
      </div>
      <button class="sidebar-logout-btn click-bounce" onclick="window.__logout()">
        ${ICONS.logout}
        Sign Out
      </button>
    </div>
  </aside>

  <!-- Mobile Header -->
  <header class="app-mobile-header lg:hidden">
    <a href="dashboard.html" class="app-mobile-brand">
      <div class="sidebar-brand-icon" style="width:32px;height:32px;border-radius:8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF7A00" stroke-width="2.5" stroke-linecap="round"><path d="M4 19l4-14"/><path d="M20 19l-4-14"/><ellipse cx="12" cy="5" rx="3" ry="2"/></svg>
      </div>
      <span class="app-mobile-brand-text">CPI<span>.</span></span>
    </a>
    <button class="app-mobile-exit click-bounce" onclick="window.__logout()">Exit</button>
  </header>

  <!-- Mobile Bottom Navigation -->
  <div class="app-mobile-nav lg:hidden">
    <nav class="app-mobile-nav-inner">
      ${mobileLinks}
    </nav>
  </div>`;

  const placeholder = document.getElementById('navbar-placeholder');
  if (placeholder) {
    placeholder.innerHTML = html;
  }

  const desktopCoach = document.getElementById('coach-name-nav-desktop');
  if (desktopCoach) {
    desktopCoach.textContent = getCoachName();
  }
  window.__logout = logout;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4 lg:px-0';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const bgClass = type === 'success'
    ? 'bg-green-500/10 border border-green-500/25 text-green-400'
    : 'bg-red-500/10 border border-red-500/25 text-red-400';

  toast.className = `${bgClass} backdrop-blur-xl shadow-2xl font-bold text-xs py-3.5 px-5 rounded-2xl transition-all duration-300 transform translate-x-0 opacity-100 pointer-events-auto`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(12px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ─── Modal helpers ────────────────────────────────────────────────────────────
export function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('hidden');
    el.classList.add('flex');
  }
}
export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('hidden');
    el.classList.remove('flex');
  }
}

// ─── Score color helper ───────────────────────────────────────────────────────
export function scoreColor(val) {
  if (!val) return '#8E8E93';
  if (val >= 7.5) return '#22C55E';
  if (val >= 5)   return '#FF7A00';
  return '#EF4444';
}

export function formatScore(val) {
  return val != null ? val.toFixed(1) : '—';
}
