const categoryService = require('../services/category.service');

const categoryController = {
    // GET /api/categories
    getAll: async (req, res) => {
        try {
            const data = await categoryService.getAll();
            res.status(200).json({ data });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // POST /api/categories
    create: async (req, res) => {
        try {
            const { name, image_url } = req.body;
            
            if (!name) return res.status(400).json({ error: "Vui lòng nhập tên danh mục" });

            const data = await categoryService.create({ name, image_url });
            res.status(201).json({ message: "Tạo danh mục thành công", data });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = categoryController;