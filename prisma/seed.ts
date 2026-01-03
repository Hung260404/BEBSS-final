import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed data...');

  try {
    // ===== CLEAR EXISTING DATA (Order matters due to foreign keys) =====
    console.log('🗑️  Clearing existing data...');
    await prisma.messages.deleteMany();
    await prisma.conversations.deleteMany();
    await prisma.notifications.deleteMany();
    await prisma.voucher_usage.deleteMany();
    await prisma.vouchers.deleteMany();
    await prisma.reviews.deleteMany();
    await prisma.payments.deleteMany();
    await prisma.sub_orders.deleteMany();
    await prisma.bookings.deleteMany();
    await prisma.schedules.deleteMany();
    await prisma.wallets.deleteMany();
    await prisma.service_images.deleteMany();
    await prisma.services.deleteMany();
    await prisma.providers.deleteMany();
    await prisma.categories.deleteMany();
    await prisma.users.deleteMany();

    // ===== 1. CREATE CATEGORIES =====
    console.log('📂 Creating categories...');
    const categories = await Promise.all([
      prisma.categories.create({
        data: {
          name: 'Salon Tóc (Hair Salon)',
          image_url: 'https://cdn-icons-png.flaticon.com/512/3655/3655609.png',
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Nail & Mi (Nail Salon)',
          image_url: 'https://cdn-icons-png.flaticon.com/512/3756/3756260.png',
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Spa & Massage',
          image_url: 'https://cdn-icons-png.flaticon.com/512/2646/2646963.png',
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Phòng khám tư (Clinic)',
          image_url: 'https://cdn-icons-png.flaticon.com/512/2966/2966334.png',
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Nha khoa (Dentist)',
          image_url: 'https://cdn-icons-png.flaticon.com/512/2966/2966456.png',
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Vật lý trị liệu',
          image_url: 'https://cdn-icons-png.flaticon.com/512/2312/2312896.png',
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Thợ điện nước',
          image_url: 'https://cdn-icons-png.flaticon.com/512/3076/3076136.png',
        },
      }),
      prisma.categories.create({
        data: {
          name: 'Dọn nhà theo giờ',
          image_url: 'https://cdn-icons-png.flaticon.com/512/2061/2061876.png',
        },
      }),
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // ===== 2. CREATE USERS (CUSTOMERS & PROVIDERS) =====
    console.log('👥 Creating users...');
    
    const hashedPassword = await bcrypt.hash('Test@123456', 10);

    // Create customers
    const customer1 = await prisma.users.create({
      data: {
        email: 'customer1@example.com',
        password: hashedPassword,
        full_name: 'Nguyễn Văn A',
        phone: '0901234567',
        avatar_url: 'https://i.pravatar.cc/150?img=1',
        role: 'CUSTOMER',
        is_active: true,
      },
    });

    const customer2 = await prisma.users.create({
      data: {
        email: 'customer2@example.com',
        password: hashedPassword,
        full_name: 'Trần Thị B',
        phone: '0912345678',
        avatar_url: 'https://i.pravatar.cc/150?img=2',
        role: 'CUSTOMER',
        is_active: true,
      },
    });

    const customer3 = await prisma.users.create({
      data: {
        email: 'customer3@example.com',
        password: hashedPassword,
        full_name: 'Lê Văn C',
        phone: '0923456789',
        avatar_url: 'https://i.pravatar.cc/150?img=3',
        role: 'CUSTOMER',
        is_active: true,
      },
    });

    // Create provider users
    const provider1 = await prisma.users.create({
      data: {
        email: 'provider1@example.com',
        password: hashedPassword,
        full_name: 'Salon Tóc Mỹ Linh',
        phone: '0934567890',
        avatar_url: 'https://i.pravatar.cc/150?img=10',
        role: 'PROVIDER',
        is_active: true,
      },
    });

    const provider2 = await prisma.users.create({
      data: {
        email: 'provider2@example.com',
        password: hashedPassword,
        full_name: 'Spa Thảo Linh',
        phone: '0945678901',
        avatar_url: 'https://i.pravatar.cc/150?img=11',
        role: 'PROVIDER',
        is_active: true,
      },
    });

    const provider3 = await prisma.users.create({
      data: {
        email: 'provider3@example.com',
        password: hashedPassword,
        full_name: 'Nha khoa Kim Cương',
        phone: '0956789012',
        avatar_url: 'https://i.pravatar.cc/150?img=12',
        role: 'PROVIDER',
        is_active: true,
      },
    });

    const admin = await prisma.users.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        full_name: 'Admin System',
        phone: '0967890123',
        avatar_url: 'https://i.pravatar.cc/150?img=20',
        role: 'ADMIN',
        is_active: true,
      },
    });

    console.log('✅ Created 8 users (3 customers, 3 providers, 1 admin)');

    // ===== 3. CREATE PROVIDERS =====
    console.log('🏢 Creating providers...');

    const providerProfile1 = await prisma.providers.create({
      data: {
        user_id: provider1.id,
        business_name: 'Salon Tóc Mỹ Linh',
        description: 'Salon tóc chuyên về cắt, nhuộm, duỗi, bấm tóc',
        address: '123 Nguyễn Huệ, Q.1, TPHCM',
        latitude: new Decimal('10.7769'),
        longitude: new Decimal('106.7009'),
        kyc_status: 'VERIFIED',
        trust_score: new Decimal('4.8'),
        open_time: '08:00',
        close_time: '22:00',
      },
    });

    const providerProfile2 = await prisma.providers.create({
      data: {
        user_id: provider2.id,
        business_name: 'Spa Thảo Linh',
        description: 'Spa chuyên massage, xông hơi, chăm sóc da',
        address: '456 Lê Lợi, Q.1, TPHCM',
        latitude: new Decimal('10.7750'),
        longitude: new Decimal('106.7020'),
        kyc_status: 'VERIFIED',
        trust_score: new Decimal('4.9'),
        open_time: '09:00',
        close_time: '21:00',
      },
    });

    const providerProfile3 = await prisma.providers.create({
      data: {
        user_id: provider3.id,
        business_name: 'Nha khoa Kim Cương',
        description: 'Nha khoa hiện đại với công nghệ tân tiến',
        address: '789 Võ Văn Kiệt, Q.1, TPHCM',
        latitude: new Decimal('10.7700'),
        longitude: new Decimal('106.7050'),
        kyc_status: 'VERIFIED',
        trust_score: new Decimal('4.7'),
        open_time: '08:30',
        close_time: '18:00',
      },
    });

    console.log('✅ Created 3 provider profiles');

    // ===== 4. CREATE WALLETS =====
    console.log('💰 Creating wallets...');

    await Promise.all([
      prisma.wallets.create({
        data: {
          provider_id: provider1.id,
          balance: new Decimal('500000'),
          holding_balance: new Decimal('0'),
        },
      }),
      prisma.wallets.create({
        data: {
          provider_id: provider2.id,
          balance: new Decimal('750000'),
          holding_balance: new Decimal('0'),
        },
      }),
      prisma.wallets.create({
        data: {
          provider_id: provider3.id,
          balance: new Decimal('600000'),
          holding_balance: new Decimal('0'),
        },
      }),
    ]);

    console.log('✅ Created 3 wallets');

    // ===== 5. CREATE SERVICES =====
    console.log('🔧 Creating services...');

    const service1 = await prisma.services.create({
      data: {
        provider_id: provider1.id,
        category_id: categories[0].id, // Hair Salon
        name: 'Cắt tóc nam',
        price: new Decimal('150000'),
        description: 'Cắt tóc nam hiện đại, kiểu dáng đa dạng',
        duration: 30,
        buffer_time: 10,
        status: 'ACTIVE',
        is_active: true,
      },
    });

    const service2 = await prisma.services.create({
      data: {
        provider_id: provider1.id,
        category_id: categories[0].id, // Hair Salon
        name: 'Nhuộm tóc cao cấp',
        price: new Decimal('450000'),
        description: 'Nhuộm tóc bằng thuốc nhuộm Hàn Quốc chất lượng cao',
        duration: 120,
        buffer_time: 15,
        status: 'ACTIVE',
        is_active: true,
      },
    });

    const service3 = await prisma.services.create({
      data: {
        provider_id: provider2.id,
        category_id: categories[2].id, // Spa & Massage
        name: 'Massage toàn thân 60 phút',
        price: new Decimal('350000'),
        description: 'Massage thư giãn toàn thân, giảm căng thẳng',
        duration: 60,
        buffer_time: 10,
        status: 'ACTIVE',
        is_active: true,
      },
    });

    const service4 = await prisma.services.create({
      data: {
        provider_id: provider2.id,
        category_id: categories[2].id, // Spa & Massage
        name: 'Chăm sóc da mặt cao cấp',
        price: new Decimal('400000'),
        description: 'Chăm sóc da mặt toàn diện với các sản phẩm cao cấp',
        duration: 90,
        buffer_time: 15,
        status: 'ACTIVE',
        is_active: true,
      },
    });

    const service5 = await prisma.services.create({
      data: {
        provider_id: provider3.id,
        category_id: categories[4].id, // Dentist
        name: 'Lấy cao răng và kiểm tra',
        price: new Decimal('200000'),
        description: 'Lấy cao răng chuyên nghiệp và kiểm tra sức khỏe răng miệng',
        duration: 45,
        buffer_time: 15,
        status: 'ACTIVE',
        is_active: true,
      },
    });

    const service6 = await prisma.services.create({
      data: {
        provider_id: provider3.id,
        category_id: categories[4].id, // Dentist
        name: 'Trám răng',
        price: new Decimal('300000'),
        description: 'Trám răng bằng vật liệu composite hiện đại',
        duration: 60,
        buffer_time: 15,
        status: 'ACTIVE',
        is_active: true,
      },
    });

    console.log('✅ Created 6 services');

    // ===== 6. CREATE SERVICE IMAGES =====
    console.log('🖼️  Creating service images...');

    await Promise.all([
      prisma.service_images.create({
        data: {
          service_id: service1.id,
          image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=500',
        },
      }),
      prisma.service_images.create({
        data: {
          service_id: service2.id,
          image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500',
        },
      }),
      prisma.service_images.create({
        data: {
          service_id: service3.id,
          image_url: 'https://images.unsplash.com/photo-1544367567-0d0fccc4c712?w=500&h=500',
        },
      }),
      prisma.service_images.create({
        data: {
          service_id: service4.id,
          image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&h=500',
        },
      }),
      prisma.service_images.create({
        data: {
          service_id: service5.id,
          image_url: 'https://images.unsplash.com/photo-1606810993892-f0e7973e8b37?w=500&h=500',
        },
      }),
      prisma.service_images.create({
        data: {
          service_id: service6.id,
          image_url: 'https://images.unsplash.com/photo-1606810993892-f0e7973e8b37?w=500&h=500',
        },
      }),
    ]);

    console.log('✅ Created 6 service images');

    // ===== 7. CREATE SCHEDULES =====
    console.log('📅 Creating schedules...');

    // Provider 1 schedule (Mon-Sat, closed Sun)
    for (let day = 1; day <= 6; day++) {
      await prisma.schedules.create({
        data: {
          provider_id: provider1.id,
          day_of_week: day,
          start_time: new Date('2025-01-01 08:00:00'),
          end_time: new Date('2025-01-01 22:00:00'),
          is_day_off: false,
        },
      });
    }

    // Provider 2 schedule (Mon-Sun)
    for (let day = 0; day <= 6; day++) {
      await prisma.schedules.create({
        data: {
          provider_id: provider2.id,
          day_of_week: day,
          start_time: new Date('2025-01-01 09:00:00'),
          end_time: new Date('2025-01-01 21:00:00'),
          is_day_off: false,
        },
      });
    }

    // Provider 3 schedule (Mon-Fri only)
    for (let day = 1; day <= 5; day++) {
      await prisma.schedules.create({
        data: {
          provider_id: provider3.id,
          day_of_week: day,
          start_time: new Date('2025-01-01 08:30:00'),
          end_time: new Date('2025-01-01 18:00:00'),
          is_day_off: false,
        },
      });
    }

    console.log('✅ Created schedules for 3 providers');

    // ===== 8. CREATE VOUCHERS =====
    console.log('🎟️  Creating vouchers...');

    const voucher1 = await prisma.vouchers.create({
      data: {
        code: 'WELCOME20',
        discount_type: 'PERCENT',
        value: new Decimal('20'),
        min_order_price: new Decimal('0'),
        owner_id: null, // Platform voucher
        is_active: true,
      },
    });

    const voucher2 = await prisma.vouchers.create({
      data: {
        code: 'SAVE100K',
        discount_type: 'FIXED',
        value: new Decimal('100000'),
        min_order_price: new Decimal('500000'),
        owner_id: provider1.id, // Provider voucher
        is_active: true,
      },
    });

    const voucher3 = await prisma.vouchers.create({
      data: {
        code: 'SPAFRESH30',
        discount_type: 'PERCENT',
        value: new Decimal('30'),
        min_order_price: new Decimal('300000'),
        owner_id: provider2.id, // Provider voucher
        is_active: true,
      },
    });

    console.log('✅ Created 3 vouchers');

    // ===== 9. CREATE BOOKINGS =====
    console.log('📅 Creating bookings...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

    const booking1 = await prisma.bookings.create({
      data: {
        customer_id: customer1.id,
        provider_id: provider1.id,
        service_id: service1.id,
        booking_date: tomorrowDate,
        start_time: new Date('2025-01-01 09:00:00'),
        end_time: new Date('2025-01-01 09:30:00'),
        status: 'CONFIRMED',
        total_amount: new Decimal('150000'),
      },
    });

    const booking2 = await prisma.bookings.create({
      data: {
        customer_id: customer2.id,
        provider_id: provider2.id,
        service_id: service3.id,
        booking_date: tomorrowDate,
        start_time: new Date('2025-01-01 14:00:00'),
        end_time: new Date('2025-01-01 15:00:00'),
        status: 'PENDING_PAYMENT',
        total_amount: new Decimal('350000'),
      },
    });

    const booking3 = await prisma.bookings.create({
      data: {
        customer_id: customer3.id,
        provider_id: provider3.id,
        service_id: service5.id,
        booking_date: tomorrowDate,
        start_time: new Date('2025-01-01 10:00:00'),
        end_time: new Date('2025-01-01 10:45:00'),
        status: 'COMPLETED',
        total_amount: new Decimal('200000'),
      },
    });

    console.log('✅ Created 3 bookings');

    // ===== 10. CREATE SUB ORDERS =====
    console.log('📦 Creating sub orders...');

    await Promise.all([
      prisma.sub_orders.create({
        data: {
          booking_id: booking1.id,
          amount: new Decimal('150000'),
          note: 'Cắt tóc nam',
          status: 'PAID',
        },
      }),
      prisma.sub_orders.create({
        data: {
          booking_id: booking2.id,
          amount: new Decimal('350000'),
          note: 'Massage toàn thân',
          status: 'UNPAID',
        },
      }),
      prisma.sub_orders.create({
        data: {
          booking_id: booking3.id,
          amount: new Decimal('200000'),
          note: 'Lấy cao răng',
          status: 'PAID',
        },
      }),
    ]);

    console.log('✅ Created 3 sub orders');

    // ===== 11. CREATE PAYMENTS =====
    console.log('💳 Creating payments...');

    await Promise.all([
      prisma.payments.create({
        data: {
          booking_id: booking1.id,
          transaction_code: 'TRX001',
          amount: new Decimal('150000'),
          amount_provider: new Decimal('130000'),
          amount_fee: new Decimal('20000'),
          method: 'VNPAY',
          status: 'SUCCESS',
        },
      }),
      prisma.payments.create({
        data: {
          booking_id: booking2.id,
          transaction_code: 'TRX002',
          amount: new Decimal('350000'),
          amount_provider: new Decimal('300000'),
          amount_fee: new Decimal('50000'),
          method: 'MOMO',
          status: 'PENDING',
        },
      }),
      prisma.payments.create({
        data: {
          booking_id: booking3.id,
          transaction_code: 'TRX003',
          amount: new Decimal('200000'),
          amount_provider: new Decimal('180000'),
          amount_fee: new Decimal('20000'),
          method: 'CASH',
          status: 'SUCCESS',
        },
      }),
    ]);

    console.log('✅ Created 3 payments');

    // ===== 12. CREATE VOUCHER USAGE =====
    console.log('🎟️  Creating voucher usage...');

    await prisma.voucher_usage.create({
      data: {
        booking_id: booking1.id,
        voucher_id: voucher1.id,
        customer_id: customer1.id,
      },
    });

    console.log('✅ Created voucher usage');

    // ===== 13. CREATE REVIEWS =====
    console.log('⭐ Creating reviews...');

    const review1 = await prisma.reviews.create({
      data: {
        booking_id: booking3.id,
        reviewer_id: customer3.id,
        target_id: provider3.id,
        rating: 5,
        comment: 'Dịch vụ chuyên nghiệp, bác sĩ tươi cười, vô cùng thoải mái!',
        reply: 'Cảm ơn quý khách đã tin tưởng chúng tôi!',
      },
    });

    console.log('✅ Created 1 review');

    // ===== 14. CREATE NOTIFICATIONS =====
    console.log('🔔 Creating notifications...');

    await Promise.all([
      prisma.notifications.create({
        data: {
          user_id: customer1.id,
          title: 'Đặt lịch thành công',
          message: 'Lịch cắt tóc của bạn đã được xác nhận cho ngày mai',
          type: 'BOOKING',
          is_read: false,
        },
      }),
      prisma.notifications.create({
        data: {
          user_id: provider1.id,
          title: 'Có khách hàng mới',
          message: 'Khách hàng Nguyễn Văn A đã đặt lịch cắt tóc',
          type: 'BOOKING',
          is_read: false,
        },
      }),
      prisma.notifications.create({
        data: {
          user_id: customer2.id,
          title: 'Thanh toán chưa hoàn thành',
          message: 'Vui lòng hoàn thành thanh toán cho lịch massage của bạn',
          type: 'SYSTEM',
          is_read: false,
        },
      }),
    ]);

    console.log('✅ Created 3 notifications');

    // ===== 15. CREATE CONVERSATIONS & MESSAGES =====
    console.log('💬 Creating conversations and messages...');

    const conversation1 = await prisma.conversations.create({
      data: {
        customer_id: customer1.id,
        provider_id: provider1.id,
        last_message: 'Cảm ơn, hẹn gặp bạn vào lúc 9h sáng',
      },
    });

    const conversation2 = await prisma.conversations.create({
      data: {
        customer_id: customer2.id,
        provider_id: provider2.id,
        last_message: 'Có thể đặt lịch vào chiều mai không?',
      },
    });

    await Promise.all([
      prisma.messages.create({
        data: {
          conversation_id: conversation1.id,
          sender_id: customer1.id,
          content: 'Xin chào, tôi muốn cắt tóc vào ngày mai có được không?',
          is_read: true,
        },
      }),
      prisma.messages.create({
        data: {
          conversation_id: conversation1.id,
          sender_id: provider1.id,
          content: 'Được chứ, bạn muốn vào lúc mấy giờ?',
          is_read: true,
        },
      }),
      prisma.messages.create({
        data: {
          conversation_id: conversation1.id,
          sender_id: customer1.id,
          content: 'Cảm ơn, hẹn gặp bạn vào lúc 9h sáng',
          is_read: false,
        },
      }),
      prisma.messages.create({
        data: {
          conversation_id: conversation2.id,
          sender_id: customer2.id,
          content: 'Có thể đặt lịch vào chiều mai không?',
          is_read: false,
        },
      }),
    ]);

    console.log('✅ Created 2 conversations and 4 messages');

    // ===== PAYOUT REQUESTS =====
    console.log('💸 Creating payout requests...');

    await prisma.payout_requests.create({
      data: {
        provider_id: provider1.id,
        amount: new Decimal('300000'),
        bank_info: {
          account_number: '1234567890',
          bank_name: 'Vietcombank',
          account_holder: 'Salon Tóc Mỹ Linh',
        },
        status: 'PENDING',
      },
    });

    console.log('✅ Created payout request');

    console.log('\n✨ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 8 Users (3 customers, 3 providers, 1 admin)');
    console.log('  - 8 Categories');
    console.log('  - 3 Provider Profiles');
    console.log('  - 6 Services');
    console.log('  - 3 Bookings');
    console.log('  - 3 Vouchers');
    console.log('  - 3 Payments');
    console.log('  - Reviews, Notifications, Messages, and more...');

    console.log('\n🔐 Sample Login Credentials:');
    console.log('  Customer: customer1@example.com / Test@123456');
    console.log('  Provider: provider1@example.com / Test@123456');
    console.log('  Admin: admin@example.com / Test@123456');
  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Import Decimal for pricing
import { Decimal } from '@prisma/client/runtime/library';

main();
