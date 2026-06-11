/**
 * api.js — Central API client module
 * All REST calls go through here. Attaches JWT token automatically.
 */

const API_BASE = '/api';

// ─── Generic fetch wrapper ────────────────────────────────────────────────────
async function request(method, path, body = null) {
  const token = localStorage.getItem('cpi_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, options);

  if (res.status === 401) {
    // Token expired or invalid — redirect to login
    localStorage.clear();
    window.location.href = '/login.html';
    return;
  }

  const data = res.headers.get('content-type')?.includes('application/json')
    ? await res.json()
    : null;

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    signup: (body) => request('POST', '/auth/signup', body),
    login:  (body) => request('POST', '/auth/login', body),
  },

  dashboard: {
    get: () => request('GET', '/dashboard'),
  },

  teams: {
    getAll:  ()         => request('GET', '/teams'),
    getById: (id)       => request('GET', `/teams/${id}`),
    create:  (body)     => request('POST', '/teams', body),
    update:  (id, body) => request('PUT', `/teams/${id}`, body),
    delete:  (id)       => request('DELETE', `/teams/${id}`),
  },

  players: {
    getAll:       (teamId) => request('GET', `/players${teamId ? `?teamId=${teamId}` : ''}`),
    getById:      (id)     => request('GET', `/players/${id}`),
    create:       (body)   => request('POST', '/players', body),
    update:       (id, body) => request('PUT', `/players/${id}`, body),
    delete:       (id)     => request('DELETE', `/players/${id}`),
  },

  practiceSessions: {
    getAll:  ()     => request('GET', '/practice-sessions'),
    getById: (id)   => request('GET', `/practice-sessions/${id}`),
    create:  (body) => request('POST', '/practice-sessions', body),
    delete:  (id)   => request('DELETE', `/practice-sessions/${id}`),
  },

  ppi: {
    getBySession: (sessionId) => request('GET', `/ppi/session/${sessionId}`),
    getByPlayer:  (playerId)  => request('GET', `/ppi/player/${playerId}`),
    save:         (sessionId, body) => request('POST', `/ppi/session/${sessionId}`, body),
  },

  matchSessions: {
    getAll:  ()     => request('GET', '/match-sessions'),
    getById: (id)   => request('GET', `/match-sessions/${id}`),
    create:  (body) => request('POST', '/match-sessions', body),
    delete:  (id)   => request('DELETE', `/match-sessions/${id}`),
  },

  mpi: {
    getBySession: (sessionId) => request('GET', `/mpi/session/${sessionId}`),
    getByPlayer:  (playerId)  => request('GET', `/mpi/player/${playerId}`),
    save:         (sessionId, body) => request('POST', `/mpi/session/${sessionId}`, body),
  },

  reports: {
    player: (playerId) => request('GET', `/reports/player/${playerId}`),
    team:   (teamId)   => request('GET', `/reports/team/${teamId}`),
  },
};
