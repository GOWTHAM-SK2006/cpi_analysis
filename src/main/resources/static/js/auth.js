/**
 * auth.js — Authentication helpers
 */

export function saveSession(data) {
  localStorage.setItem('cpi_token', data.token);
  localStorage.setItem('cpi_name', data.name);
  localStorage.setItem('cpi_email', data.email);
  localStorage.setItem('cpi_academy', data.academyName);
}

export function clearSession() {
  ['cpi_token','cpi_name','cpi_email','cpi_academy'].forEach(k => localStorage.removeItem(k));
}

export function isLoggedIn() { return !!localStorage.getItem('cpi_token'); }

export function requireAuth() {
  if (!isLoggedIn()) { window.location.href = '/login.html'; return false; }
  return true;
}

export function redirectIfLoggedIn() {
  if (isLoggedIn()) window.location.href = '/dashboard.html';
}

export function getCoachName()   { return localStorage.getItem('cpi_name') || 'Coach'; }
export function getAcademyName() { return localStorage.getItem('cpi_academy') || ''; }

export function logout() { clearSession(); window.location.href = '/login.html'; }
