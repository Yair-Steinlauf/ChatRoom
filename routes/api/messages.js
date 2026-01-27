"use strict";
const express = require('express');
const router = express.Router();
const messageController = require('../../controllers/messageController');
const { requireAuth } = require('../../middleware/authMiddleware');

// כל ה-routes דורשים authentication
router.get('/', requireAuth, messageController.getMessages);
router.get('/last-update', requireAuth, messageController.getLastUpdateInfo);
router.get('/search', requireAuth, messageController.searchMessages);
router.post('/', requireAuth, messageController.createMessage);
router.put('/:id', requireAuth, messageController.updateMessage);
router.delete('/:id', requireAuth, messageController.deleteMessage);

module.exports = router;



