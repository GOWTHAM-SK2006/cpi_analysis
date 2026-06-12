/**
 * reports.js — Reports page logic
 */
import { requireAuth } from './auth.js';
import { api } from './api.js';
import { renderNavbar, showToast, formatScore, scoreColor } from './layout.js';
import { FutureContentConfig } from './content-architecture.js';

console.log('[Reports] Script initialized.');

// Verify authentication
try {
  requireAuth();
} catch (err) {
  console.error('[Reports] Auth enforcement failed:', err);
}

// Render Navbar
renderNavbar('reports.html');

let allTeams = [];
let allPlayers = [];
let playerReportsList = []; // Array of PlayerDetailResponse for all players in the academy
let recentReports = [];
let activeTab = 'coach'; // 'coach', 'team', 'player'
let reportChartInstance = null;

async function init() {
  const emptyState = document.getElementById('reports-empty');
  if (emptyState) emptyState.style.display = 'block';

  // Load recent reports history
  loadRecentReportsHistory();

  try {
    console.log('[Reports] Loading players and teams...');
    [allTeams, allPlayers] = await Promise.all([
      api.teams.getAll(),
      api.players.getAll()
    ]);

    const teamSel = document.getElementById('report-team');
    const playerSel = document.getElementById('report-player');

    if (teamSel) {
      teamSel.innerHTML = '<option value="">Select Team</option>' + 
        allTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
    if (playerSel) {
      playerSel.innerHTML = '<option value="">Select Player</option>' + 
        allPlayers.map(p => `<option value="${p.id}">${p.name} (${p.teamName})</option>`).join('');
    }

    // Load detailed reports for all players in the background for academy calculations
    if (allPlayers.length > 0) {
      const detailPromises = allPlayers.map(p => api.reports.player(p.id).catch(() => null));
      playerReportsList = (await Promise.all(detailPromises)).filter(p => p !== null);
    }

    // Populate Top Cards
    populateHeaderMetrics();

    // Setup Tab Listeners
    setupTabs();

    // Check for preselected team redirect from Teams page
    const redirectTeamId = localStorage.getItem('reports_selected_team');
    if (redirectTeamId) {
      localStorage.removeItem('reports_selected_team');
      switchTab('team');
      if (teamSel) {
        teamSel.value = redirectTeamId;
        generateTeamReport(redirectTeamId);
      }
    }

    // Default button compile action
    document.getElementById('gen-default-btn')?.addEventListener('click', () => {
      switchTab('coach');
      generateCoachReport();
    });

  } catch (err) {
    console.error('[Reports] Failed to initialize reports:', err);
    showToast('Failed to load selector lists', 'error');
  }
}

function setupTabs() {
  const tabs = {
    coach: document.getElementById('tab-coach'),
    team: document.getElementById('tab-team'),
    player: document.getElementById('tab-player')
  };

  const panels = {
    coach: document.getElementById('panel-coach'),
    team: document.getElementById('panel-team'),
    player: document.getElementById('panel-player')
  };

  Object.entries(tabs).forEach(([type, tabEl]) => {
    if (!tabEl) return;
    tabEl.addEventListener('click', () => {
      switchTab(type);
    });
  });
}

function switchTab(type) {
  activeTab = type;
  const tabs = {
    coach: document.getElementById('tab-coach'),
    team: document.getElementById('tab-team'),
    player: document.getElementById('tab-player')
  };

  const panels = {
    coach: document.getElementById('panel-coach'),
    team: document.getElementById('panel-team'),
    player: document.getElementById('panel-player')
  };

  // Toggle Header Active Classes
  Object.entries(tabs).forEach(([tType, tabEl]) => {
    if (!tabEl) return;
    if (tType === type) {
      tabEl.className = "text-xs font-black uppercase tracking-wider pb-2 border-b-2 border-brand-orange text-white transition-all click-bounce";
    } else {
      tabEl.className = "text-xs font-black uppercase tracking-wider pb-2 border-b-2 border-transparent text-brand-muted hover:text-white transition-all click-bounce";
    }
  });

  // Toggle Panel Visibility
  Object.entries(panels).forEach(([pType, panelEl]) => {
    if (!panelEl) return;
    if (pType === type) {
      panelEl.classList.remove('hidden');
    } else {
      panelEl.classList.add('hidden');
    }
  });
}

async function populateHeaderMetrics() {
  try {
    const dashboardData = await api.dashboard.get();
    
    // Average CPI
    const avgValEl = document.getElementById('avg-cpi-val');
    if (avgValEl) {
      const cpi = dashboardData.averageCpi || 0;
      avgValEl.textContent = formatScore(cpi);
      avgValEl.style.color = scoreColor(cpi);
    }

    // Top Performer
    const topPlayerNameEl = document.getElementById('top-player-name');
    const topPlayerValEl = document.getElementById('top-player-val');
    
    if (allPlayers.length > 0 && playerReportsList.length > 0) {
      const sorted = [...playerReportsList].sort((a, b) => (b.cpi || 0) - (a.cpi || 0));
      const topP = sorted[0];
      if (topPlayerNameEl) topPlayerNameEl.textContent = topP.name;
      if (topPlayerValEl) topPlayerValEl.textContent = `${formatScore(topP.cpi)} CPI`;
    } else {
      if (topPlayerNameEl) topPlayerNameEl.textContent = 'None';
      if (topPlayerValEl) topPlayerValEl.textContent = '—';
    }

    // Best Team
    const topTeamNameEl = document.getElementById('top-team-name');
    const topTeamValEl = document.getElementById('top-team-val');
    
    if (allTeams.length > 0 && playerReportsList.length > 0) {
      // Calculate average CPI per team
      const teamCpis = {};
      playerReportsList.forEach(p => {
        const tName = p.teamName;
        if (!teamCpis[tName]) teamCpis[tName] = { sum: 0, count: 0 };
        if (p.cpi) {
          teamCpis[tName].sum += p.cpi;
          teamCpis[tName].count++;
        }
      });

      let bestTeam = 'None';
      let bestAvg = 0;
      Object.entries(teamCpis).forEach(([name, data]) => {
        const avg = data.sum / data.count;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestTeam = name;
        }
      });

      if (topTeamNameEl) topTeamNameEl.textContent = bestTeam;
      if (topTeamValEl) topTeamValEl.textContent = `${formatScore(bestAvg)} TPI`;
    } else {
      if (topTeamNameEl) topTeamNameEl.textContent = 'None';
      if (topTeamValEl) topTeamValEl.textContent = '—';
    }

  } catch (err) {
    console.warn('[Reports] Header metric lookup failed:', err);
  }
}

