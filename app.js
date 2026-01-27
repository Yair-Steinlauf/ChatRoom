var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');

// Load environment configuration
var env = require('./config/env');

var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api');

var { initDatabase } = require('./models');

var app = express();

// Initialize database connection
initDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Security headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: false // Adjust if needed for your app
}));

// Rate limiting - protect against brute force
const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger(env.app.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' })); // Prevent DoS with large payloads
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Session middleware - must be after cookieParser
app.use(session({
  secret: env.session.secret,
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Don't use default 'connect.sid' for security
  cookie: {
    secure: env.session.cookieSecure, // true only on HTTPS
    httpOnly: true, // Prevent XSS
    maxAge: env.session.cookieMaxAge,
    sameSite: 'lax' // CSRF protection
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

// API routes (must come before other routes)
app.use('/api', apiRouter);

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // For API requests, return JSON
  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      success: false,
      error: err.message
    });
  }

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
