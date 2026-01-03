const paymentService = require("../services/payment.service");

exports.webhook = async (req, res) => {
  try {
    const result = await paymentService.handleWebhook(req.body);
    res.status(200).json({ message: "Webhook xử lý thành công", data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
