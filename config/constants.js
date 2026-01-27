"use strict";

/**
 * Application constants
 * @module config/constants
 */
module.exports = {
  // Timeout for registration (30 seconds)
  REGISTER_TIMEOUT: 30000,

  // Cookie names
  COOKIE_NAME_REG_DATA: 'reg_data',
  COOKIE_NAME_REG_TIMESTAMP: 'reg_timestamp',

  // Validation rules - all fields must be between FIELD_MIN_LENGTH and FIELD_MAX_LENGTH
  VALIDATION: {
    FIELD_MIN_LENGTH: 3,
    FIELD_MAX_LENGTH: 32,
    NAME_PATTERN: /^[a-zA-Z]+$/,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    EMAIL_MAX_LENGTH: 255,
    MESSAGE_MAX_LENGTH: 1000
  },

  // Error messages
  ERRORS: {
    EMAIL_REQUIRED: 'Email is required',
    EMAIL_INVALID: 'Invalid email format',
    EMAIL_TOO_SHORT: 'Email must be at least 3 characters',
    EMAIL_TOO_LONG: 'Email must be at most 32 characters',
    EMAIL_EXISTS: 'This email is already in use, please choose another one',
    NAME_REQUIRED: 'Name is required',
    NAME_TOO_SHORT: 'Name must be at least 3 characters',
    NAME_TOO_LONG: 'Name must be at most 32 characters',
    NAME_INVALID: 'Name must contain only letters (a-z)',
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_TOO_SHORT: 'Password must be at least 3 characters',
    PASSWORD_TOO_LONG: 'Password must be at most 32 characters',
    PASSWORDS_MISMATCH: 'Passwords do not match',
    SESSION_EXPIRED: 'Registration session expired',
    SERVER_ERROR: 'Server error occurred'
  }
};
