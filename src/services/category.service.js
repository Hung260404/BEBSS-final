const prisma = require('../common/prisma/init.prisma');

const categoryService = {
    // 1. Lấy tất cả danh mục (Sắp xếp theo ID tăng dần)
    getAll: async () => {
        return await prisma.categories.findMany({
            orderBy: { id: 'asc' }
        });
    },

    // 2. Tạo danh mục mới (Dành cho Admin)
    create: async ({ name, image_url }) => {
        // Kiểm tra xem tên danh mục đã có chưa
        const exist = await prisma.categories.findUnique({ where: { name } });
        if (exist) throw new Error('Tên danh mục này đã tồn tại!');

        return await prisma.categories.create({
            data: { name, image_url }
        });
    }
};

module.exports = categoryService;