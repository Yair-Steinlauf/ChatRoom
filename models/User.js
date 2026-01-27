"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');
const { VALIDATION } = require('../config/constants');

/**
 * User model - represents a registered user
 * @module models/User
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(VALIDATION.EMAIL_MAX_LENGTH),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [VALIDATION.FIELD_MIN_LENGTH, VALIDATION.FIELD_MAX_LENGTH]
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },
  firstName: {
    type: DataTypes.STRING(VALIDATION.FIELD_MAX_LENGTH),
    allowNull: false,
    field: 'first_name',
    validate: {
      len: [VALIDATION.FIELD_MIN_LENGTH, VALIDATION.FIELD_MAX_LENGTH],
      is: VALIDATION.NAME_PATTERN
    },
    set(value) {
      this.setDataValue('firstName', value.toLowerCase().trim());
    }
  },
  lastName: {
    type: DataTypes.STRING(VALIDATION.FIELD_MAX_LENGTH),
    allowNull: false,
    field: 'last_name',
    validate: {
      len: [VALIDATION.FIELD_MIN_LENGTH, VALIDATION.FIELD_MAX_LENGTH],
      is: VALIDATION.NAME_PATTERN
    },
    set(value) {
      this.setDataValue('lastName', value.toLowerCase().trim());
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [VALIDATION.FIELD_MIN_LENGTH, VALIDATION.FIELD_MAX_LENGTH]
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

/**
 * Compare password with hashed password
 * @param {string} candidatePassword - Plain text password
 * @returns {Promise<boolean>} True if passwords match
 */
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
