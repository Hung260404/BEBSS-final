const bookingService = require("../services/booking.service");
//(Nhận Request, Gọi Service, Trả Response)//
const bookingController = {
  // API 22: Check slot (Public)
  checkAvailability: async (req, res) => {
    try {
      const { providerId, serviceId, date } = req.query;
      if (!providerId || !serviceId || !date) {
        return res
          .status(400)
          .json({ error: "Thiếu thông tin providerId, serviceId, date" });
      }
      const slots = await bookingService.checkAvailability({
        providerId,
        serviceId,
        date,
      });
      res.status(200).json({ date, available_slots: slots });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // API 24: Tạo đơn mới
  create: async (req, res) => {
    try {
      const userId = req.user.id;
      const result = await bookingService.createBooking({
        ...req.body,
        userId,
      });
      res.status(201).json({ message: "Đặt lịch thành công!", data: result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // API 25: Lịch sử
  getHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const result = await bookingService.getHistory(userId, role);
      res.status(200).json({ data: result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // API 26: Chi tiết đơn
  getDetail: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const result = await bookingService.getDetail(userId, id);
      res.status(200).json({ data: result });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  // API 27: Hủy đơn
  cancel: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { reason } = req.body;
      const result = await bookingService.cancelBooking(userId, id, reason);
      res.status(200).json({ message: "Đã hủy đơn", data: result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // API 28: Provider Confirm
  confirm: async (req, res) => {
    try {
      const result = await bookingService.updateStatus(
        req.user.id,
        req.params.id,
        "CONFIRMED"
      );
      res.status(200).json({ message: "Đã xác nhận đơn hàng", data: result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // API 29: Provider Reject
  reject: async (req, res) => {
    try {
      const result = await bookingService.updateStatus(
        req.user.id,
        req.params.id,
        "REJECTED"
      );
      res.status(200).json({ message: "Đã từ chối đơn hàng", data: result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // API 30: Provider Complete
  complete: async (req, res) => {
    try {
      const result = await bookingService.updateStatus(
        req.user.id,
        req.params.id,
        "COMPLETED"
      );
      res.status(200).json({ message: "Dịch vụ hoàn tất", data: result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // API 31: Provider Sub-order
  createSubOrder: async (req, res) => {
    try {
      const { amount, note } = req.body;
      const result = await bookingService.createSubOrder(
        req.user.id,
        req.params.id,
        amount,
        note
      );
      res.status(201).json({ message: "Đã tạo phụ thu", data: result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // API 32
  pay: async (req, res) => {
    try {
      const userId = req.user.id;
      const bookingId = req.params.id;
      const { method, transactionCode } = req.body;

      const result = await bookingService.customerPay({
        userId,
        bookingId,
        method,
        transactionCode,
      });

      res.status(200).json({
        message: "Đã gửi yêu cầu thanh toán",
        data: result,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // API 33
  confirmPayment: async (req, res) => {
    try {
      const providerId = req.user.id;
      const bookingId = req.params.id;

      const result = await bookingService.providerConfirmPayment(
        providerId,
        bookingId
      );

      res.status(200).json({
        message: "Xác nhận thanh toán thành công",
        data: result,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};

module.exports = bookingController;
