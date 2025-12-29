const prisma = require('../common/prisma/init.prisma');

// 9. Lấy thông tin user (Me)
const getMe = async (id) => {
    const user = await prisma.users.findUnique({
        where: { id },
        select: { id: true, email: true, full_name: true, phone: true, role: true, avatar_url: true }
    });
    
    // Nếu là provider thì lấy thêm thông tin shop
    if (user.role === 'PROVIDER') {
        const providerInfo = await prisma.providers.findUnique({ where: { user_id: id } });
        return { ...user, provider_info: providerInfo };
    }
    return user;
};

// 10. Cập nhật hồ sơ
const updateProfile = async (id, data) => {
    return await prisma.users.update({
        where: { id },
        data: {
            full_name: data.full_name,
            phone: data.phone,
            avatar_url: data.avatar_url
        },
        select: { id: true, full_name: true, phone: true, avatar_url: true }
    });
};

// 11. Upload KYC (Provider)
const uploadKYC = async (userId, { business_name, address, kyc_image_url }) => {
    // Cập nhật thông tin vào bảng providers
    // Lưu ý: userId ở bảng users chính là user_id ở bảng providers
    return await prisma.providers.update({
        where: { user_id: userId },
        data: {
            business_name,
            address,
            kyc_status: 'PENDING', // Chuyển trạng thái chờ duyệt
            // Giả sử logic upload ảnh đã xử lý xong và trả về link ảnh
            description: `KYC Document: ${kyc_image_url}` 
        }
    });
};

module.exports = { getMe, updateProfile, uploadKYC };