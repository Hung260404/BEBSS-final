const userService = require('../services/user.service');

const getMe = async (req, res) => {
    try {
        const user = await userService.getMe(req.user.id);
        res.status(200).json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateProfile = async (req, res) => {
    try {
        const user = await userService.updateProfile(req.user.id, req.body);
        res.status(200).json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const kyc = async (req, res) => {
    try {
        if (req.user.role !== 'PROVIDER') {
            return res.status(403).json({ error: 'Chức năng chỉ dành cho Provider' });
        }
        const result = await userService.uploadKYC(req.user.id, req.body);
        res.status(200).json({ message: 'Đã gửi hồ sơ KYC', data: result });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getMe, updateProfile, kyc };