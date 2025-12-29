const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang khởi tạo danh mục dịch vụ...');

  // Danh sách ngành nghề bạn yêu cầu
  const categories = [
    // --- 1. LÀM ĐẸP (BEAUTY - 60%) ---
    { 
      name: 'Salon Tóc (Hair Salon)', 
      image_url: 'https://cdn-icons-png.flaticon.com/512/3655/3655609.png' 
    },
    { 
      name: 'Nail & Mi (Nail Salon)', 
      image_url: 'https://cdn-icons-png.flaticon.com/512/3756/3756260.png' 
    },
    { 
      name: 'Spa & Massage', 
      image_url: 'https://cdn-icons-png.flaticon.com/512/2646/2646963.png' 
    },

    // --- 2. Y TẾ (HEALTHCARE - 25%) ---
    { 
      name: 'Phòng khám tư (Clinic)', 
      image_url: 'https://cdn-icons-png.flaticon.com/512/2966/2966334.png' 
    },
    { 
      name: 'Nha khoa (Dentist)', 
      image_url: 'https://cdn-icons-png.flaticon.com/512/2966/2966456.png' 
    },
    { 
      name: 'Vật lý trị liệu', 
      image_url: 'https://cdn-icons-png.flaticon.com/512/2312/2312896.png' 
    },

    // --- 3. SỬA CHỮA (HOME REPAIR - 15%) ---
    { 
      name: 'Thợ điện nước', 
      image_url: 'https://cdn-icons-png.flaticon.com/512/3076/3076136.png' 
    },
    { 
      name: 'Dọn nhà theo giờ', 
      image_url: 'https://cdn-icons-png.flaticon.com/512/2061/2061876.png' 
    }
  ];

  // Vòng lặp để lưu từng cái vào Database
  for (const cat of categories) {
    await prisma.categories.upsert({
      where: { name: cat.name }, // Nếu tên trùng thì thôi
      update: {}, 
      create: cat, // Chưa có thì tạo mới
    });
  }

  console.log('✅ Đã nạp xong 8 danh mục thành công!');
}

// Chạy hàm main và xử lý lỗi nếu có
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });