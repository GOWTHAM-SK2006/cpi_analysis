/**
 * login.js — Login page logic
 */
import { api } from './api.js';
import { saveSession, redirectIfLoggedIn } from './auth.js';

console.log('[Login] Script initialized.');

// Check if user is already logged in, and redirect to dashboard
try {
  console.log('[Login] Checking if user is already logged in...');
  redirectIfLoggedIn();
} catch (err) {
  console.error('[Login] Error in redirectIfLoggedIn:', err);
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btn = document.getElementById('submit-btn');
  const errEl = document.getElementById('error-msg');
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  console.log(`[Login] Form submitted. Attempting login for email: ${email}`);
  
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  errEl.classList.add('hidden');
  
  try {
    const data = await api.auth.login({ email, password });
    console.log('[Login] API call succeeded. Response payload:', data);
    
    if (data && data.token) {
      console.log(`[Login] Saving session: Token = ${data.token.substring(0, 10)}...`);
      saveSession(data);
      console.log('[Login] Session saved. Redirecting to dashboard.html...');
      window.location.href = 'dashboard.html';
    } else {
      console.error('[Login] API succeeded but no token was returned in response!');
      throw new Error('No authentication token returned by server.');
    }
  } catch (err) {
    console.error('[Login] Login process failed:', err);
    errEl.textContent = err.message || 'Invalid email or password';
    errEl.classList.remove('hidden');
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
});
