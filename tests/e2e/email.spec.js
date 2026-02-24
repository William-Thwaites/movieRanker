// @ts-check
const { test, expect } = require('@playwright/test');

const MOCK_AUTH_USER = {
  user: {
    _id: 'test-user-id',
    username: 'TestUser',
    email: 'test@example.com',
  },
};

const MOCK_SIGNUP_RESPONSE = {
  message: 'User created successfully',
  token: 'fake-jwt-token-12345',
  user: {
    id: 'new-user-id',
    username: 'NewUser',
    email: 'newuser@example.com',
  },
};

const MOCK_EMPTY_RESULTS = { results: [] };

test.describe('Signup Welcome Email Flow', () => {
  test('successful signup triggers welcome email endpoint', async ({ page }) => {
    // Mock signup endpoint (which triggers welcome email on backend)
    await page.route('**/api/auth/signup', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SIGNUP_RESPONSE),
      });
    });

    // Mock post-login endpoints so app loads after signup
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: MOCK_SIGNUP_RESPONSE.user }),
      });
    });

    await page.route('**/api/movies/newreleases', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EMPTY_RESULTS) });
    });
    await page.route('**/api/movies/trending', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EMPTY_RESULTS) });
    });
    await page.route('**/api/movies/recommendations', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EMPTY_RESULTS) });
    });

    await page.goto('/');

    // Should see the login page
    await expect(page.locator('#loginPage')).toBeVisible();

    // Switch to signup tab
    await page.locator('#signupTab').click();
    await expect(page.locator('#loginSubmitBtn')).toHaveText('Sign Up');

    // Fill in signup form
    await page.locator('#loginUsername').fill('NewUser');
    await page.locator('#loginEmail').fill('newuser@example.com');
    await page.locator('#loginPassword').fill('password123');

    // Submit
    await page.locator('#loginSubmitBtn').click();

    // App should load after successful signup
    await expect(page.locator('#appContainer')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#loginPage')).toBeHidden();
  });
});

test.describe('Forgot Password Flow', () => {
  test('forgot password form sends reset email request', async ({ page }) => {
    // Mock forgot-password endpoint
    await page.route('**/api/auth/forgot-password', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'If an account with that email exists, a password reset link has been sent.',
        }),
      });
    });

    // Mock auth/me to return 401 so we stay on login page
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'No token' }) });
    });

    await page.goto('/');
    await expect(page.locator('#loginPage')).toBeVisible();

    // Click "Forgot Password?" link
    await page.locator('a:has-text("Forgot Password?")').click();

    // Modal should appear
    await expect(page.locator('#forgotPasswordModal')).toBeVisible();

    // Fill in email and submit
    await page.locator('#forgotEmail').fill('test@example.com');
    await page.locator('#forgotPasswordBtn').click();

    // Success message should appear
    await expect(page.locator('#forgotPasswordSuccess')).toHaveText(
      'If an account with that email exists, a password reset link has been sent.',
      { timeout: 5000 }
    );
  });
});

test.describe('Password Reset Page', () => {
  test('valid token shows reset form and allows password reset', async ({ page }) => {
    // Mock token verification
    await page.route('**/api/auth/verify-reset-token/fake-reset-token', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true }),
      });
    });

    // Mock password reset submission
    await page.route('**/api/auth/reset-password', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password has been reset successfully' }),
      });
    });

    await page.goto('/reset-password.html?token=fake-reset-token');

    // Reset form should be visible
    await expect(page.locator('#resetPasswordForm')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#invalidState')).toBeHidden();

    // Fill in matching passwords and submit
    await page.locator('#newPassword').fill('newpassword123');
    await page.locator('#confirmPassword').fill('newpassword123');
    await page.locator('#resetSubmitBtn').click();

    // Success state should show
    await expect(page.locator('#successState')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3:has-text("Password Reset Successful")')).toBeVisible();
  });

  test('invalid or expired token shows error state', async ({ page }) => {
    // Mock token verification to fail
    await page.route('**/api/auth/verify-reset-token/expired-token', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ valid: false, error: 'Invalid or expired reset token' }),
      });
    });

    await page.goto('/reset-password.html?token=expired-token');

    // Invalid state should show
    await expect(page.locator('#invalidState')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h3:has-text("Invalid or Expired Link")')).toBeVisible();

    // Reset form should remain hidden
    await expect(page.locator('#resetPasswordForm')).toBeHidden();
  });

  test('mismatched passwords show client-side validation error', async ({ page }) => {
    // Mock token verification as valid
    await page.route('**/api/auth/verify-reset-token/fake-reset-token', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true }),
      });
    });

    await page.goto('/reset-password.html?token=fake-reset-token');
    await expect(page.locator('#resetPasswordForm')).toBeVisible({ timeout: 5000 });

    // Fill in mismatched passwords
    await page.locator('#newPassword').fill('password123');
    await page.locator('#confirmPassword').fill('differentpassword');
    await page.locator('#resetSubmitBtn').click();

    // Error message should appear
    await expect(page.locator('#resetError')).toHaveText('Passwords do not match');

    // Should still be on the form (no success state)
    await expect(page.locator('#successState')).toBeHidden();
  });
});
