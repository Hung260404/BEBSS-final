const router = require("express").Router();
const reviewController = require("../controllers/review.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, reviewController.createReview);

module.exports = router;
