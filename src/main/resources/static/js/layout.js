/**
 * layout.js — Shared navbar renderer and toast notifications
 */
import { getCoachName, logout } from './auth.js';

export function renderNavbar(activePage = '') {
  const nav = [
    { href: 'dashboard.html',         label: 'Dash',  icon: '🏠' },
    { href: 'teams.html',             label: 'Teams', icon: '👥' },
    { href: 'players.html',           label: 'Squad', icon: '🏃' },
    { href: 'practice-sessions.html', label: 'Pract', icon: '🎯' },
    { href: 'match-sessions.html',    label: 'Match', icon: '🏏' },
    { href: 'reports.html',           label: 'Reprt', icon: '📊' },
  ];

  const links = nav.map(n => {
    const active = activePage === n.href;
    return `
      <a href="${n.href}" class="flex flex-col items-center justify-center py-2 px-1 text-center transition-all duration-300 relative group flex-1 ${
        active 
          ? 'text-brand-orange' 
          : 'text-gray-400 hover:text-white'
      }">
        <span class="text-lg mb-1 filter drop-shadow-[0_0_8px_rgba(255,122,0,0.25)] transition-transform duration-300 group-active:scale-95">${n.icon}</span>
        <span class="text-[9px] font-bold tracking-tight uppercase">${n.label}</span>
        ${active ? '<span class="absolute top-0 w-8 h-0.5 bg-brand-orange rounded-full shadow-[0_0_10px_#FF7A00]"></span>' : ''}
      </a>`;
  }).join('');

  const html = `
  <!-- Sticky Top Header -->
  <header class="sticky top-0 z-40 bg-brand-card/85 backdrop-blur-lg border-b border-brand-border px-4 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
    <a href="dashboard.html" class="text-base font-black tracking-tight text-white flex items-center gap-0.5 select-none">
      CPI<span class="text-brand-orange">.</span>
    </a>
    <div class="flex items-center gap-2">
      <span class="text-[9px] font-black uppercase text-brand-muted bg-[#0d0d0d] border border-brand-border px-2.5 py-1.5 rounded-lg" id="coach-name-nav"></span>
      <button class="bg-[#0d0d0d] hover:bg-red-950/20 border border-brand-border hover:border-red-900/40 text-red-400 hover:text-red-300 text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg transition-all click-bounce" onclick="window.__logout()">
        Exit
      </button>
    </div>
  </header>

  <!-- Centered Fixed Bottom Navigation Bar -->
  <div class="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
    <nav class="w-full max-w-md md:max-w-lg bg-brand-card/90 backdrop-blur-md border-t border-brand-border flex justify-around px-1 py-1 shadow-[0_-8px_24px_rgba(0,0,0,0.6)] pointer-events-auto">
      ${links}
    </nav>
  </div>`;

  const placeholder = document.getElementById('navbar-placeholder');
  if (placeholder) {
    placeholder.innerHTML = html;
  }
  
  const el = document.getElementById('coach-name-nav');
  if (el) {
    el.textContent = getCoachName();
  }
  window.__logout = logout;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-xs px-4';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const bgClass = type === 'success' 
    ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
    : 'bg-red-500/10 border border-red-500/20 text-red-400';
  
  toast.className = `${bgClass} backdrop-blur-md shadow-2xl font-bold text-xs py-3 px-4 rounded-xl text-center transition-all duration-300 transform translate-y-0 opacity-100 pointer-events-auto`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => { 
    toast.style.opacity = '0'; 
    toast.style.transform = 'translateY(-10px)';
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
