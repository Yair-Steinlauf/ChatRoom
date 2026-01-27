"use strict";
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { VALIDATION } = require('../config/constants');

/**
 * Message model - represents a chat message
 * @module models/Message
 */
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, VALIDATION.MESSAGE_MAX_LENGTH]
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'messages',
  timestamps: true,  // createdAt, updatedAt
  paranoid: true     // soft delete (deletedAt)
});

module.exports = Message;
