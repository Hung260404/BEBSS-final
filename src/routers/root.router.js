const express = require('express');
const router = express.Router();

// 1. Import các router con
const authRouter = require('./auth.router');
const categoryRouter = require('./category.router');
const serviceRouter = require('./service.router');
const bookingRouter = require('./booking.router');

// 2. Đăng ký đường dẫn (Prefix)
router.use('/auth', authRouter);           // -> /api/auth
router.use('/categories', categoryRouter); // -> /api/categories
router.use('/services', serviceRouter);    // -> /api/services
router.use('/bookings', bookingRouter);    // -> /api/bookings

module.exports = router;