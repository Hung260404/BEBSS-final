const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    // 1. Lấy token từ header (Dạng: Bearer <token>)
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Không tìm thấy Token. Vui lòng đăng nhập!" });
    }

    try {
        // 2. Giải mã token
        const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // 3. Lưu thông tin user vào request để các hàm sau dùng
        req.user = verified; 
        
        next(); // Cho phép đi tiếp
    } catch (err) {
        res.status(403).json({ error: "Token không hợp lệ hoặc đã hết hạn!" });
    }
};

module.exports = verifyToken;