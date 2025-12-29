const prisma = require("../common/prisma/init.prisma");

// (Logic: Tính toán giờ trống, tạo đơn, đổi trạng thái, phụ thu)
const bookingService = {
  // --- API 22: Kiểm tra khung giờ trống (Availability) ---
  checkAvailability: async ({ providerId, serviceId, date }) => {
    // 1. Lấy thông tin Dịch vụ
    const service = await prisma.services.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service) throw new Error("Dịch vụ không tồn tại");

    const duration = service.duration; // VD: 60 phút
    const bufferTime = service.buffer_time || 10; // Nghỉ 10 phút
    const totalSlotTime = duration + bufferTime; // Tổng 1 slot = 70 phút

    // 2. Lấy giờ mở/đóng cửa của Provider
    const provider = await prisma.providers.findUnique({
      where: { user_id: Number(providerId) },
    });
    if (!provider) throw new Error("Provider không tồn tại");

    // Hàm convert giờ "08:00" -> phút
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    let startWorkMinutes = timeToMinutes(provider.open_time || "08:00");
    let endWorkMinutes = timeToMinutes(provider.close_time || "22:00");

    // 3. Kiểm tra lịch riêng (Block date / Custom hours)
    const dayOfWeek = new Date(date).getDay(); // 0: CN, 1: T2...
    const daySchedule = await prisma.schedules.findFirst({
      where: { provider_id: Number(providerId), day_of_week: dayOfWeek },
    });

    if (daySchedule) {
      if (daySchedule.is_day_off) return []; // Nghỉ cả ngày -> Trả về rỗng
      // Nếu có giờ riêng thì lấy giờ đó
      if (daySchedule.start_time) {
        startWorkMinutes =
          daySchedule.start_time.getHours() * 60 +
          daySchedule.start_time.getMinutes();
        endWorkMinutes =
          daySchedule.end_time.getHours() * 60 +
          daySchedule.end_time.getMinutes();
      }
    }

    // 4. Lấy các đơn ĐÃ ĐẶT trong ngày (để loại trừ)
    const searchDate = new Date(date);
    const nextDate = new Date(date);
    nextDate.setDate(searchDate.getDate() + 1);

    const existBookings = await prisma.bookings.findMany({
      where: {
        provider_id: Number(providerId),
        status: { notIn: ["CANCELLED", "REJECTED"] }, // Lấy đơn Confirmed hoặc Pending
        booking_date: {
          gte: searchDate,
          lt: nextDate,
        },
      },
      select: { start_time: true, end_time: true },
    });

    // Chuyển đơn đã đặt sang phút [start, end]
    const bookedSlots = existBookings.map((b) => ({
      start: b.start_time.getHours() * 60 + b.start_time.getMinutes(),
      end: b.end_time.getHours() * 60 + b.end_time.getMinutes(),
    }));

    // 5. Thuật toán tìm slot trống
    let availableSlots = [];
    let currentSlotStart = startWorkMinutes;

    while (currentSlotStart + duration <= endWorkMinutes) {
      const currentSlotEnd = currentSlotStart + duration;

      // Check trùng
      const isConflict = bookedSlots.some((booking) => {
        return currentSlotStart < booking.end && currentSlotEnd > booking.start;
      });

      if (!isConflict) {
        // Đổi phút ra giờ:phút "08:30"
        const toTimeStr = (totalMins) => {
          const h = Math.floor(totalMins / 60)
            .toString()
            .padStart(2, "0");
          const m = (totalMins % 60).toString().padStart(2, "0");
          return `${h}:${m}`;
        };
        availableSlots.push(toTimeStr(currentSlotStart));
      }

      // Cộng thêm thời gian làm + nghỉ để nhảy slot tiếp theo
      currentSlotStart += totalSlotTime;
    }

    return availableSlots;
  },

  // --- API 23 & 24: Tạo Booking mới ---
  createBooking: async ({
    userId,
    providerId,
    serviceId,
    date,
    startTime,
    paymentMethod,
  }) => {
    // Lấy service
    const service = await prisma.services.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service) throw new Error("Dịch vụ không tồn tại");

    // Tính giờ kết thúc
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(
      startDateTime.getTime() + service.duration * 60000
    );

    // Check trùng lần cuối
    const conflict = await prisma.bookings.findFirst({
      where: {
        provider_id: Number(providerId),
        status: { notIn: ["CANCELLED", "REJECTED"] },
        booking_date: new Date(date),
        OR: [
          {
            start_time: { lte: startDateTime },
            end_time: { gt: startDateTime },
          },
          { start_time: { lt: endDateTime }, end_time: { gte: endDateTime } },
        ],
      },
    });

    if (conflict)
      throw new Error("Rất tiếc! Slot này vừa có người đặt mất rồi.");

    // Tạo Booking
    const newBooking = await prisma.bookings.create({
      data: {
        customer_id: userId,
        provider_id: Number(providerId),
        service_id: Number(serviceId),
        booking_date: new Date(date),
        start_time: startDateTime,
        end_time: endDateTime,
        total_amount: service.price,
        status: "PENDING_PAYMENT",
      },
    });

    // Tạo Payment Record (Chờ thanh toán)
    await prisma.payments.create({
      data: {
        booking_id: newBooking.id,
        amount: service.price,
        method: paymentMethod || "CASH",
        status: "PENDING",
      },
    });

    return newBooking;
  },

  // --- API 25: Lịch sử Booking ---
  getHistory: async (userId, role) => {
    const whereCondition =
      role === "PROVIDER" ? { provider_id: userId } : { customer_id: userId };

    return await prisma.bookings.findMany({
      where: whereCondition,
      include: {
        services: { select: { name: true } },
        users: {
          select: { full_name: true, phone: true }, // Lấy thông tin khách
        },
        providers: {
          select: {
            business_name: true,
            address: true,
            // Quan trọng: Lấy phone của Provider qua bảng users
            users: {
              select: { phone: true, avatar_url: true },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  },

  // --- API 26: Chi tiết Booking ---
  getDetail: async (userId, bookingId) => {
    const booking = await prisma.bookings.findUnique({
      where: { id: Number(bookingId) },
      include: {
        services: true,
        payments: true,
        sub_orders: true,

        // 1. Lấy thông tin khách hàng (Người đặt)
        users: {
          select: {
            full_name: true,
            phone: true,
            avatar_url: true,
            email: true,
          },
        },

        // 2. Lấy thông tin Chủ Shop (Provider)
        providers: {
          select: {
            business_name: true,
            address: true,
            trust_score: true,
            // SỬA LỖI: Lấy sđt và avatar từ bảng users (Nested Relation)
            users: {
              select: {
                phone: true,
                avatar_url: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!booking) throw new Error("Đơn đặt lịch không tồn tại");

    // Bảo mật: Chỉ chủ đơn hoặc chủ shop mới được xem
    if (booking.customer_id !== userId && booking.provider_id !== userId) {
      // throw new Error("Bạn không có quyền xem đơn này");
    }

    // Flatten data cho dễ dùng (Tùy chọn)
    const responseData = {
      ...booking,
      provider_info: {
        business_name: booking.providers.business_name,
        address: booking.providers.address,
        phone: booking.providers.users.phone, // Đã lấy được sđt
        avatar: booking.providers.users.avatar_url, // Đã lấy được avatar
      },
      customer_info: booking.users,
    };

    // Xóa key thừa cho gọn
    delete responseData.providers;
    delete responseData.users;

    return responseData;
  },

  // --- API 27: Khách hủy đơn ---
  cancelBooking: async (userId, bookingId, reason) => {
    const booking = await prisma.bookings.findFirst({
      where: { id: Number(bookingId), customer_id: userId },
    });
    if (!booking) throw new Error("Đơn không tồn tại");
    if (["COMPLETED", "CANCELLED", "REJECTED"].includes(booking.status)) {
      throw new Error("Không thể hủy đơn ở trạng thái này");
    }

    return await prisma.bookings.update({
      where: { id: Number(bookingId) },
      data: { status: "CANCELLED", cancellation_reason: reason },
    });
  },

  // --- API 28, 29, 30: Provider xử lý đơn ---
  updateStatus: async (providerId, bookingId, status) => {
    const booking = await prisma.bookings.findFirst({
      where: { id: Number(bookingId), provider_id: providerId },
    });
    if (!booking) throw new Error("Đơn không tồn tại hoặc không phải của bạn");

    return await prisma.bookings.update({
      where: { id: Number(bookingId) },
      data: { status: status },
    });
  },

  // --- API 31: Tạo đơn phụ thu (Sub-order) ---
  createSubOrder: async (providerId, bookingId, amount, note) => {
    const booking = await prisma.bookings.findFirst({
      where: { id: Number(bookingId), provider_id: providerId },
    });
    if (!booking) throw new Error("Đơn không hợp lệ");

    return await prisma.sub_orders.create({
      data: {
        booking_id: Number(bookingId),
        amount: parseFloat(amount),
        note: note,
        status: "UNPAID",
      },
    });
  },
};

module.exports = bookingService;
