const { Resend } = require('resend');

// Initialize Resend client
const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
};

// Default from address (Resend provides a free testing domain)
const getFromAddress = () => {
  return process.env.EMAIL_FROM || 'Movie Ranker <onboarding@resend.dev>';
};

/**
 * Send welcome email to new user
 * @param {string} email - User's email address
 * @param {string} username - User's username
 */
const sendWelcomeEmail = async (email, username) => {
  const resend = getResendClient();

  if (!resend) {
    console.log('Email not configured. Welcome email would be sent to:', email);
    return false;
  }

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: 'Welcome to Movie Ranker!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 30px; border-radius: 12px;">
          <h1 style="color: #e94560; margin-bottom: 20px;">Welcome to Movie Ranker, ${username}!</h1>
          <p style="color: #ccc; line-height: 1.6;">Thanks for joining our community of movie enthusiasts.</p>
          <p style="color: #ccc; line-height: 1.6;">With Movie Ranker, you can:</p>
          <ul style="color: #ccc; line-height: 1.8;">
            <li>Track and rate your favorite movies</li>
            <li>Write reviews to share your thoughts</li>
            <li>Get personalized recommendations</li>
            <li>View your movie watching statistics</li>
          </ul>
          <p style="color: #ccc; line-height: 1.6;">Start exploring and ranking movies today!</p>
          <p style="color: #888; margin-top: 30px;">- The Movie Ranker Team</p>
        </div>
      `,
    });
    console.log('Welcome email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} resetToken - The unhashed reset token
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const resend = getResendClient();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password.html?token=${resetToken}`;

  if (!resend) {
    console.log('Email not configured. Password reset link:', resetUrl);
    return true;
  }

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: 'Password Reset Request - Movie Ranker',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #fff; padding: 30px; border-radius: 12px;">
          <h1 style="color: #e94560; margin-bottom: 20px;">Password Reset Request</h1>
          <p style="color: #ccc; line-height: 1.6;">You requested a password reset for your Movie Ranker account.</p>
          <p style="color: #ccc; line-height: 1.6;">Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: linear-gradient(135deg, #e94560, #ff6b6b);
                      color: white;
                      padding: 14px 32px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: bold;
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 0.9em;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; font-size: 0.85em;">${resetUrl}</p>
          <p style="color: #ff6b6b; margin-top: 20px;"><strong>This link will expire in 1 hour.</strong></p>
          <p style="color: #888; line-height: 1.6;">If you didn't request this password reset, you can safely ignore this email.</p>
          <p style="color: #888; margin-top: 30px;">- The Movie Ranker Team</p>
        </div>
      `,
    });
    console.log('Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
