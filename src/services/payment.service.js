const prisma = require("../common/prisma/init.prisma");

const handleWebhook = async ({ bookingId, success, gatewayRef }) => {
  const booking = await prisma.bookings.findUnique({
    where: { id: Number(bookingId) },
    include: { payments: true },
  });

  if (!booking) throw new Error("Booking không tồn tại");

  const payment = booking.payments.find((p) => p.status === "PROCESSING");
  if (!payment) throw new Error("Không có payment đang xử lý");

  if (!success) {
    return await prisma.payments.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
  }

  await prisma.payments.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      transaction_code: gatewayRef,
      payment_time: new Date(),
    },
  });

  return await prisma.bookings.update({
    where: { id: booking.id },
    data: { status: "PAID" },
  });
};

module.exports = { handleWebhook };
