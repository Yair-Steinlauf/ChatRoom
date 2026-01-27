"use strict";
const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const messageRoutes = require('./messages');

// Mount auth routes at /api/auth
router.use('/auth', authRoutes);

// Mount message routes at /api/messages
router.use('/messages', messageRoutes);

module.exports = router;
