import { state } from './state.js';
import { getAuthHeaders } from './api.js';

export async function checkAuth() {
  if (!state.authToken) {
    showLoginPage();
    return;
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const data = await response.json();
      state.currentUser = data.user;
      showApp();
      window.switchView('home');
      window.loadHomePage();
    } else {
      localStorage.removeItem('authToken');
      state.authToken = null;
      showLoginPage();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    showLoginPage();
  }
}

export function showLoginPage() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('hidden');
}

export function showApp() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');

  const usernameDisplay = document.getElementById('usernameDisplay');
  if (state.currentUser) {
    usernameDisplay.textContent = state.currentUser.username;
  }
}

export function switchAuthTab(mode) {
  state.currentAuthTab = mode;
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const loginUsernameGroup = document.getElementById('loginUsernameGroup');
  const loginError = document.getElementById('loginError');

  loginError.textContent = '';
  document.getElementById('loginForm').reset();

  if (mode === 'signup') {
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
    loginSubmitBtn.textContent = 'Sign Up';
    loginUsernameGroup.style.display = 'block';
  } else {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginSubmitBtn.textContent = 'Login';
    loginUsernameGroup.style.display = 'none';
  }
}

export function initLoginForm() {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const username = document.getElementById('loginUsername').value;
    const loginError = document.getElementById('loginError');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');

    loginError.textContent = '';
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = state.currentAuthTab === 'login' ? 'Logging in...' : 'Signing up...';

    try {
      const endpoint = state.currentAuthTab === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = state.currentAuthTab === 'login'
        ? { email, password }
        : { email, password, username };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        state.authToken = data.token;
        localStorage.setItem('authToken', state.authToken);
        state.currentUser = data.user;
        showApp();
        window.switchView('home');
        window.loadHomePage();
      } else {
        loginError.textContent = data.error || 'Authentication failed';
      }
    } catch (error) {
      console.error('Auth error:', error);
      loginError.textContent = 'Network error. Please try again.';
    } finally {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.textContent = state.currentAuthTab === 'login' ? 'Login' : 'Sign Up';
    }
  });
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  localStorage.removeItem('authToken');
  state.authToken = null;
  state.currentUser = null;

  switchAuthTab('login');
  showLoginPage();
}

export function showForgotPasswordModal() {
  document.getElementById('forgotPasswordModal').classList.remove('hidden');
  document.getElementById('forgotEmail').value = '';
  document.getElementById('forgotPasswordError').textContent = '';
  document.getElementById('forgotPasswordSuccess').textContent = '';
}

export function closeForgotPasswordModal() {
  document.getElementById('forgotPasswordModal').classList.add('hidden');
}

export async function handleForgotPassword(event) {
  event.preventDefault();

  const email = document.getElementById('forgotEmail').value;
  const errorDiv = document.getElementById('forgotPasswordError');
  const successDiv = document.getElementById('forgotPasswordSuccess');
  const submitBtn = document.getElementById('forgotPasswordBtn');

  errorDiv.textContent = '';
  successDiv.textContent = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      successDiv.textContent = data.message;
      document.getElementById('forgotPasswordForm').reset();
    } else {
      errorDiv.textContent = data.error || 'Failed to process request';
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    errorDiv.textContent = 'Network error. Please try again.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Reset Link';
  }
}

export function initForgotPasswordModal() {
  document.getElementById('forgotPasswordModal').addEventListener('click', (e) => {
    if (e.target.id === 'forgotPasswordModal') {
      closeForgotPasswordModal();
    }
  });
}
