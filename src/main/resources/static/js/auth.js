/**
 * auth.js — Authentication helpers
 */

export function saveSession(data) {
  console.log('[Auth] saveSession called with data:', {
    name: data.name,
    email: data.email,
    academyName: data.academyName,
    tokenPresent: !!data.token
  });
  
  if (data.token) {
    localStorage.setItem('cpi_token', data.token);
    localStorage.setItem('cpi_name', data.name);
    localStorage.setItem('cpi_email', data.email);
    localStorage.setItem('cpi_academy', data.academyName);
    console.log('[Auth] Token and coach profile stored in localStorage successfully.');
  } else {
    console.warn('[Auth] No token found in session data; localStorage not updated.');
  }
}

export function clearSession() {
  console.log('[Auth] Clearing session from localStorage.');
  ['cpi_token','cpi_name','cpi_email','cpi_academy'].forEach(k => localStorage.removeItem(k));
}

export function isLoggedIn() {
  const token = localStorage.getItem('cpi_token');
  const loggedIn = !!token;
  console.log(`[Auth] Checking login state. Token present: ${loggedIn}`);
  return loggedIn;
}

export function requireAuth() {
  console.log('[Auth] requireAuth checking authorization status...');
  if (!isLoggedIn()) {
    console.warn('[Auth] User not authenticated. Redirecting to /login.html');
    window.location.href = '/login.html';
    return false;
  }
  console.log('[Auth] User is authenticated.');
  return true;
}

export function redirectIfLoggedIn() {
  console.log('[Auth] redirectIfLoggedIn checking if already logged in...');
  if (isLoggedIn()) {
    console.log('[Auth] User already authenticated. Redirecting to /dashboard.html');
    window.location.href = '/dashboard.html';
  } else {
    console.log('[Auth] User not logged in, allowing access to auth page.');
  }
}

export function getCoachName() {
  const name = localStorage.getItem('cpi_name') || 'Coach';
  console.log(`[Auth] Retrieved Coach Name: ${name}`);
  return name;
}

export function getAcademyName() {
  const academy = localStorage.getItem('cpi_academy') || '';
  console.log(`[Auth] Retrieved Academy Name: ${academy}`);
  return academy;
}

export function logout() {
  console.log('[Auth] Logging out user...');
  clearSession();
  window.location.href = '/login.html';
}
