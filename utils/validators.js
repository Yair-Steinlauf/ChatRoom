"use strict";

const { VALIDATION, ERRORS } = require('../config/constants');

/**
 * Validation utilities
 * Server-side validation functions - DO NOT TRUST CLIENT VALIDATION
 * @module utils/validators
 */

/**
 * Validate name field (3-32 chars, letters only)
 * @param {string} name - Name to validate
 * @returns {string|null} Error message or null if valid
 */
const validateName = (name) => {
  if (!name || !name.trim()) return ERRORS.NAME_REQUIRED;
  const trimmed = name.trim();
  if (trimmed.length < VALIDATION.FIELD_MIN_LENGTH) return ERRORS.NAME_TOO_SHORT;
  if (trimmed.length > VALIDATION.FIELD_MAX_LENGTH) return ERRORS.NAME_TOO_LONG;
  if (!VALIDATION.NAME_PATTERN.test(trimmed)) return ERRORS.NAME_INVALID;
  return null;
};

/**
 * Validate email field (3-32 chars, valid email format)
 * @param {string} email - Email to validate
 * @returns {string|null} Error message or null if valid
 */
const validateEmail = (email) => {
  if (!email || !email.trim()) return ERRORS.EMAIL_REQUIRED;
  const trimmed = email.trim();
  if (trimmed.length < VALIDATION.FIELD_MIN_LENGTH) return ERRORS.EMAIL_TOO_SHORT;
  if (trimmed.length > VALIDATION.FIELD_MAX_LENGTH) return ERRORS.EMAIL_TOO_LONG;
  if (!VALIDATION.EMAIL_PATTERN.test(trimmed)) return ERRORS.EMAIL_INVALID;
  return null;
};

/**
 * Validate password field (3-32 chars)
 * @param {string} password - Password to validate
 * @returns {string|null} Error message or null if valid
 */
const validatePassword = (password) => {
  if (!password) return ERRORS.PASSWORD_REQUIRED;
  if (password.length < VALIDATION.FIELD_MIN_LENGTH) return ERRORS.PASSWORD_TOO_SHORT;
  if (password.length > VALIDATION.FIELD_MAX_LENGTH) return ERRORS.PASSWORD_TOO_LONG;
  return null;
};

/**
 * Validate message content (1 to MESSAGE_MAX_LENGTH chars)
 * @param {string} content - Message content to validate
 * @returns {string|null} Error message or null if valid
 */
const validateMessageContent = (content) => {
  if (!content || typeof content !== 'string') {
    return 'Message content is required';
  }
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return 'Message content cannot be empty';
  }
  if (trimmed.length > VALIDATION.MESSAGE_MAX_LENGTH) {
    return `Message content must be at most ${VALIDATION.MESSAGE_MAX_LENGTH} characters`;
  }
  return null;
};

/**
 * Sanitize string input (trim whitespace)
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim();
};

/**
 * Normalize email to lowercase
 * @param {string} email - Email to normalize
 * @returns {string} Normalized email
 */
const normalizeEmail = (email) => {
  return sanitizeString(email).toLowerCase();
};

module.exports = {
  validateName,
  validateEmail,
  validatePassword,
  validateMessageContent,
  sanitizeString,
  normalizeEmail
};
