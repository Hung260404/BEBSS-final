const express = require('express');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP); 
router.post('/login', authController.login);
router.post('/oauth', authController.oauth);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;