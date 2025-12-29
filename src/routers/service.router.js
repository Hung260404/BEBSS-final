const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const verifyToken = require('../middlewares/verifyToken');


// API 13: Tạo dịch vụ mới
router.post('/', verifyToken, serviceController.create);

// API 14: Lấy danh sách dịch vụ CỦA TÔI
router.get('/provider/me', verifyToken, serviceController.getMyServices);

// API 16: Cập nhật dịch vụ
router.put('/:id', verifyToken, serviceController.update);

// API 17: Xóa (ẩn) dịch vụ
router.delete('/:id', verifyToken, serviceController.delete);

// API 18: Upload ảnh cho dịch vụ
// (Tạm thời dùng POST body JSON, sau này tích hợp Multer sẽ sửa dòng này chút xíu)
router.post('/:id/images', verifyToken, serviceController.addImage);


// --- NHÓM API PUBLIC (Ai cũng xem được) ---

// API 15: Xem chi tiết một dịch vụ
router.get('/:id/public', serviceController.getDetailPublic);
// --- NHÓM QUẢN LÝ LỊCH (SCHEDULE) ---

// API 19: Xem cấu hình lịch hiện tại
router.get('/schedule/config', verifyToken, serviceController.getSchedule);

// API 20: Cập nhật giờ mở cửa chung (Global)
router.post('/schedule/config', verifyToken, serviceController.updateGlobalSchedule);

// API 21: Cập nhật lịch chi tiết (Block ngày nghỉ / Sửa giờ từng thứ trong tuần)
router.post('/schedule/block', verifyToken, serviceController.updateDaySchedule);
module.exports = router;