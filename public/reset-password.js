// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

// DOM Elements
const loadingState = document.getElementById('loadingState');
const invalidState = document.getElementById('invalidState');
const resetForm = document.getElementById('resetPasswordForm');
const successState = document.getElementById('successState');
const resetError = document.getElementById('resetError');

// Verify token on page load
async function verifyToken() {
  if (!resetToken) {
    showInvalidState();
    return;
  }

  try {
    const response = await fetch(`/api/auth/verify-reset-token/${resetToken}`);
    const data = await response.json();

    if (data.valid) {
      showResetForm();
    } else {
      showInvalidState();
    }
  } catch (error) {
    console.error('Token verification error:', error);
    showInvalidState();
  }
}

function showInvalidState() {
  loadingState.classList.add('hidden');
  invalidState.classList.remove('hidden');
}

function showResetForm() {
  loadingState.classList.add('hidden');
  resetForm.classList.remove('hidden');
}

function showSuccessState() {
  resetForm.classList.add('hidden');
  successState.classList.remove('hidden');
}

// Handle form submission
resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const submitBtn = document.getElementById('resetSubmitBtn');

  resetError.textContent = '';

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    resetError.textContent = 'Passwords do not match';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Resetting...';

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        password: newPassword,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showSuccessState();
    } else {
      resetError.textContent = data.error || 'Failed to reset password';
    }
  } catch (error) {
    console.error('Reset password error:', error);
    resetError.textContent = 'Network error. Please try again.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Reset Password';
  }
});

// Initialize
verifyToken();