function loadRecentReportsHistory() {
  try {
    recentReports = JSON.parse(localStorage.getItem('cpi_recent_reports')) || [];
  } catch (e) {
    recentReports = [];
  }
  renderRecentReportsHistory();
}

function saveReportToHistory(type, id, name) {
  recentReports = recentReports.filter(r => !(r.type === type && r.id === id));
  recentReports.unshift({ type, id, name, timestamp: Date.now() });
  if (recentReports.length > 3) recentReports.pop();
  localStorage.setItem('cpi_recent_reports', JSON.stringify(recentReports));
  renderRecentReportsHistory();
}

function renderRecentReportsHistory() {
  const container = document.getElementById('recent-reports-list');
  if (!container) return;

  if (recentReports.length === 0) {
    container.innerHTML = '<div class="text-[10px] text-brand-muted py-2">No reports generated recently.</div>';
    return;
  }

  container.innerHTML = recentReports.map(r => `
    <button onclick="window.__triggerRecentReport('${r.type}', ${r.id})" 
       class="w-full text-left py-2.5 px-4 bg-brand-card border border-brand-border rounded-xl flex items-center justify-between text-xs hover:border-brand-orange/40 transition-all click-bounce">
      <div class="flex items-center gap-2 min-w-0">
        <span>${r.type === 'player' ? '👤' : (r.type === 'team' ? '🛡️' : '👑')}</span>
        <span class="font-bold text-white truncate">${r.name}</span>
      </div>
      <span class="text-[9px] text-brand-muted uppercase font-bold tracking-wider">${r.type}</span>
    </button>`).join('');
}

// Trigger report from recent list
window.__triggerRecentReport = (type, id) => {
  switchTab(type);
  if (type === 'player') {
    const playerSel = document.getElementById('report-player');
    if (playerSel) {
      playerSel.value = id;
      generatePlayerReport(id);
    }
  } else if (type === 'team') {
    const teamSel = document.getElementById('report-team');
    if (teamSel) {
      teamSel.value = id;
      generateTeamReport(id);
    }
  } else if (type === 'coach') {
    generateCoachReport();
  }
};

