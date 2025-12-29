const nodemailer = require('nodemailer');

// Cấu hình người gửi (Lấy từ .env)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// 1. Hàm gửi mã OTP (Đăng ký)
const sendOTP = async (toEmail, otpCode) => {
    try {
        const mailOptions = {
            from: '"BSS Booking System" <no-reply@bss.com>',
            to: toEmail,
            subject: 'Mã xác thực đăng ký tài khoản (OTP)',
            html: `
                <div style="font-family: Helvetica, Arial, sans-serif; min-width:1000px; overflow:auto; line-height:2">
                  <div style="margin:50px auto; width:70%; padding:20px 0">
                    <div style="border-bottom:1px solid #eee">
                      <a href="" style="font-size:1.4em; color: #00466a; text-decoration:none; font-weight:600">BSS Booking System</a>
                    </div>
                    <p style="font-size:1.1em">Xin chào,</p>
                    <p>Cảm ơn bạn đã đăng ký dịch vụ. Vui lòng nhập mã OTP sau để hoàn tất đăng ký. Mã này có hiệu lực trong 5 phút:</p>
                    <h2 style="background: #00466a; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">${otpCode}</h2>
                    <p style="font-size:0.9em;">Trân trọng,<br />BSS Team</p>
                  </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Đã gửi OTP đến ${toEmail}`);
        return true;
    } catch (error) {
        console.error("❌ Lỗi gửi mail OTP:", error);
        return false;
    }
};


const sendResetLink = async (toEmail, resetLink) => {
    try {
        const mailOptions = {
            from: '"BSS Booking System" <no-reply@bss.com>',
            to: toEmail,
            subject: 'Yêu cầu khôi phục mật khẩu',
            html: `
                <div style="font-family: Helvetica, Arial, sans-serif; min-width:1000px; overflow:auto; line-height:2">
                  <div style="margin:50px auto; width:70%; padding:20px 0">
                    <div style="border-bottom:1px solid #eee">
                      <a href="" style="font-size:1.4em; color: #00466a; text-decoration:none; font-weight:600">BSS Booking System</a>
                    </div>
                    <p style="font-size:1.1em">Xin chào,</p>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    <p>Vui lòng bấm vào nút bên dưới để tạo mật khẩu mới (Link chỉ có hiệu lực trong 15 phút):</p>
                    
                    <a href="${resetLink}" style="background: #00466a; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 4px; display: inline-block; margin: 10px 0;">Đặt lại mật khẩu</a>
                    
                    <p>Hoặc bạn có thể copy đường dẫn sau vào trình duyệt:</p>
                    <p style="color: #2563EB;">${resetLink}</p>
                    
                    <p style="font-size:0.9em;">Nếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này.</p>
                    <p style="font-size:0.9em;">Trân trọng,<br />BSS Team</p>
                  </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Đã gửi Link Reset đến ${toEmail}`);
        return true;
    } catch (error) {
        console.error("❌ Lỗi gửi mail Reset:", error);
        return false;
    }
};


module.exports = { sendOTP, sendResetLink };