"use strict";

const { Message, User } = require('../models');
const { Op } = require('sequelize');
const { validateMessageContent, sanitizeString } = require('../utils/validators');

/**
 * Message Controller
 * Handles HTTP requests/responses and business logic for messages (MVC pattern)
 */

/**
 * Build message DTO (Data Transfer Object) - only expose safe fields
 * @param {Object} msg - Sequelize message instance
 * @returns {Object} Safe message DTO with id, content, timestamps, and user info
 */
const buildMessageDto = (msg) => ({
  id: msg.id,
  content: msg.content,
  createdAt: msg.createdAt,
  updatedAt: msg.updatedAt,
  user: {
    id: msg.User.id,
    firstName: msg.User.firstName,
    lastName: msg.User.lastName
  }
});

/**
 * Get last update timestamp across all messages (including deleted)
 * Used for polling to detect changes
 * @returns {Promise<Date|null>} Last update timestamp or null
 */
const getLastUpdateTimestamp = async () => {
  const [latestUpdatedAt, latestDeletedAt, latestCreatedAt] = await Promise.all([
    Message.max('updatedAt', { paranoid: false }),
    Message.max('deletedAt', { paranoid: false }),
    Message.max('createdAt', { paranoid: false })
  ]);

  const timestamps = [latestUpdatedAt, latestDeletedAt, latestCreatedAt]
    .filter(Boolean)
    .map(date => new Date(date).getTime());

  if (!timestamps.length) {
    return null;
  }

  return new Date(Math.max(...timestamps));
};

/**
 * GET /api/messages - Get all messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      paranoid: true
    });

    const lastUpdateAt = await getLastUpdateTimestamp();

    res.json({
      success: true,
      lastUpdateAt: lastUpdateAt ? lastUpdateAt.toISOString() : null,
      messages: messages.map(buildMessageDto)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
};

/**
 * POST /api/messages - Create a new message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createMessage = async (req, res) => {
  try {
    // CRITICAL: Always use userId from session, never trust client
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { content } = req.body;

    // Validate content (server-side validation is critical)
    const validationError = validateMessageContent(content);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }

    // Sanitize and create
    const sanitizedContent = sanitizeString(content);
    const message = await Message.create({
      content: sanitizedContent,
      userId: userId
    });

    // Fetch with user data for response
    const messageWithUser = await Message.findByPk(message.id, {
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    res.status(201).json({
      success: true,
      message: buildMessageDto(messageWithUser)
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create message'
    });
  }
};

/**
 * PUT /api/messages/:id - Update a message (with ownership check)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateMessage = async (req, res) => {
  try {
    // CRITICAL: Always use userId from session, never trust client
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message ID'
      });
    }

    const { content } = req.body;

    // Validate content
    const validationError = validateMessageContent(content);
    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      });
    }

    // Find message
    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // CRITICAL: Ownership check - server must verify, never trust client
    if (message.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own messages'
      });
    }

    // Sanitize and update
    const sanitizedContent = sanitizeString(content);
    await message.update({ content: sanitizedContent });

    const lastUpdateAt = await getLastUpdateTimestamp();

    res.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        updatedAt: message.updatedAt
      },
      lastUpdateAt: lastUpdateAt ? lastUpdateAt.toISOString() : null
    });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update message'
    });
  }
};

/**
 * DELETE /api/messages/:id - Delete a message (with ownership check)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteMessage = async (req, res) => {
  try {
    // CRITICAL: Always use userId from session, never trust client
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message ID'
      });
    }

    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // CRITICAL: Ownership check - server must verify, never trust client
    if (message.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own messages'
      });
    }

    // Soft delete (paranoid mode)
    await message.destroy();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    });
  }
};

/**
 * GET /api/messages/search?q=... - Search messages by content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchMessages = async (req, res) => {
  try {
    const query = sanitizeString(req.query.q);

    if (!query || query.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const messages = await Message.findAll({
      where: {
        content: {
          [Op.like]: `%${query}%`
        }
      },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      paranoid: true
    });

    const lastUpdateAt = await getLastUpdateTimestamp();

    res.json({
      success: true,
      lastUpdateAt: lastUpdateAt ? lastUpdateAt.toISOString() : null,
      messages: messages.map(buildMessageDto)
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search messages'
    });
  }
};

/**
 * GET /api/messages/last-update - Get last update timestamp for polling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getLastUpdateInfo = async (req, res) => {
  try {
    const lastUpdateAt = await getLastUpdateTimestamp();
    res.json({
      success: true,
      lastUpdateAt: lastUpdateAt ? lastUpdateAt.toISOString() : null
    });
  } catch (error) {
    console.error('Last update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch last update time'
    });
  }
};