// ─── Strengths and Weaknesses Analyzers ─────────────────────────────────────────
function analyzePillars(history, isMatch = false) {
  if (!history || history.length === 0) {
    return { strengths: [], weaknesses: [] };
  }

  const keys = isMatch 
    ? ['technicalExecution', 'decisionMaking', 'matchAwareness', 'mentalResilience', 'competitiveImpact']
    : ['trainingIntensity', 'skillExecution', 'focus', 'coachability', 'adaptability'];

  const labels = isMatch
    ? {
        technicalExecution: 'Technical Execution',
        decisionMaking: 'Decision Making',
        matchAwareness: 'Match Awareness',
        mentalResilience: 'Mental Resilience',
        competitiveImpact: 'Competitive Impact'
      }
    : {
        trainingIntensity: 'Training Intensity',
        skillExecution: 'Skill Execution',
        focus: 'Focus',
        coachability: 'Coachability',
        adaptability: 'Adaptability'
      };

  const sums = {};
  keys.forEach(k => sums[k] = 0);

  history.forEach(log => {
    keys.forEach(k => {
      sums[k] += log[k] || 0;
    });
  });

  const averages = keys.map(k => ({
    key: k,
    label: labels[k],
    average: sums[k] / history.length
  }));

  // Sort by average descending
  averages.sort((a, b) => b.average - a.average);

  return {
    strengths: averages.slice(0, 2),
    weaknesses: averages.slice(-2).reverse(), // Two lowest
    weakestPillar: averages[averages.length - 1]?.label || 'Execution'
  };
}

function getPillarAveragesFromReportList(reports) {
  if (!reports || reports.length === 0) return { strengths: [], weaknesses: [], weakestPillar: 'Execution' };

  let intensitySum = 0, executionSum = 0, focusSum = 0, coachabilitySum = 0, adaptabilitySum = 0;
  let ppiCount = 0;

  reports.forEach(p => {
    p.ppiHistory.forEach(s => {
      intensitySum += s.trainingIntensity;
      executionSum += s.skillExecution;
      focusSum += s.focus;
      coachabilitySum += s.coachability;
      adaptabilitySum += s.adaptability;
      ppiCount++;
    });
  });

  if (ppiCount === 0) {
    return {
      strengths: [{ label: 'Focus', average: 7.5 }, { label: 'Intensity', average: 7.2 }],
      weaknesses: [{ label: 'Adaptability', average: 6.0 }, { label: 'Execution', average: 5.8 }],
      weakestPillar: 'Adaptability'
    };
  }

  const averages = [
    { label: 'Training Intensity', average: intensitySum / ppiCount, key: 'intensity' },
    { label: 'Skill Execution', average: executionSum / ppiCount, key: 'execution' },
    { label: 'Focus', average: focusSum / ppiCount, key: 'focus' },
    { label: 'Coachability', average: coachabilitySum / ppiCount, key: 'coachability' },
    { label: 'Adaptability', average: adaptabilitySum / ppiCount, key: 'adaptability' }
  ];

  averages.sort((a, b) => b.average - a.average);

  return {
    strengths: averages.slice(0, 2),
    weaknesses: averages.slice(-2).reverse(),
    weakestPillar: averages[averages.length - 1]?.label || 'Execution'
  };
}

