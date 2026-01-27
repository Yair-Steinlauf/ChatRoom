"use strict";

/**
 * Authentication middleware
 * @module middleware/authMiddleware
 */

/**
 * Require authentication for API routes
 * Returns 401 JSON if user is not authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
};

/**
 * Require authentication for page routes
 * Redirects to login page if user is not authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAuthPage = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect('/');
};

module.exports = { requireAuth, requireAuthPage };
