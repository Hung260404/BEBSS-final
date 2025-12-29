const prisma = require("../common/prisma/init.prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios"); // <-- THÊM DÒNG NÀY ĐỂ GỌI GOOGLE/FACEBOOK
const { sendOTP, sendResetLink } = require("../common/mailer");

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_LIFE }
  );

  const refreshToken = jwt.sign(
    { id: userId, role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_LIFE }
  );

  return { accessToken, refreshToken };
};

const authService = {
  // 1. ĐĂNG KÝ
  register: async ({ email, password, full_name, phone, role }) => {
    const exist = await prisma.users.findUnique({ where: { email } });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    if (exist) {
      if (exist.is_active) {
        throw new Error("Email này đã được sử dụng!");
      }
      // User cũ chưa active -> Update lại thông tin và gửi OTP mới
      await prisma.users.update({
        where: { email },
        data: {
          password: hashedPassword,
          full_name,
          phone,
          otp_code: otpCode,
          otp_expires: otpExpires,
        },
      });
      sendOTP(email, otpCode).catch(console.error);
      return {
        email,
        message: "Tài khoản chưa kích hoạt. Đã gửi lại mã OTP mới vào email.",
      };
    }

    // User mới tinh
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email,
          password: hashedPassword,
          full_name,
          phone,
          role: role || "CUSTOMER",
          is_active: false,
          otp_code: otpCode,
          otp_expires: otpExpires,
        },
      });

      if (user.role === "PROVIDER") {
        await tx.providers.create({
          data: { user_id: user.id, business_name: full_name },
        });
      }
      return user;
    });

    sendOTP(email, otpCode).catch(console.error);
    return {
      email: newUser.email,
      message: "Đăng ký thành công! Vui lòng kiểm tra email để lấy OTP.",
    };
  },

  // 2. XÁC THỰC OTP
  verifyOTP: async ({ email, otp }) => {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new Error("Email không tồn tại");
    if (user.is_active) throw new Error("Tài khoản đã được kích hoạt rồi");

    if (user.otp_code !== otp) throw new Error("Mã OTP không chính xác");
    if (new Date() > new Date(user.otp_expires))
      throw new Error("Mã OTP đã hết hạn");

    await prisma.users.update({
      where: { id: user.id },
      data: {
        is_active: true,
        otp_code: null,
        otp_expires: null,
      },
    });

    return {
      message: "Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay.",
    };
  },

  // 3. ĐĂNG NHẬP
  login: async ({ email, password }) => {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new Error("Email không tồn tại");
    if (!user.is_active)
      throw new Error("Tài khoản chưa kích hoạt. Vui lòng xác thực OTP.");

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) throw new Error("Mật khẩu không đúng");

    const tokens = generateTokens(user.id, user.role);
    return { user, ...tokens };
  },

  loginOAuth: async ({ provider, token }) => {
    let profile = {};

    try {
      if (provider === "google") {
        const res = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        profile = {
          email: res.data.email,
          full_name: res.data.name,
          avatar_url: res.data.picture,
        };
      } else if (provider === "facebook") {
        const res = await axios.get(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`
        );
        profile = {
          email: res.data.email,
          full_name: res.data.name,
          avatar_url: res.data.picture.data.url,
        };
      } else {
        throw new Error("Nhà cung cấp không hỗ trợ");
      }
    } catch (error) {
      console.error(error);
      throw new Error("Token mạng xã hội không hợp lệ hoặc đã hết hạn");
    }

    if (!profile.email)
      throw new Error("Không lấy được email từ tài khoản này");

    // Bước 2: Kiểm tra hoặc tạo User trong Database
    let user = await prisma.users.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Tạo user mới (Tự động Active)
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.users.create({
        data: {
          email: profile.email,
          full_name: profile.full_name,
          password: hashedPassword,
          avatar_url: profile.avatar_url,
          role: "CUSTOMER",
          is_active: true, // Login bằng Google/FB thì coi như đã active
        },
      });
    } else {
      // Nếu có rồi thì update avatar nếu chưa có
      if (!user.avatar_url) {
        await prisma.users.update({
          where: { id: user.id },
          data: { avatar_url: profile.avatar_url },
        });
      }
    }

    // Bước 3: Trả về token hệ thống
    const tokens = generateTokens(user.id, user.role);
    return { user, ...tokens };
  },

  // 5. REFRESH TOKEN
  refreshToken: async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_KEY);
      const user = await prisma.users.findUnique({ where: { id: decoded.id } });
      if (!user) throw new Error("User không tồn tại");
      return generateTokens(user.id, user.role);
    } catch (err) {
      throw new Error("Refresh token không hợp lệ");
    }
  },

  logout: async () => {
    return true;
  },

  // 6. LOGIC QUÊN MẬT KHẨU
  forgotPassword: async (email) => {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new Error("Email không tồn tại trong hệ thống");

    const resetToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.users.update({
      where: { email },
      data: { reset_token: resetToken, reset_expires: resetExpires },
    });

    const resetLink = `http://localhost:5173/reset-password?email=${email}&token=${resetToken}`;
    sendResetLink(email, resetLink).catch(console.error);

    return "Đã gửi link khôi phục vào email. Vui lòng kiểm tra.";
  },

  // 7. LOGIC ĐẶT LẠI MẬT KHẨU
  resetPassword: async (email, token, newPassword) => {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new Error("Email không tồn tại");

    if (!user.reset_token || user.reset_token !== token) {
      throw new Error("Đường dẫn không hợp lệ hoặc đã được sử dụng.");
    }

    if (new Date() > new Date(user.reset_expires)) {
      throw new Error("Đường dẫn đã hết hạn. Vui lòng yêu cầu lại.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { email },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_expires: null,
      },
    });

    return "Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.";
  },

  changePassword: async (userId, oldPassword, newPassword) => {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    const validPass = await bcrypt.compare(oldPassword, user.password);
    if (!validPass) throw new Error("Mật khẩu cũ không đúng");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return "Đổi mật khẩu thành công";
  },
};

module.exports = authService;
