/**
 * dashboard.js — Dashboard page logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast, formatScore, scoreColor } from './layout.js';

requireAuth();
renderNavbar('dashboard.html');

async function loadDashboard() {
  try {
    const data = await api.dashboard.get();
    document.getElementById('total-teams').textContent   = data.totalTeams;
    document.getElementById('total-players').textContent = data.totalPlayers;
    const cpi = data.averageCpi;
    const cpiEl = document.getElementById('avg-cpi');
    cpiEl.textContent = formatScore(cpi);
    cpiEl.style.color = scoreColor(cpi);
  } catch (e) {
    showToast('Failed to load dashboard', 'error');
  }
}

loadDashboard();
