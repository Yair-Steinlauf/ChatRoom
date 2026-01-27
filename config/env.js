"use strict";

require('dotenv').config();

/**
 * Environment configuration
 * Loads and validates environment variables
 * @module config/env
 */
module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'mydb',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password'
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    cookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
    cookieMaxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE || '86400000', 10)
  },
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10)
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  }
};
