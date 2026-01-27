var express = require('express');
var path = require('path');
var router = express.Router();
var { requireAuthPage } = require('../middleware/authMiddleware');
var { Message, User } = require('../models');
var { sanitizeString } = require('../utils/validators');

/* GET home page - משרת את ה-SPA HTML */
router.get('/', function(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/chatroom');
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/* GET /register - דף הרשמה */
router.get('/register', function(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/chatroom');
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/* GET /chatroom - דף הצ'אט */
router.get('/chatroom', function(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '../public/chatroom.html'));
});

/* POST /messages - הוספת הודעה (טופס רגיל, לא fetch) */
router.post('/messages', requireAuthPage, async function(req, res, next) {
  try {
    var content = sanitizeString(req.body.content);
    if (!content) {
      return res.redirect('/chatroom');
    }
    if (content.length > 1000) {
      return res.redirect('/chatroom');
    }
    await Message.create({
      content: content,
      userId: req.session.userId
    });
    res.redirect('/chatroom');
  } catch (error) {
    console.error('Add message error:', error);
    res.redirect('/chatroom');
  }
});

/* GET /messages/:id/delete - דף אישור מחיקה */
router.get('/messages/:id/delete', requireAuthPage, async function(req, res, next) {
  try {
    var messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) {
      return res.redirect('/chatroom');
    }
    var message = await Message.findByPk(messageId, {
      include: [{ model: User, attributes: ['id', 'firstName', 'lastName'] }]
    });
    if (!message) {
      return res.redirect('/chatroom');
    }
    // בדיקת בעלות
    if (message.userId !== req.session.userId) {
      return res.redirect('/chatroom');
    }
    res.render('delete-confirm', { message: message });
  } catch (error) {
    console.error('Delete confirm error:', error);
    res.redirect('/chatroom');
  }
});

/* POST /messages/:id/delete - ביצוע מחיקה (טופס רגיל) */
router.post('/messages/:id/delete', requireAuthPage, async function(req, res, next) {
  try {
    var messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) {
      return res.redirect('/chatroom');
    }
    var message = await Message.findByPk(messageId);
    if (!message) {
      return res.redirect('/chatroom');
    }
    // בדיקת בעלות
    if (message.userId !== req.session.userId) {
      return res.redirect('/chatroom');
    }
    await message.destroy(); // soft delete (paranoid)
    res.redirect('/chatroom');
  } catch (error) {
    console.error('Delete message error:', error);
    res.redirect('/chatroom');
  }
});

module.exports = router;
