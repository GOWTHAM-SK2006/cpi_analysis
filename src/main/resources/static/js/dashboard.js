/**
 * dashboard.js — Dashboard page logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast, formatScore, scoreColor } from './layout.js';

console.log('[Dashboard] Script initialized.');

// Verify authentication and retrieve token
try {
  console.log('[Dashboard] Enforcing authentication check...');
  requireAuth();
  console.log('[Dashboard] Authentication check passed. Token in localStorage is:', localStorage.getItem('cpi_token') ? 'PRESENT' : 'MISSING');
} catch (err) {
  console.error('[Dashboard] Error during authentication check:', err);
}

// Render the navbar
try {
  console.log('[Dashboard] Rendering navbar...');
  renderNavbar('dashboard.html');
} catch (err) {
  console.error('[Dashboard] Error rendering navbar:', err);
}

async function loadDashboard() {
  console.log('[Dashboard] Querying dashboard stats from /api/dashboard...');
  try {
    const data = await api.dashboard.get();
    console.log('[Dashboard] Successfully retrieved dashboard data:', data);
    
    document.getElementById('total-teams').textContent   = data.totalTeams;
    document.getElementById('total-players').textContent = data.totalPlayers;
    
    const cpi = data.averageCpi;
    const cpiEl = document.getElementById('avg-cpi');
    cpiEl.textContent = formatScore(cpi);
    cpiEl.style.color = scoreColor(cpi);
    
    console.log('[Dashboard] Updated dashboard metrics on UI.');
  } catch (e) {
    console.error('[Dashboard] Failed to retrieve dashboard data:', e);
    showToast('Failed to load dashboard', 'error');
  }
}

// Fetch dashboard data
loadDashboard();
