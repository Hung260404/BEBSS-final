const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const verifyToken = require('../middlewares/verifyToken');

// API 22: Check slot (Public - Không cần login)
router.get('/availability', bookingController.checkAvailability);

// --- CÁC API CẦN LOGIN ---

// API 24: Tạo đơn mới
router.post('/create', verifyToken, bookingController.create);

// API 25: Xem lịch sử đơn hàng
router.get('/history', verifyToken, bookingController.getHistory);

// API 26: Xem chi tiết 1 đơn
router.get('/:id', verifyToken, bookingController.getDetail);

// API 27: Khách hủy đơn
router.post('/:id/cancel', verifyToken, bookingController.cancel);

// API 28: Provider Xác nhận
router.post('/:id/confirm', verifyToken, bookingController.confirm);

// API 29: Provider Từ chối
router.post('/:id/reject', verifyToken, bookingController.reject);

// API 30: Provider Hoàn thành
router.post('/:id/complete', verifyToken, bookingController.complete);

// API 31: Provider tạo phụ thu (Overtime)
router.post('/:id/sub-order', verifyToken, bookingController.createSubOrder);

module.exports = router;