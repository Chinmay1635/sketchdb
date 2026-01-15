const nodemailer = require('nodemailer');

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 10000,    // 10 seconds
  backoffMultiplier: 2  // Exponential backoff
};

// Sleep helper function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper with exponential backoff
const withRetry = async (operation, operationName) => {
  let lastError;
  let delay = RETRY_CONFIG.initialDelayMs;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors or invalid recipient
      const nonRetryableCodes = ['EAUTH', 'EINVALIDRECIPIENT', 'EENVELOPE'];
      if (nonRetryableCodes.includes(error.code)) {
        console.error(`${operationName} failed with non-retryable error:`, error.message);
        throw error;
      }

      if (attempt < RETRY_CONFIG.maxRetries) {
        console.log(`${operationName} attempt ${attempt} failed. Retrying in ${delay}ms...`, {
          error: error.message,
          code: error.code
        });
        await sleep(delay);
        delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelayMs);
      }
    }
  }

  console.error(`${operationName} failed after ${RETRY_CONFIG.maxRetries} attempts`);
  throw lastError;
};

// Create transporter with validation
const createTransporter = () => {
  // Validate required environment variables
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Missing email configuration:', {
      EMAIL_HOST: !!process.env.EMAIL_HOST,
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASS: !!process.env.EMAIL_PASS,
      EMAIL_PORT: process.env.EMAIL_PORT || '587 (default)'
    });
    throw new Error('Email configuration is incomplete. Please check EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Add timeout settings for Render
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, username) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"SketchDB" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Email Verification - SketchDB',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 SketchDB</h1>
            <p>Database Diagram Tool</p>
          </div>
          <div class="content">
            <h2>Hello ${username}!</h2>
            <p>Welcome to SketchDB! Please verify your email address to complete your registration.</p>
            <div class="otp-box">
              <p>Your verification code is:</p>
              <div class="otp-code">${otp}</div>
            </div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't create an account with SketchDB, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 SketchDB - Walchand College of Engineering, Sangli</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await withRetry(async () => {
      await transporter.sendMail(mailOptions);
    }, `OTP email to ${email}`);
    
    console.log(`OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response
    });
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, otp, username) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"SketchDB" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset - SketchDB',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 SketchDB</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hello ${username}!</h2>
            <p>We received a request to reset your password. Use the code below to reset it:</p>
            <div class="otp-box">
              <p>Your reset code is:</p>
              <div class="otp-code">${otp}</div>
            </div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>© 2024 SketchDB - Walchand College of Engineering, Sangli</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await withRetry(async () => {
      await transporter.sendMail(mailOptions);
    }, `Password reset email to ${email}`);
    
    console.log(`Password reset email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response
    });
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail
};
