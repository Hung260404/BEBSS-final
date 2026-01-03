const prisma = require("../common/prisma/init.prisma");

const bookingService = {
  // --- API 22: Kiểm tra khung giờ trống ---
  checkAvailability: async ({ providerId, serviceId, date }) => {
    const service = await prisma.services.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service) throw new Error("Dịch vụ không tồn tại");

    const duration = service.duration;
    const bufferTime = service.buffer_time || 10;
    const totalSlotTime = duration + bufferTime;

    const provider = await prisma.providers.findUnique({
      where: { user_id: Number(providerId) },
    });
    if (!provider) throw new Error("Provider không tồn tại");

    const timeToMinutes = (timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    let startWorkMinutes = timeToMinutes(provider.open_time || "08:00");
    let endWorkMinutes = timeToMinutes(provider.close_time || "22:00");

    const dayOfWeek = new Date(date).getDay();
    const daySchedule = await prisma.schedules.findFirst({
      where: { provider_id: Number(providerId), day_of_week: dayOfWeek },
    });

    if (daySchedule) {
      if (daySchedule.is_day_off) return [];
      startWorkMinutes =
        daySchedule.start_time.getHours() * 60 +
        daySchedule.start_time.getMinutes();
      endWorkMinutes =
        daySchedule.end_time.getHours() * 60 +
        daySchedule.end_time.getMinutes();
    }

    const searchDate = new Date(date);
    const nextDate = new Date(date);
    nextDate.setDate(searchDate.getDate() + 1);

    const existBookings = await prisma.bookings.findMany({
      where: {
        provider_id: Number(providerId),
        status: { notIn: ["CANCELLED", "REJECTED"] },
        booking_date: { gte: searchDate, lt: nextDate },
      },
      select: { start_time: true, end_time: true },
    });

    const bookedSlots = existBookings.map((b) => ({
      start: b.start_time.getHours() * 60 + b.start_time.getMinutes(),
      end: b.end_time.getHours() * 60 + b.end_time.getMinutes(),
    }));

    const availableSlots = [];
    let currentSlotStart = startWorkMinutes;

    while (currentSlotStart + duration <= endWorkMinutes) {
      const currentSlotEnd = currentSlotStart + duration;
      const isConflict = bookedSlots.some(
        (b) => currentSlotStart < b.end && currentSlotEnd > b.start
      );

      if (!isConflict) {
        const h = Math.floor(currentSlotStart / 60)
          .toString()
          .padStart(2, "0");
        const m = (currentSlotStart % 60).toString().padStart(2, "0");
        availableSlots.push(`${h}:${m}`);
      }

      currentSlotStart += totalSlotTime;
    }

    return availableSlots;
  },

  // --- API 23: Tạo booking ---
  createBooking: async ({
    userId,
    providerId,
    serviceId,
    date,
    startTime,
    paymentMethod,
  }) => {
    return await prisma.$transaction(async (tx) => {
      const service = await tx.services.findUnique({
        where: { id: Number(serviceId) },
      });
      if (!service) throw new Error("Dịch vụ không tồn tại");

      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(
        startDateTime.getTime() + service.duration * 60000
      );

      // 🔒 CHECK TRÙNG SLOT TRONG TRANSACTION
      const conflict = await tx.bookings.findFirst({
        where: {
          provider_id: Number(providerId),
          booking_date: new Date(date),
          status: { notIn: ["CANCELLED", "REJECTED"] },
          OR: [
            {
              start_time: { lte: startDateTime },
              end_time: { gt: startDateTime },
            },
            {
              start_time: { lt: endDateTime },
              end_time: { gte: endDateTime },
            },
          ],
        },
      });

      if (conflict) {
        throw new Error("Slot này vừa được người khác đặt trước");
      }

      // ✅ CREATE BOOKING
      const booking = await tx.bookings.create({
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

      // CREATE PAYMENT
      await tx.payments.create({
        data: {
          booking_id: booking.id,
          amount: service.price,
          method: paymentMethod || "CASH",
          status: "PENDING",
        },
      });

      return booking;
    });
  },

  // --- API: Khách thanh toán ---
  customerPay: async ({ userId, bookingId, method, transactionCode }) => {
    const booking = await prisma.bookings.findUnique({
      where: { id: Number(bookingId) },
      include: { payments: true },
    });

    if (!booking) throw new Error("Không tìm thấy booking");
    if (booking.customer_id !== userId)
      throw new Error("Bạn không có quyền thanh toán");

    if (booking.status !== "PENDING_PAYMENT")
      throw new Error("Booking không ở trạng thái chờ thanh toán");

    // 🔒 Chặn thanh toán trùng
    const existingPayment = booking.payments.find(
      (p) => p.status === "PENDING" || p.status === "PROCESSING"
    );
    if (existingPayment) throw new Error("Đơn này đã có yêu cầu thanh toán");

    // 👉 PHẦN BẠN HỎI: LẤY PHỤ THU
    const subOrders = await prisma.sub_orders.findMany({
      where: {
        booking_id: booking.id,
        status: "UNPAID",
      },
    });

    const subTotal = subOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalAmount = booking.total_amount + subTotal;

    // CASH thì chờ provider xác nhận, ONLINE thì chờ webhook
    const paymentStatus = method === "CASH" ? "PENDING" : "PROCESSING";

    return await prisma.payments.create({
      data: {
        booking_id: booking.id,
        transaction_code: transactionCode || null,
        amount: totalAmount, // ✅ DÙNG totalAmount
        method,
        status: paymentStatus,
      },
    });
  },

  // --- API: Provider xác nhận đã nhận tiền ---
  providerConfirmPayment: async (providerId, bookingId) => {
    const booking = await prisma.bookings.findUnique({
      where: { id: Number(bookingId) },
      include: { payments: true },
    });

    if (!booking) throw new Error("Không tìm thấy booking");
    if (booking.provider_id !== providerId) throw new Error("Không có quyền");

    const payment = booking.payments[0];
    if (!payment) throw new Error("Chưa có thanh toán");

    if (payment.method !== "CASH")
      throw new Error("Thanh toán online không xác nhận thủ công");

    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        payment_time: new Date(),
      },
    });

    return await prisma.bookings.update({
      where: { id: booking.id },
      data: { status: "PAID" },
    });
  },
};
module.exports = bookingService;
