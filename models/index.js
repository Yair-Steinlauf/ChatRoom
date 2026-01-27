"use strict";
const sequelize = require('../config/database');
const User = require('./User');
const Message = require('./Message');

// Relationships
User.hasMany(Message, { foreignKey: 'userId' });
Message.belongsTo(User, { foreignKey: 'userId' });

/**
 * Initialize database connection and sync models
 * @returns {Promise<void>}
 */
const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');
  } catch (error) {
    console.error('Unable to connect to database:', error);
    throw error;
  }
};

module.exports = { sequelize, User, Message, initDatabase };
