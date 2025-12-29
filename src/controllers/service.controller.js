const serviceService = require('../services/service.service');

const serviceController = {
    // API 13: Tạo mới
    create: async (req, res) => {
        try {
            const userId = req.user.id;
            const { categoryId, name, price, duration } = req.body;
            
            // Validate cơ bản
            if (!categoryId || !name || !price || !duration) {
                return res.status(400).json({ error: "Thiếu thông tin bắt buộc (Danh mục, Tên, Giá, Thời gian)" });
            }

            const result = await serviceService.create({ ...req.body, userId });
            res.status(201).json({ message: "Tạo dịch vụ thành công", data: result });
        } catch (err) { res.status(400).json({ error: err.message }); }
    },

    // API 14: Lấy danh sách của tôi
    getMyServices: async (req, res) => {
        try {
            const userId = req.user.id;
            const data = await serviceService.getProviderServices(userId);
            res.status(200).json({ data });
        } catch (err) { res.status(500).json({ error: err.message }); }
    },

    // API 15: Xem chi tiết (Public)
    getDetailPublic: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await serviceService.getServiceDetail(id);
            res.status(200).json({ data: result });
        } catch (err) { res.status(404).json({ error: err.message }); }
    },

    // API 16: Cập nhật
    update: async (req, res) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const result = await serviceService.update(userId, id, req.body);
            res.status(200).json({ message: "Cập nhật thành công", data: result });
        } catch (err) { res.status(400).json({ error: err.message }); }
    },

    // API 17: Xóa
    delete: async (req, res) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await serviceService.delete(userId, id);
            res.status(200).json({ message: "Đã xóa dịch vụ" });
        } catch (err) { res.status(400).json({ error: err.message }); }
    },

    // API 18: Thêm ảnh (Tạm thời nhận URL từ body)
    addImage: async (req, res) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { image_url } = req.body; // Sau này sẽ lấy từ file upload

            if (!image_url) return res.status(400).json({ error: "Chưa có link ảnh" });

            const result = await serviceService.addImage(userId, id, image_url);
            res.status(201).json({ message: "Thêm ảnh thành công", data: result });
        } catch (err) { res.status(400).json({ error: err.message }); }
    },
    // --- API 19: Lấy config ---
    getSchedule: async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await serviceService.getScheduleConfig(userId);
            res.status(200).json({ data: result });
        } catch (err) { res.status(500).json({ error: err.message }); }
    },

    // --- API 20: Update giờ chung ---
    updateGlobalSchedule: async (req, res) => {
        try {
            const userId = req.user.id;
            const { openTime, closeTime } = req.body; // VD: { "openTime": "08:00", "closeTime": "17:00" }

            if (!openTime || !closeTime) return res.status(400).json({ error: "Thiếu giờ mở/đóng cửa" });

            const result = await serviceService.updateGlobalConfig(userId, openTime, closeTime);
            res.status(200).json({ message: "Đã cập nhật giờ hoạt động", data: result });
        } catch (err) { res.status(400).json({ error: err.message }); }
    },

    // --- API 21: Block/Update ngày cụ thể ---
    updateDaySchedule: async (req, res) => {
        try {
            const userId = req.user.id;
            // Body: { "dayOfWeek": 0, "startTime": "08:00:00", "endTime": "12:00:00", "isDayOff": true }
            // 0 là Chủ Nhật, 1 là Thứ 2...
            
            const result = await serviceService.updateDaySchedule({ ...req.body, userId });
            res.status(200).json({ message: "Đã cập nhật lịch cho ngày này", data: result });
        } catch (err) { res.status(400).json({ error: err.message }); }
    }
};

module.exports = serviceController;