const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Dạng "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'Bạn chưa đăng nhập (Thiếu Token)' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_KEY);
        req.user = decoded; // Lưu thông tin user vào request
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};

module.exports = { verifyToken };