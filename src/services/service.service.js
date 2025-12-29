const prisma = require("../common/prisma/init.prisma");

const serviceService = {
  // --- API 13: Tạo dịch vụ mới ---
  create: async ({
    userId,
    categoryId,
    name,
    description,
    price,
    duration,
    bufferTime,
  }) => {
    // Kiểm tra User có phải Provider không
    const provider = await prisma.providers.findUnique({
      where: { user_id: userId },
    });
    if (!provider) throw new Error("Bạn chưa đăng ký làm Provider!");

    return await prisma.services.create({
      data: {
        provider_id: userId,
        category_id: Number(categoryId),
        name,
        description,
        price: parseFloat(price),
        duration: Number(duration),
        buffer_time: Number(bufferTime) || 10,
        is_active: true,
        status: "ACTIVE",
      },
    });
  },

  // --- API 14: Lấy danh sách dịch vụ của chính Provider (Quản lý) ---
  getProviderServices: async (userId) => {
    return await prisma.services.findMany({
      where: {
        provider_id: userId,
        status: "ACTIVE", // Chỉ lấy các dịch vụ chưa bị xóa
      },
      include: {
        categories: true, // Đúng schema: categories (số nhiều)
        service_images: true,
      },
      orderBy: { created_at: "desc" },
    });
  },

  // --- API 15: Lấy chi tiết dịch vụ (Public - Khách xem) ---
  getServiceDetail: async (id) => {
    const service = await prisma.services.findUnique({
      where: { id: Number(id) },
      include: {
        // 1. Lấy thông tin Shop từ bảng providers
        providers: {
          include: {
            // 2. Từ Shop trỏ ngược về bảng users để lấy Avatar và SĐT
            users: {
              select: {
                avatar_url: true,
                phone: true,
                email: true,
                full_name: true,
              },
            },
          },
        },
        categories: true, // Đúng schema
        service_images: true,
      },
    });

    if (!service) throw new Error("Dịch vụ không tồn tại");

    // Kiểm tra nếu dịch vụ đã bị xóa hoặc tắt
    if (service.status === "INACTIVE" || service.is_active === false) {
      throw new Error("Dịch vụ này tạm thời không hoạt động");
    }

    // --- Xử lý dữ liệu cho đẹp (Flatten Data) ---
    // Giúp Frontend không phải gọi sâu kiểu: data.providers.users.avatar_url
    const responseData = {
      ...service,
      provider_info: {
        id: service.providers.user_id,
        business_name: service.providers.business_name,
        address: service.providers.address,
        trust_score: service.providers.trust_score,
        // Lấy thông tin cá nhân từ bảng users đã include ở trên
        owner_name: service.providers.users.full_name,
        avatar_url: service.providers.users.avatar_url,
        phone: service.providers.users.phone,
        email: service.providers.users.email,
      },
    };

    // Xóa key providers gốc đi cho đỡ rối (vì đã gom vào provider_info)
    delete responseData.providers;

    return responseData;
  },

  // --- API 16: Cập nhật thông tin dịch vụ ---
  update: async (userId, serviceId, data) => {
    // Check quyền sở hữu
    const service = await prisma.services.findFirst({
      where: { id: Number(serviceId), provider_id: userId },
    });
    if (!service) throw new Error("Bạn không có quyền sửa dịch vụ này");

    return await prisma.services.update({
      where: { id: Number(serviceId) },
      data: {
        name: data.name,
        price: data.price ? parseFloat(data.price) : undefined,
        description: data.description,
        duration: data.duration ? Number(data.duration) : undefined,
        buffer_time: data.buffer_time ? Number(data.buffer_time) : undefined,
        is_active: data.is_active, // Cho phép bật/tắt nhanh
      },
    });
  },

  // --- API 17: Xóa dịch vụ (Soft Delete) ---
  delete: async (userId, serviceId) => {
    const service = await prisma.services.findFirst({
      where: { id: Number(serviceId), provider_id: userId },
    });
    if (!service) throw new Error("Dịch vụ không tồn tại hoặc không chính chủ");

    return await prisma.services.update({
      where: { id: Number(serviceId) },
      data: {
        status: "INACTIVE",
        is_active: false,
      },
    });
  },

  // --- API 18: Thêm ảnh cho dịch vụ ---
  addImage: async (userId, serviceId, imageUrl) => {
    const service = await prisma.services.findFirst({
      where: { id: Number(serviceId), provider_id: userId },
    });
    if (!service)
      throw new Error("Không tìm thấy dịch vụ hoặc bạn không có quyền");

    return await prisma.service_images.create({
      data: {
        service_id: Number(serviceId),
        image_url: imageUrl,
      },
    });
  },

  // --- API 19: Lấy cấu hình lịch làm việc ---
  getScheduleConfig: async (userId) => {
    const provider = await prisma.providers.findUnique({
      where: { user_id: userId },
      select: { open_time: true, close_time: true },
    });

    if (!provider) throw new Error("Provider không tồn tại");

    const weeklySchedule = await prisma.schedules.findMany({
      where: { provider_id: userId },
      orderBy: { day_of_week: "asc" },
    });

    return {
      general: provider,
      details: weeklySchedule,
    };
  },

  // --- API 20: Cập nhật giờ mở/đóng cửa chung ---
  updateGlobalConfig: async (userId, openTime, closeTime) => {
    return await prisma.providers.update({
      where: { user_id: userId },
      data: {
        open_time: openTime,
        close_time: closeTime,
      },
    });
  },

  // --- API 21: Cập nhật lịch chi tiết từng ngày ---
  updateDaySchedule: async ({
    userId,
    dayOfWeek,
    startTime,
    endTime,
    isDayOff,
  }) => {
    const dummyDate = "1970-01-01T";

    const existing = await prisma.schedules.findFirst({
      where: { provider_id: userId, day_of_week: dayOfWeek },
    });

    if (existing) {
      return await prisma.schedules.update({
        where: { id: existing.id },
        data: {
          start_time: new Date(`${dummyDate}${startTime}`),
          end_time: new Date(`${dummyDate}${endTime}`),
          is_day_off: isDayOff,
        },
      });
    } else {
      return await prisma.schedules.create({
        data: {
          provider_id: userId,
          day_of_week: dayOfWeek,
          start_time: new Date(`${dummyDate}${startTime}`),
          end_time: new Date(`${dummyDate}${endTime}`),
          is_day_off: isDayOff,
        },
      });
    }
  },
};

module.exports = serviceService;
