const reviewService = require("../services/review.service");

const createReview = async (req, res) => {
  try {
    const { bookingId, providerId, rating, comment } = req.body;

    await reviewService.createReview({
      bookingId,
      providerId,
      customerId: req.user.id, // lấy từ middleware auth
      rating,
      comment,
    });

    res.json({
      success: true,
      message: "Đánh giá thành công",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createReview,
};
