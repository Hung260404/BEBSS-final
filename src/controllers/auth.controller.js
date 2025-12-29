const authService = require('../services/auth.service');

const authController = {
    register: async (req, res) => {
        try {
            const result = await authService.register(req.body);
            res.status(201).json({ message: result.message, data: result });
        } catch (err) { res.status(400).json({ error: err.message }); }
    },

    verifyOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;
            const result = await authService.verifyOTP({ email, otp });
            res.status(200).json(result);
        } catch (err) { res.status(400).json({ error: err.message }); }
    },

    login: async (req, res) => {
        try {
            const result = await authService.login(req.body);
            res.status(200).json(result);
        } catch (err) { res.status(401).json({ error: err.message }); }
    },

    oauth: async (req, res) => {
        try {
            const result = await authService.loginOAuth(req.body);
            res.status(200).json(result);
        } catch (err) { res.status(500).json({ error: err.message }); }
    },

    refreshToken: async (req, res) => {
        try {
            const result = await authService.refreshToken(req.body.refreshToken);
            res.status(200).json(result);
        } catch (err) { res.status(403).json({ error: err.message }); }
    },

    logout: async (req, res) => {
        await authService.logout();
        res.status(200).json({ message: 'Đăng xuất thành công' });
    },

    forgotPassword: async (req, res) => {
        try {
            const result = await authService.forgotPassword(req.body.email);
            res.status(200).json({ message: result });
        } catch (err) { res.status(400).json({ error: err.message }); }
    },

    // --- CẬP NHẬT HÀM NÀY ---
    resetPassword: async (req, res) => {
        try {
            // Nhận thêm token từ Frontend
            const { email, token, newPassword } = req.body;
            const result = await authService.resetPassword(email, token, newPassword);
            res.status(200).json({ message: result });
        } catch (err) { res.status(400).json({ error: err.message }); }
    },
    // ------------------------

    changePassword: async (req, res) => {
        try {
            const result = await authService.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
            res.status(200).json({ message: result });
        } catch (err) { res.status(400).json({ error: err.message }); }
    }
};

module.exports = authController;