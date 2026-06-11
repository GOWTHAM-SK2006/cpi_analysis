/**
 * layout.js — Shared navbar renderer and toast notifications
 */
import { getCoachName, getAcademyName, logout } from './auth.js';

export function renderNavbar(activePage = '') {
  const nav = [
    { href: 'dashboard.html',         label: 'Dashboard',  icon: '⊞' },
    { href: 'teams.html',             label: 'Teams',      icon: '🛡️' },
    { href: 'players.html',           label: 'Players',    icon: '👤' },
    { href: 'practice-sessions.html', label: 'Practice',   icon: '🎯' },
    { href: 'match-sessions.html',    label: 'Matches',    icon: '🏏' },
    { href: 'reports.html',           label: 'Reports',    icon: '📊' },
  ];

  const links = nav.map(n => {
    const active = activePage === n.href;
    return `
      <a href="${n.href}" class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
        active 
          ? 'bg-brand-orange text-brand-bg shadow-md shadow-brand-orange/15' 
          : 'text-gray-400 hover:text-white hover:bg-brand-border/40'
      }">
        <span class="text-sm">${n.icon}</span>
        <span>${n.label}</span>
      </a>`;
  }).join('');

  const html = `
  <nav class="bg-brand-card/90 backdrop-blur-md border-b border-brand-border py-4 px-4 shadow-xl">
    <div class="container mx-auto max-w-7xl flex items-center justify-between">
      <!-- Brand Logo -->
      <a href="dashboard.html" class="text-2xl font-black tracking-tight text-white flex items-center gap-1 select-none">
        CPI<span class="text-brand-orange">.</span>
      </a>
      
      <!-- Desktop Nav Links -->
      <div class="hidden md:flex items-center gap-1.5">
        ${links}
      </div>
      
      <!-- Profile & Logout Actions -->
      <div class="flex items-center gap-4">
        <span class="hidden sm:inline-block text-xs font-semibold text-brand-muted bg-brand-bg border border-brand-border px-3 py-1.5 rounded-lg" id="coach-name-nav"></span>
        <button class="bg-brand-bg hover:bg-red-950/20 border border-brand-border hover:border-red-900/40 text-red-400 hover:text-red-300 text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all duration-300" onclick="window.__logout()">
          Logout
        </button>
      </div>
    </div>
    
    <!-- Mobile Nav Bar (Visible on smaller viewports) -->
    <div class="md:hidden flex items-center justify-around gap-1 mt-4 pt-3.5 border-t border-brand-border/60 overflow-x-auto whitespace-nowrap">
      ${nav.map(n => {
        const active = activePage === n.href;
        return `
          <a href="${n.href}" class="flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition-all duration-300 ${
            active 
              ? 'text-brand-orange' 
              : 'text-brand-muted'
          }">
            <span class="text-base">${n.icon}</span>
            <span>${n.label}</span>
          </a>`;
      }).join('')}
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
    container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-green-500 text-brand-bg' : 'bg-red-500 text-white';
  
  toast.className = `${bgClass} shadow-2xl font-bold text-xs py-3 px-5 rounded-xl transition-all duration-300 transform translate-y-0 opacity-100 pointer-events-auto`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => { 
    toast.style.opacity = '0'; 
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300); 
  }, 3000);
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
  if (!val) return '#7F7F7F'; // Muted Gray
  if (val >= 7.5) return '#22C55E'; // Success Green
  if (val >= 5)   return '#FF7A00'; // Orange
  return '#EF4444'; // Danger Red
}

export function formatScore(val) {
  return val != null ? val.toFixed(1) : '—';
}
