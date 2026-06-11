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

// Global charts variables
let performanceChartInstance = null;
let pillarsChartInstance = null;

function renderCharts(cpiVal) {
  // Chart 1: Performance Trend Line Chart
  const ctx = document.getElementById('performanceChart').getContext('2d');
  
  // Custom styling for Chart
  const ppiGradient = ctx.createLinearGradient(0, 0, 0, 300);
  ppiGradient.addColorStop(0, 'rgba(255, 122, 0, 0.4)');
  ppiGradient.addColorStop(1, 'rgba(255, 122, 0, 0.0)');
  
  const mpiGradient = ctx.createLinearGradient(0, 0, 0, 300);
  mpiGradient.addColorStop(0, 'rgba(156, 163, 175, 0.3)');
  mpiGradient.addColorStop(1, 'rgba(156, 163, 175, 0.0)');

  const baseCpi = cpiVal || 7.5;

  performanceChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5', 'Session 6'],
      datasets: [
        {
          label: 'Practice (PPI)',
          data: [baseCpi - 0.4, baseCpi - 0.2, baseCpi + 0.1, baseCpi - 0.1, baseCpi + 0.3, baseCpi + 0.2],
          borderColor: '#FF7A00',
          borderWidth: 3,
          backgroundColor: ppiGradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#FF7A00',
          pointHoverRadius: 7
        },
        {
          label: 'Match (MPI)',
          data: [baseCpi - 0.7, baseCpi - 0.5, baseCpi - 0.2, baseCpi - 0.4, baseCpi, baseCpi - 0.1],
          borderColor: '#9CA3AF',
          borderWidth: 2,
          backgroundColor: mpiGradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#9CA3AF',
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#7F7F7F', font: { family: 'Outfit' } }
        },
        y: {
          min: 0,
          max: 10,
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#7F7F7F', font: { family: 'Outfit' } }
        }
      }
    }
  });

  // Chart 2: Radar Chart for Performance Pillars
  const radarCtx = document.getElementById('pillarsChart').getContext('2d');
  pillarsChartInstance = new Chart(radarCtx, {
    type: 'radar',
    data: {
      labels: ['Intensity', 'Execution', 'Focus', 'Coachability', 'Adaptability'],
      datasets: [{
        label: 'Average Score',
        data: [8.2, 7.5, 8.8, 7.9, 7.2],
        backgroundColor: 'rgba(255, 122, 0, 0.2)',
        borderColor: '#FF7A00',
        borderWidth: 2,
        pointBackgroundColor: '#FF7A00',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          pointLabels: { color: '#7F7F7F', font: { family: 'Outfit', size: 10 } },
          ticks: { display: false },
          min: 0,
          max: 10
        }
      }
    }
  });
}

async function loadDashboard() {
  console.log('[Dashboard] Querying dashboard stats from /api/dashboard...');
  try {
    const data = await api.dashboard.get();
    console.log('[Dashboard] Successfully retrieved dashboard data:', data);
    
    document.getElementById('total-teams').textContent   = data.totalTeams;
    document.getElementById('total-players').textContent = data.totalPlayers;
    document.getElementById('total-sessions').textContent = data.totalSessions;
    
    const cpi = data.averageCpi;
    const cpiEl = document.getElementById('avg-cpi');
    cpiEl.textContent = formatScore(cpi);
    cpiEl.style.color = scoreColor(cpi);
    
    console.log('[Dashboard] Updated dashboard metrics on UI.');
    
    renderCharts(cpi);
  } catch (e) {
    console.error('[Dashboard] Failed to retrieve dashboard data:', e);
    showToast('Failed to load dashboard', 'error');
    renderCharts(7.5);
  }
}

// Fetch dashboard data
loadDashboard();
