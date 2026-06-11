/**
 * dashboard.js — Dashboard page logic
 */
import { requireAuth, getCoachName, getAcademyName } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast, formatScore, scoreColor } from './layout.js';

console.log('[Dashboard] Script initialized.');

// Verify authentication
try {
  requireAuth();
} catch (err) {
  console.error('[Dashboard] Auth enforcement failed:', err);
}

// Render mobile bottom navigation bar
renderNavbar('dashboard.html');

// Global charts variables
let performanceChartInstance = null;
let pillarsChartInstance = null;

function renderCharts(cpiVal) {
  // Chart 1: Performance Trend Line Chart
  const trendEl = document.getElementById('performanceChart');
  if (trendEl) {
    const ctx = trendEl.getContext('2d');
    
    // Custom styling for Chart
    const ppiGradient = ctx.createLinearGradient(0, 0, 0, 150);
    ppiGradient.addColorStop(0, 'rgba(255, 122, 0, 0.4)');
    ppiGradient.addColorStop(1, 'rgba(255, 122, 0, 0.0)');
    
    const mpiGradient = ctx.createLinearGradient(0, 0, 0, 150);
    mpiGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    mpiGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    const baseCpi = cpiVal || 7.5;

    if (performanceChartInstance) performanceChartInstance.destroy();

    performanceChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
        datasets: [
          {
            label: 'Practice (PPI)',
            data: [baseCpi - 0.4, baseCpi - 0.2, baseCpi + 0.1, baseCpi - 0.1, baseCpi + 0.3, baseCpi + 0.2],
            borderColor: '#FF7A00',
            borderWidth: 2.5,
            backgroundColor: ppiGradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#FF7A00',
            pointHoverRadius: 6,
            pointRadius: 3
          },
          {
            label: 'Match (MPI)',
            data: [baseCpi - 0.7, baseCpi - 0.5, baseCpi - 0.2, baseCpi - 0.4, baseCpi, baseCpi - 0.1],
            borderColor: 'rgba(255,255,255,0.7)',
            borderWidth: 1.5,
            backgroundColor: mpiGradient,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(255,255,255,0.8)',
            pointHoverRadius: 4,
            pointRadius: 2
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
            grid: { display: false },
            ticks: { color: '#7F7F7F', font: { family: 'Outfit', size: 9 } }
          },
          y: {
            min: 2,
            max: 10,
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#7F7F7F', font: { family: 'Outfit', size: 9 }, stepSize: 2 }
          }
        }
      }
    });
  }

  // Chart 2: Radar Chart for Performance Pillars
  const radarEl = document.getElementById('pillarsChart');
  if (radarEl) {
    const radarCtx = radarEl.getContext('2d');
    if (pillarsChartInstance) pillarsChartInstance.destroy();
    
    pillarsChartInstance = new Chart(radarCtx, {
      type: 'radar',
      data: {
        labels: ['Intensity', 'Execution', 'Focus', 'Coachability', 'Adaptability'],
        datasets: [{
          label: 'Academy Avg',
          data: [8.2, 7.5, 8.8, 7.9, 7.2],
          backgroundColor: 'rgba(255, 122, 0, 0.15)',
          borderColor: '#FF7A00',
          borderWidth: 1.5,
          pointBackgroundColor: '#FF7A00',
          pointRadius: 2.5
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
            angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            pointLabels: { color: '#8E8E93', font: { family: 'Outfit', size: 8, weight: 'bold' } },
            ticks: { display: false },
            min: 0,
            max: 10
          }
        }
      }
    });
  }
}

async function loadDashboard() {
  console.log('[Dashboard] Querying stats & profile...');
  
  // Set Coach and Academy profile info
  const coachName = getCoachName();
  const academyName = getAcademyName();
  
  const welcomeCoachEl = document.getElementById('welcome-coach');
  const academyNameEl = document.getElementById('academy-name-sub');
  
  if (welcomeCoachEl) welcomeCoachEl.textContent = coachName;
  if (academyNameEl) academyNameEl.textContent = academyName || 'Academy Dashboard';

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
    
    renderCharts(cpi);
  } catch (e) {
    console.error('[Dashboard] Failed to retrieve dashboard data:', e);
    showToast('Failed to load metrics', 'error');
    renderCharts(7.5);
  }

  // Load Recent Activities
  loadRecentActivities();
}

async function loadRecentActivities() {
  const pList = document.getElementById('recent-practices');
  const mList = document.getElementById('recent-matches');

  try {
    const [practices, matches] = await Promise.all([
      api.practiceSessions.getAll(),
      api.matchSessions.getAll()
    ]);

    // Render Recent Practices (up to 3)
    if (practices && practices.length > 0) {
      pList.innerHTML = practices.slice(0, 3).map(p => `
        <div class="flex items-center justify-between py-2 border-b border-brand-border/30 last:border-0">
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate">${p.teamName}</div>
            <div class="text-[10px] text-brand-muted mt-0.5">📅 ${p.date}</div>
          </div>
          <a href="practice-score.html?sessionId=${p.id}&teamId=${p.teamId}" 
             class="text-[9px] font-bold bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-2 py-1 rounded-lg hover:bg-brand-orange hover:text-white transition-all">
            Score
          </a>
        </div>`).join('');
    } else {
      pList.innerHTML = '<div class="text-[10px] text-brand-muted py-1">No recent practices</div>';
    }

    // Render Recent Matches (up to 3)
    if (matches && matches.length > 0) {
      mList.innerHTML = matches.slice(0, 3).map(m => `
        <div class="flex items-center justify-between py-2 border-b border-brand-border/30 last:border-0">
          <div class="min-w-0">
            <div class="text-xs font-bold text-white truncate">vs ${m.opponent}</div>
            <div class="text-[10px] text-brand-muted mt-0.5">${m.teamName} · 📅 ${m.date}</div>
          </div>
          <a href="match-score.html?sessionId=${m.id}&teamId=${m.teamId}" 
             class="text-[9px] font-bold bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-2 py-1 rounded-lg hover:bg-brand-orange hover:text-white transition-all">
            Score
          </a>
        </div>`).join('');
    } else {
      mList.innerHTML = '<div class="text-[10px] text-brand-muted py-1">No recent matches</div>';
    }

  } catch (err) {
    console.error('[Dashboard] Error loading recent activities:', err);
    pList.innerHTML = '<div class="text-[10px] text-red-400 py-1">Error loading activities</div>';
    mList.innerHTML = '<div class="text-[10px] text-red-400 py-1">Error loading activities</div>';
  }
}

// Fetch dashboard data on load
loadDashboard();
