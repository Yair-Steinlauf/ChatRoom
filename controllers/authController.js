"use strict";
const { User } = require('../models');
const {
  REGISTER_TIMEOUT,
  COOKIE_NAME_REG_DATA,
  COOKIE_NAME_REG_TIMESTAMP,
  ERRORS
} = require('../config/constants');
const { validateName, validateEmail, validatePassword, normalizeEmail, sanitizeString } = require('../utils/validators');

/**
 * Check if registration timestamp is still valid
 * @param {string} timestamp - Timestamp from cookie
 * @returns {boolean} True if within timeout period
 */
const isRegistrationValid = (timestamp) => {
  if (!timestamp) return false;
  const elapsed = Date.now() - parseInt(timestamp);
  return elapsed <= REGISTER_TIMEOUT;
};

/**
 * GET /api/auth/register/step1 - Get existing registration data if valid from cookies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getRegistrationStep1 = (req, res) => {
  const regData = req.cookies[COOKIE_NAME_REG_DATA];
  const timestamp = req.cookies[COOKIE_NAME_REG_TIMESTAMP];

  if (regData && timestamp && isRegistrationValid(timestamp)) {
    try {
      const data = JSON.parse(regData);
      return res.json({ success: true, data });
    } catch (e) {
      res.clearCookie(COOKIE_NAME_REG_DATA);
      res.clearCookie(COOKIE_NAME_REG_TIMESTAMP);
    }
  }

  res.json({ success: true, data: null });
};

/**
 * POST /api/auth/register/step1 - Submit step 1 (email, names)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.postRegistrationStep1 = async (req, res) => {
  try {
    let { email, firstName, lastName } = req.body;

    // Sanitize all inputs (server-side - DO NOT TRUST CLIENT)
    email = sanitizeString(email);
    firstName = sanitizeString(firstName);
    lastName = sanitizeString(lastName);

    // Validate inputs (server must validate - #21)
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ success: false, error: emailError });
    }

    const firstNameError = validateName(firstName);
    if (firstNameError) {
      return res.status(400).json({
        success: false,
        error: 'First name: ' + firstNameError
      });
    }

    const lastNameError = validateName(lastName);
    if (lastNameError) {
      return res.status(400).json({
        success: false,
        error: 'Last name: ' + lastNameError
      });
    }

    // Normalize email (lowercase) - consistent handling
    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: ERRORS.EMAIL_EXISTS
      });
    }

    // Store data in cookies with timestamp
    const regData = {
      email: normalizedEmail,
      firstName: firstName.toLowerCase(), // Normalize for consistency
      lastName: lastName.toLowerCase()
    };

    res.cookie(COOKIE_NAME_REG_DATA, JSON.stringify(regData), {
      maxAge: REGISTER_TIMEOUT,
      httpOnly: true
    });

    res.cookie(COOKIE_NAME_REG_TIMESTAMP, Date.now().toString(), {
      maxAge: REGISTER_TIMEOUT,
      httpOnly: true
    });

    res.json({ success: true, message: 'Proceed to step 2' });

  } catch (error) {
    console.error('Registration step 1 error:', error);
    res.status(500).json({
      success: false,
      error: ERRORS.SERVER_ERROR
    });
  }
};

/**
 * GET /api/auth/register/step2 - Check if can access step 2
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getRegistrationStep2 = (req, res) => {
  const regData = req.cookies[COOKIE_NAME_REG_DATA];
  const timestamp = req.cookies[COOKIE_NAME_REG_TIMESTAMP];

  if (!regData || !timestamp || !isRegistrationValid(timestamp)) {
    return res.status(403).json({
      success: false,
      error: ERRORS.SESSION_EXPIRED,
      expired: true
    });
  }

  try {
    const data = JSON.parse(regData);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({
      success: false,
      error: 'Invalid session data'
    });
  }
};

/**
 * POST /api/auth/register/step2 - Complete registration with password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.postRegistrationStep2 = async (req, res) => {
  try {
    let { password, confirmPassword } = req.body;
    const regData = req.cookies[COOKIE_NAME_REG_DATA];
    const timestamp = req.cookies[COOKIE_NAME_REG_TIMESTAMP];

    // Sanitize passwords (server-side - DO NOT TRUST CLIENT)
    password = sanitizeString(password);
    confirmPassword = sanitizeString(confirmPassword);

    // Validate session
    if (!regData || !timestamp || !isRegistrationValid(timestamp)) {
      return res.status(403).json({
        success: false,
        error: ERRORS.SESSION_EXPIRED,
        expired: true
      });
    }

    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, error: passwordError });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: ERRORS.PASSWORDS_MISMATCH
      });
    }

    // Parse registration data
    let userData;
    try {
      userData = JSON.parse(regData);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session data'
      });
    }

    // Final check: email still available (race condition protection)
    const existingUser = await User.findOne({
      where: { email: userData.email }
    });

    if (existingUser) {
      res.clearCookie(COOKIE_NAME_REG_DATA);
      res.clearCookie(COOKIE_NAME_REG_TIMESTAMP);
      return res.status(409).json({
        success: false,
        error: 'This email was registered by another user. Please start over.'
      });
    }

    // Create user (password will be hashed by model hook)
    await User.create({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: password
    });

    // Clear registration cookies
    res.clearCookie(COOKIE_NAME_REG_DATA);
    res.clearCookie(COOKIE_NAME_REG_TIMESTAMP);

    res.json({
      success: true,
      message: 'Registration completed successfully'
    });

  } catch (error) {
    console.error('Registration step 2 error:', error);
    res.status(500).json({
      success: false,
      error: ERRORS.SERVER_ERROR
    });
  }
};

/**
 * DELETE /api/auth/register - Clear registration cookies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.cancelRegistration = (req, res) => {
  res.clearCookie(COOKIE_NAME_REG_DATA);
  res.clearCookie(COOKIE_NAME_REG_TIMESTAMP);
  res.json({ success: true, message: 'Registration cancelled' });
};

/**
 * POST /api/auth/login - Authenticate user and create session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Sanitize inputs (server-side - DO NOT TRUST CLIENT)
    email = sanitizeString(email);
    password = sanitizeString(password);

    // Validate email (3-32 chars, valid format)
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ success: false, error: emailError });
    }

    // Validate password (3-32 chars)
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, error: passwordError });
    }

    // Normalize email (lowercase) - consistent handling
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({
      where: { email: normalizedEmail }
    });

    if (!user) {
      // משתמש לא נמצא - לא מגלים אם email קיים (אבטחה)
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // בדוק סיסמה
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // כל הבדיקות עברו - יוצר session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userFirstName = user.firstName;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: ERRORS.SERVER_ERROR
    });
  }
};

/**
 * POST /api/auth/logout - Destroy session and log out
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
};

/**
 * GET /api/auth/me - Get the currently authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCurrentUser = async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: ERRORS.SERVER_ERROR
    });
  }
};