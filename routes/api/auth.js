"use strict";
const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');

// Registration Step 1 routes
router.get('/register/step1', authController.getRegistrationStep1);
router.post('/register/step1', authController.postRegistrationStep1);

// Registration Step 2 routes
router.get('/register/step2', authController.getRegistrationStep2);
router.post('/register/step2', authController.postRegistrationStep2);

// Cancel registration
router.delete('/register', authController.cancelRegistration);

// Login routes
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);  // מי אני?

module.exports = router;
