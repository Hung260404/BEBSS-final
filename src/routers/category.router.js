const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const verifyToken = require('../middlewares/verifyToken');

// PUBLIC: Ai cũng xem được (để hiện lên trang chủ)
router.get('/', categoryController.getAll);

// PRIVATE: Phải đăng nhập mới được tạo (Sau này là Admin)
router.post('/', verifyToken, categoryController.create);

module.exports = router;