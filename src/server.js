// src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rootRouter = require('./routers/root.router');
const prisma = require('./common/prisma/init.prisma');

// 1. Import file Robot dọn dẹp
const initCronJob = require('./common/cronjob'); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes chính: Tất cả API sẽ bắt đầu bằng /api
app.use('/api', rootRouter);

// Test Route
app.get('/', (req, res) => {
    res.send('BSS Backend is running...');
});

// Khởi động server
const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Đã kết nối Database thành công!');
        
        // 2. Kích hoạt Robot chạy ngầm (Ngay sau khi kết nối DB thành công)
        initCronJob(); 
        
        app.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Không thể kết nối Database:', error);
        process.exit(1);
    }
};

startServer();