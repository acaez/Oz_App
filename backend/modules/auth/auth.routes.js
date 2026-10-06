const router = require('express').Router();
const { requireAuth } = require('../../shared/requireAuth');
const {
  register,
  login,
  logout,
  me,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
} = require('./auth.controller');

// Public
router.post('/register',             register);
router.post('/login',                login);
router.post('/verify-email',         verifyEmail);
router.post('/forgot-password',      forgotPassword);
router.post('/reset-password',       resetPassword);
router.post('/resend-verification',  resendVerification);

// Protected
router.post('/logout', logout);
router.get('/me',      requireAuth, me);

module.exports = router;