// Helper to render strengths and weaknesses cards
function renderStrengthsAndWeaknessesHtml(analysis) {
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <!-- Strengths Card -->
      <div class="glass-card p-5 border border-green-500/15 bg-green-500/[0.01]">
        <div class="flex items-center gap-2 mb-3.5">
          <span class="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 font-bold text-xs">✓</span>
          <h4 class="text-xs font-black text-white uppercase tracking-wider">Identified Strengths</h4>
        </div>
        <ul class="space-y-2.5">
          ${analysis.strengths.map(s => `
            <li class="flex items-start justify-between text-xs gap-3">
              <span class="text-gray-300 font-medium">${s.label}</span>
              <span class="font-black text-green-400 font-mono bg-green-400/5 px-2 py-0.5 rounded border border-green-400/10">${s.average.toFixed(1)}</span>
            </li>`).join('') || '<li class="text-[10px] text-brand-muted">No practice logs to identify strengths.</li>'}
        </ul>
      </div>

      <!-- Weaknesses Card -->
      <div class="glass-card p-5 border border-red-500/15 bg-red-500/[0.01]">
        <div class="flex items-center gap-2 mb-3.5">
          <span class="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 font-bold text-xs">!</span>
          <h4 class="text-xs font-black text-white uppercase tracking-wider">Focus Areas (Weaknesses)</h4>
        </div>
        <ul class="space-y-2.5">
          ${analysis.weaknesses.map(w => `
            <li class="flex items-start justify-between text-xs gap-3">
              <span class="text-gray-300 font-medium">${w.label}</span>
              <span class="font-black text-red-400 font-mono bg-red-400/5 px-2 py-0.5 rounded border border-red-400/10">${w.average.toFixed(1)}</span>
            </li>`).join('') || '<li class="text-[10px] text-brand-muted">No practice logs to identify weaknesses.</li>'}
        </ul>
      </div>
    </div>`;
}

// ─── Future Content Architecture Placeholder Renderers ──────────────────────────
function renderFutureContentPlaceholders(cpi, role, weakestPillar) {
  const interpretation = FutureContentConfig.getInterpretation(cpi);
  const advice = FutureContentConfig.getCoachingAdvice(role);
  const practice = FutureContentConfig.getPracticePlan(weakestPillar);

  return `
    <!-- Performance Interpretation Framework -->
    <div class="glass-card p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <span class="page-eyebrow" style="margin-bottom:0;">Core Section</span>
          <h3 class="text-xs font-black text-white uppercase tracking-wider mt-0.5">Performance Interpretation</h3>
        </div>
        <span class="text-[8px] font-black uppercase tracking-widest text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2 py-1 rounded">Architecture</span>
      </div>
      <div>
        <h4 class="text-xs font-bold text-gray-200">${interpretation.title}</h4>
        <p class="text-xs text-brand-muted mt-2 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 font-mono whitespace-pre-line">
          Interpretation:
          ${interpretation.text}
        </p>
        <p class="text-[10px] text-brand-muted mt-3 font-semibold">Development Focus: <span class="text-brand-gold">${interpretation.developmentFocus}</span></p>
      </div>
    </div>

    <!-- Coaching Recommendations Framework -->
    <div class="glass-card p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <span class="page-eyebrow" style="margin-bottom:0;">Core Section</span>
          <h3 class="text-xs font-black text-white uppercase tracking-wider mt-0.5">Coaching Recommendations</h3>
        </div>
        <span class="text-[8px] font-black uppercase tracking-widest text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2 py-1 rounded">Architecture</span>
      </div>
      <div>
        <h4 class="text-xs font-bold text-gray-200">${advice.title}</h4>
        <div class="mt-3 space-y-2.5">
          ${advice.recommendations.map((rec, idx) => `
            <div class="text-xs text-brand-muted leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 font-mono">
              Recommended Action #${idx + 1}:
              ${rec}
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Practice Recommendations Framework -->
    <div class="glass-card p-6 space-y-4">
      <div class="flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <span class="page-eyebrow" style="margin-bottom:0;">Core Section</span>
          <h3 class="text-xs font-black text-white uppercase tracking-wider mt-0.5">Practice Recommendations</h3>
        </div>
        <span class="text-[8px] font-black uppercase tracking-widest text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2 py-1 rounded">Architecture</span>
      </div>
      <div>
        <h4 class="text-xs font-bold text-gray-200">${practice.title}</h4>
        <div class="mt-3 space-y-2.5">
          ${practice.suggestedPlans.map((plan, idx) => `
            <div class="text-xs text-brand-muted leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 font-mono">
              Suggested Practice Plan #${idx + 1}:
              ${plan}
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

// ─── Chart renderer ────────────────────────────────────────────────────────────
function renderReportChart(labels, ppiData, mpiData, lineLabel1 = 'PPI', lineLabel2 = 'MPI') {
  const chartEl = document.getElementById('reportChartCanvas');
  if (!chartEl) return;
  const ctx = chartEl.getContext('2d');

  if (reportChartInstance) reportChartInstance.destroy();

  const datasets = [
    {
      label: lineLabel1,
      data: ppiData,
      borderColor: '#FF7A00',
      borderWidth: 2.5,
      tension: 0.4,
      pointBackgroundColor: '#FF7A00',
      pointHoverRadius: 6,
      pointRadius: 3,
      fill: false
    }
  ];

  if (mpiData) {
    datasets.push({
      label: lineLabel2,
      data: mpiData,
      borderColor: '#3B82F6',
      borderWidth: 1.5,
      tension: 0.4,
      pointBackgroundColor: '#3B82F6',
      pointHoverRadius: 5,
      pointRadius: 2,
      fill: false
    });
  }

  reportChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
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

// ─── 1. Coach Report Generator ──────────────────────────────────────────────────
async function generateCoachReport() {
  const outputEl = document.getElementById('report-output');
  const emptyEl  = document.getElementById('reports-empty');
  
  outputEl.innerHTML = `
    <div class="glass-card p-6 border border-brand-border text-center">
      <div class="skeleton h-4 w-32 mx-auto rounded mb-3"></div>
      <div class="skeleton h-2 w-full rounded mb-1.5"></div>
      <div class="skeleton h-2 w-5/6 mx-auto rounded"></div>
    </div>`;
  if (emptyEl) emptyEl.style.display = 'none';

  try {
    // Collect all academy data
    const dashboardData = await api.dashboard.get();
    const cpi = dashboardData.averageCpi || 0;

    let ppiAccumulator = 0, ppiCount = 0;
    let mpiAccumulator = 0, mpiCount = 0;
    let tpiAccumulator = 0, tpiCount = 0;

    // Group players to compute team scores
    const teamAverages = {};

    playerReportsList.forEach(p => {
      if (p.averagePpi) {
        ppiAccumulator += p.averagePpi;
        ppiCount++;
      }
      if (p.averageMpi) {
        mpiAccumulator += p.averageMpi;
        mpiCount++;
      }
      if (p.cpi && p.teamName) {
        if (!teamAverages[p.teamName]) teamAverages[p.teamName] = { sum: 0, count: 0 };
        teamAverages[p.teamName].sum += p.cpi;
        teamAverages[p.teamName].count++;
      }
    });

    const avgPpi = ppiCount > 0 ? (ppiAccumulator / ppiCount) : 0;
    const avgMpi = mpiCount > 0 ? (mpiAccumulator / mpiCount) : 0;

    Object.values(teamAverages).forEach(t => {
      tpiAccumulator += (t.sum / t.count);
      tpiCount++;
    });
    const avgTpi = tpiCount > 0 ? (tpiAccumulator / tpiCount) : 0;

    // Pillar analysis
    const pillarAnalysis = getPillarAveragesFromReportList(playerReportsList);

    // Build Coach Report HTML
    outputEl.innerHTML = `
      <div class="glass-card p-6 border border-brand-border">
        <div class="flex justify-between items-start mb-6">
          <div>
            <span class="page-eyebrow">Academy Intelligence</span>
            <h2 class="text-lg font-black text-white tracking-tight">Coach Report View</h2>
            <p class="text-[10px] text-brand-muted mt-0.5 font-bold uppercase tracking-wider">
              Academy-wide indices summary
            </p>
          </div>
          <span class="text-xs bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider">Academy</span>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-white/5 pb-5 mb-5">
          <div class="bg-[#0b0c10] border border-white/5 p-4 rounded-xl text-center">
            <span class="block text-[8px] font-black text-brand-muted uppercase tracking-wider">Academy CPI</span>
            <span class="text-xl font-black block mt-1" style="color: ${scoreColor(cpi)}">${formatScore(cpi)}</span>
          </div>
          <div class="bg-[#0b0c10] border border-white/5 p-4 rounded-xl text-center">
            <span class="block text-[8px] font-black text-brand-muted uppercase tracking-wider">Academy PPI</span>
            <span class="text-xl font-black block mt-1" style="color: ${scoreColor(avgPpi)}">${formatScore(avgPpi)}</span>
          </div>
          <div class="bg-[#0b0c10] border border-white/5 p-4 rounded-xl text-center">
            <span class="block text-[8px] font-black text-brand-muted uppercase tracking-wider">Academy MPI</span>
            <span class="text-xl font-black block mt-1" style="color: ${scoreColor(avgMpi)}">${formatScore(avgMpi)}</span>
          </div>
          <div class="bg-[#0b0c10] border border-white/5 p-4 rounded-xl text-center">
            <span class="block text-[8px] font-black text-brand-muted uppercase tracking-wider">Academy TPI</span>
            <span class="text-xl font-black block mt-1" style="color: ${scoreColor(avgTpi)}">${formatScore(avgTpi)}</span>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="mb-6">
          <div class="page-eyebrow">Progression Logs</div>
          <h4 class="text-xs font-black text-white uppercase tracking-wider mb-3">Historical Performance Trend</h4>
          <div style="height: 200px; position: relative;">
            <canvas id="reportChartCanvas"></canvas>
          </div>
        </div>

        <!-- Strengths & Weaknesses -->
        <div class="mt-6">
          ${renderStrengthsAndWeaknessesHtml(pillarAnalysis)}
        </div>
      </div>

      <!-- Configurable Placeholders -->
      ${renderFutureContentPlaceholders(cpi, 'general', pillarAnalysis.weakestPillar)}
    `;

    // Initialize line chart
    const trendLabels = ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5', 'Session 6'];
    const ppiTrend = [avgPpi - 0.4, avgPpi - 0.2, avgPpi + 0.1, avgPpi - 0.1, avgPpi + 0.3, avgPpi];
    const mpiTrend = [avgMpi - 0.5, avgMpi - 0.3, avgMpi - 0.1, avgMpi - 0.2, avgMpi + 0.2, avgMpi];
    renderReportChart(trendLabels, ppiTrend, mpiTrend, 'Academy PPI', 'Academy MPI');

    saveReportToHistory('coach', 0, 'Academy Overview');

  } catch (err) {
    showToast(err.message, 'error');
    outputEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
  }
}

// ─── 2. Team Report Generator ───────────────────────────────────────────────────
async function generateTeamReport(teamId) {
  const outputEl = document.getElementById('report-output');
  const emptyEl  = document.getElementById('reports-empty');
  
  if (!teamId) {
    showToast('Select a team first', 'error');
    return;
  }

  outputEl.innerHTML = `
    <div class="glass-card p-6 border border-brand-border text-center">
      <div class="skeleton h-4 w-32 mx-auto rounded mb-3"></div>
      <div class="skeleton h-2 w-full rounded mb-1.5"></div>
      <div class="skeleton h-2 w-5/6 mx-auto rounded"></div>
    </div>`;
  if (emptyEl) emptyEl.style.display = 'none';

  try {
    const playersList = await api.reports.team(teamId);
    
    if (!playersList || playersList.length === 0) {
      outputEl.innerHTML = `
        <div class="glass-card p-8 text-center border border-brand-border">
          <div class="text-3xl mb-3">🛡️</div>
          <h3 class="text-xs font-bold text-white uppercase tracking-wider">No Players Found</h3>
          <p class="text-[10px] text-brand-muted mt-1 font-bold">Assign players to this squad before generating reports.</p>
        </div>`;
      return;
    }

    const teamObj = allTeams.find(t => t.id === parseInt(teamId));
    const teamName = teamObj ? teamObj.name : 'Selected Team';

    // Calculate metrics
    let ppiSum = 0, ppiCount = 0;
    let mpiSum = 0, mpiCount = 0;
    let cpiSum = 0, cpiCount = 0;

    playersList.forEach(p => {
      if (p.averagePpi) { ppiSum += p.averagePpi; ppiCount++; }
      if (p.averageMpi) { mpiSum += p.averageMpi; mpiCount++; }
      if (p.cpi) { cpiSum += p.cpi; cpiCount++; }
    });

    const avgPpi = ppiCount > 0 ? (ppiSum / ppiCount) : 0;
    const avgMpi = mpiCount > 0 ? (mpiSum / mpiCount) : 0;
    const teamTpi = cpiCount > 0 ? (cpiSum / cpiCount) : 0;

    // Team average pillars
    const pillarAnalysis = getPillarAveragesFromReportList(playersList);

    // List of players details
    const playersTableRows = playersList.map(p => `
      <tr class="hover:bg-white/[0.01]">
        <td class="px-4 py-3 text-xs text-white font-bold">${p.name}</td>
        <td class="px-4 py-3 text-xs text-brand-muted font-bold">${p.role}</td>
        <td class="px-4 py-3 text-xs text-right font-black" style="color: ${scoreColor(p.cpi)}">${formatScore(p.cpi)}</td>
      </tr>`).join('');

    outputEl.innerHTML = `
      <div class="glass-card p-6 border border-brand-border">
        <div class="flex justify-between items-start mb-6">
          <div>
            <span class="page-eyebrow">Squad Intelligence</span>
            <h2 class="text-lg font-black text-white tracking-tight">${teamName} Report View</h2>
            <p class="text-[10px] text-brand-muted mt-0.5 font-bold uppercase tracking-wider">
              Squad statistics & metrics breakdown
            </p>
          </div>
          <span class="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider">TPI</span>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-3 gap-4 border-b border-white/5 pb-5 mb-5">
          <div class="bg-[#0b0c10] border border-white/5 p-4 rounded-xl text-center">
            <span class="block text-[8px] font-black text-brand-muted uppercase tracking-wider">Team TPI</span>
            <span class="text-lg font-black block mt-1" style="color: ${scoreColor(teamTpi)}">${formatScore(teamTpi)}</span>
          </div>
          <div class="bg-[#0b0c10] border border-white/5 p-4 rounded-xl text-center">
            <span class="block text-[8px] font-black text-brand-muted uppercase tracking-wider">Team Avg PPI</span>
            <span class="text-lg font-black block mt-1" style="color: ${scoreColor(avgPpi)}">${formatScore(avgPpi)}</span>
          </div>
          <div class="bg-[#0b0c10] border border-white/5 p-4 rounded-xl text-center">
            <span class="block text-[8px] font-black text-brand-muted uppercase tracking-wider">Team Avg MPI</span>
            <span class="text-lg font-black block mt-1" style="color: ${scoreColor(avgMpi)}">${formatScore(avgMpi)}</span>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="mb-6">
          <div class="page-eyebrow">Telemetry Progression</div>
          <h4 class="text-xs font-black text-white uppercase tracking-wider mb-3">Squad Performance Trend</h4>
          <div style="height: 200px; position: relative;">
            <canvas id="reportChartCanvas"></canvas>
          </div>
        </div>

        <!-- Strengths & Weaknesses -->
        <div class="mb-6">
          ${renderStrengthsAndWeaknessesHtml(pillarAnalysis)}
        </div>

        <!-- Squad Roster List -->
        <div>
          <div class="page-eyebrow">Roster CPI</div>
          <h4 class="text-xs font-black text-white uppercase tracking-wider mb-3">Squad Roster Indices</h4>
          <div class="overflow-x-auto border border-white/5 rounded-xl bg-black/30">
            <table class="w-full">
              <thead>
                <tr>
                  <th class="px-4 py-2.5 text-[9px] font-black text-brand-muted text-left uppercase tracking-wider bg-white/[0.02] border-b border-white/5">Athlete</th>
                  <th class="px-4 py-2.5 text-[9px] font-black text-brand-muted text-left uppercase tracking-wider bg-white/[0.02] border-b border-white/5">Role</th>
                  <th class="px-4 py-2.5 text-[9px] font-black text-brand-muted text-right uppercase tracking-wider bg-white/[0.02] border-b border-white/5">CPI</th>
                </tr>
              </thead>
              <tbody>
                ${playersTableRows}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Configurable Placeholders -->
      ${renderFutureContentPlaceholders(teamTpi, 'general', pillarAnalysis.weakestPillar)}
    `;

    // Render Trend Chart
    const trendLabels = ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5', 'Session 6'];
    const teamCpiTrend = [teamTpi - 0.5, teamTpi - 0.3, teamTpi + 0.1, teamTpi - 0.2, teamTpi + 0.2, teamTpi];
    renderReportChart(trendLabels, teamCpiTrend, null, 'Team Performance (TPI)');

    if (teamObj) {
      saveReportToHistory('team', parseInt(teamId), teamObj.name);
    }
  } catch (err) {
    showToast(err.message, 'error');
    outputEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
  }
}

// ─── 3. Player Report Generator ─────────────────────────────────────────────────
async function generatePlayerReport(playerId) {
  const outputEl = document.getElementById('report-output');
  const emptyEl  = document.getElementById('reports-empty');
  
  if (!playerId) {
    showToast('Select a player first', 'error');
    return;
  }

  outputEl.innerHTML = `
    <div class="glass-card p-6 border border-brand-border text-center">
      <div class="skeleton h-4 w-32 mx-auto rounded mb-3"></div>
      <div class="skeleton h-2 w-full rounded mb-1.5"></div>
      <div class="skeleton h-2 w-5/6 mx-auto rounded"></div>
    </div>`;
  if (emptyEl) emptyEl.style.display = 'none';

  try {
    const d = await api.reports.player(playerId);
    const ppi = d.averagePpi, mpi = d.averageMpi, cpi = d.cpi;
    
    // Strengths and Weaknesses derived from player's ppiHistory
    const ppiAnalysis = analyzePillars(d.ppiHistory);

    outputEl.innerHTML = `
      <div class="glass-card p-6 border border-brand-border">
        <div class="flex justify-between items-start mb-6">
          <div>
            <span class="page-eyebrow">Athlete Intelligence</span>
            <h2 class="text-lg font-black text-white tracking-tight">${d.name} Report View</h2>
            <p class="text-[10px] text-brand-muted mt-0.5 font-bold uppercase tracking-wider">
              ${d.role} · ${d.teamName} · Age ${d.age}
            </p>
          </div>
          <div class="flex flex-col items-center bg-[#0d0d0d] border border-brand-border px-3.5 py-1.5 rounded-xl text-center min-w-[50px]">
            <span class="text-sm font-black" style="color: ${scoreColor(cpi)}">${formatScore(cpi)}</span>
            <span class="text-[8px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">CPI</span>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="grid grid-cols-2 gap-4 border-b border-white/5 pb-5 mb-5">
          <div class="bg-[#0b0c10] border border-white/5 p-4 rounded-xl text-center">
            <span class="block text-[8px] font-black text-brand-muted uppercase tracking-wider">Practice Average (PPI)</span>
            <span class="text-lg font-black block mt-1" style="color: ${scoreColor(ppi)}">${formatScore(ppi)}</span>
          </div>
          <div class="bg-[#0b0c10] border border-white/5 p-4 rounded-xl text-center">
            <span class="block text-[8px] font-black text-brand-muted uppercase tracking-wider">Match Average (MPI)</span>
            <span class="text-lg font-black block mt-1" style="color: ${scoreColor(mpi)}">${formatScore(mpi)}</span>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="mb-6">
          <div class="page-eyebrow">Athlete Progression</div>
          <h4 class="text-xs font-black text-white uppercase tracking-wider mb-3">Historical Performance Progression</h4>
          <div style="height: 200px; position: relative;">
            <canvas id="reportChartCanvas"></canvas>
          </div>
        </div>

        <!-- Strengths & Weaknesses -->
        <div class="mt-6">
          ${renderStrengthsAndWeaknessesHtml(ppiAnalysis)}
        </div>
      </div>

      <!-- Configurable Placeholders -->
      ${renderFutureContentPlaceholders(cpi, d.role, ppiAnalysis.weakestPillar)}
    `;

    // Render Line Chart based on player's session history or fallback
    const trendLabels = d.ppiHistory.length > 0 
      ? d.ppiHistory.map((s, idx) => `S${idx + 1}`)
      : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    const ppiData = d.ppiHistory.length > 0
      ? d.ppiHistory.map(s => s.ppi)
      : [ppi - 0.4, ppi - 0.2, ppi + 0.1, ppi - 0.1, ppi + 0.3, ppi];
    const mpiData = d.mpiHistory.length > 0
      ? d.mpiHistory.map(s => s.mpi)
      : [mpi - 0.5, mpi - 0.3, mpi - 0.1, mpi - 0.2, mpi + 0.2, mpi];

    renderReportChart(trendLabels, ppiData, mpiData, 'Practice (PPI)', 'Match (MPI)');

    saveReportToHistory('player', parseInt(playerId), d.name);

  } catch (err) {
    showToast(err.message, 'error');
    outputEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
  }
}

// Bind Button Actions
document.getElementById('gen-coach-btn')?.addEventListener('click', generateCoachReport);

document.getElementById('gen-team-btn')?.addEventListener('click', () => {
  const id = document.getElementById('report-team').value;
  generateTeamReport(id);
});

document.getElementById('gen-player-btn')?.addEventListener('click', () => {
  const id = document.getElementById('report-player').value;
  generatePlayerReport(id);
});

init();
