const express = require('express');
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// Tất cả API dưới đây đều cần đăng nhập
router.use(verifyToken);

router.get('/me', userController.getMe);
router.put('/profile', userController.updateProfile);
router.post('/kyc', userController.kyc);

module.exports = router;