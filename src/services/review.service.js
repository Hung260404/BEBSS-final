const prisma = require("../common/prisma/init.prisma");

const reviewService = {
  // --- Tạo đánh giá ---
  createReview: async ({
    bookingId,
    providerId,
    customerId,
    rating,
    comment,
  }) => {
    if (rating < 1 || rating > 5) {
      throw new Error("Rating phải từ 1 đến 5 sao");
    }

    return await prisma.$transaction(async (tx) => {
      // 1️⃣ Kiểm tra booking
      const booking = await tx.bookings.findUnique({
        where: { id: Number(bookingId) },
      });

      if (!booking) throw new Error("Booking không tồn tại");

      if (booking.customer_id !== customerId) {
        throw new Error("Bạn không có quyền đánh giá booking này");
      }

      if (booking.status !== "COMPLETED") {
        throw new Error("Chỉ được đánh giá khi dịch vụ đã hoàn thành");
      }

      // 2️⃣ Check đã review chưa
      const existReview = await tx.reviews.findFirst({
        where: { booking_id: booking.id },
      });

      if (existReview) {
        throw new Error("Booking này đã được đánh giá");
      }

      // 3️⃣ Tạo review
      await tx.reviews.create({
        data: {
          booking_id: booking.id,
          provider_id: providerId,
          customer_id: customerId,
          rating,
          comment: comment || null,
        },
      });

      // 4️⃣ Cập nhật trust score
      const provider = await tx.providers.findUnique({
        where: { user_id: providerId },
      });

      const newTotalReviews = provider.total_reviews + 1;
      const newTrustScore =
        (provider.trust_score * provider.total_reviews + rating) /
        newTotalReviews;

      await tx.providers.update({
        where: { user_id: providerId },
        data: {
          trust_score: Number(newTrustScore.toFixed(2)),
          total_reviews: newTotalReviews,
        },
      });

      return { success: true };
    });
  },
};

module.exports = reviewService;
