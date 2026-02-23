require('../../helpers/setup');
const { makeUser } = require('../../helpers/fixtures');
const authService = require('../../../server/services/auth.service');
const User = require('../../../server/models/User');

// Mock email service to avoid sending real emails
jest.mock('../../../server/services/external/email', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

describe('auth.service', () => {
  describe('signup', () => {
    it('should create a new user and return a token', async () => {
      const result = await authService.signup(makeUser());
      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('testuser');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should hash the password before storing', async () => {
      await authService.signup(makeUser());
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.password).not.toBe('password123');
    });

    it('should throw if email is already registered', async () => {
      await authService.signup(makeUser());
      await expect(authService.signup(makeUser({ username: 'other' })))
        .rejects.toThrow('Email already registered');
    });

    it('should throw if username is already taken', async () => {
      await authService.signup(makeUser());
      await expect(authService.signup(makeUser({ email: 'other@example.com' })))
        .rejects.toThrow('Username already taken');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.signup(makeUser());
    });

    it('should return a token for valid credentials', async () => {
      const result = await authService.login({ email: 'test@example.com', password: 'password123' });
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw for wrong password', async () => {
      await expect(authService.login({ email: 'test@example.com', password: 'wrongpass' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw for non-existent email', async () => {
      await expect(authService.login({ email: 'nobody@example.com', password: 'password123' }))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('forgotPassword', () => {
    it('should set reset token and expiry on the user', async () => {
      await authService.signup(makeUser());
      await authService.forgotPassword('test@example.com');
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.resetPasswordToken).toBeTruthy();
      expect(user.resetPasswordExpires).toBeTruthy();
      expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
    });

    it('should not throw for non-existent email (prevents enumeration)', async () => {
      await expect(authService.forgotPassword('ghost@example.com')).resolves.toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('should throw for invalid token', async () => {
      await expect(authService.resetPassword({ token: 'badtoken', password: 'newpass123' }))
        .rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('verifyResetToken', () => {
    it('should throw for invalid token', async () => {
      await expect(authService.verifyResetToken('badtoken'))
        .rejects.toThrow('Invalid or expired reset token');
    });
  });
});
