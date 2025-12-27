import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // Create test users (without password hash for now)
  const hashedPassword = 'placeholder_hash'; // Will be replaced with proper auth later

  const testUser1 = await prisma.user.create({
    data: {
      email: 'test1@hayirhah.com',
      username: 'Test User 1',
      passwordHash: hashedPassword,
      isVerified: true,
    },
  });

  const testUser2 = await prisma.user.create({
    data: {
      email: 'test2@hayirhah.com',
      username: 'Test User 2',
      passwordHash: hashedPassword,
      isVerified: true,
    },
  });

  console.log('👥 Created test users:', { testUser1: testUser1.id, testUser2: testUser2.id });

  // Create notification preferences for users
  await prisma.notificationPreference.createMany({
    data: [
      {
        userId: testUser1.id,
        enabled: true,
        prayerNotifications: {
          sabah: true,
          ogle: true,
          ikindi: true,
          aksam: true,
          yatsi: true,
        },
      },
      {
        userId: testUser2.id,
        enabled: true,
        prayerNotifications: {
          sabah: true,
          ogle: true,
          ikindi: true,
          aksam: true,
          yatsi: true,
        },
      },
    ],
  });

  // Create sample prayer tracking data
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.prayerTracking.createMany({
    data: [
      {
        userId: testUser1.id,
        date: today,
        fardPrayers: {
          sabah: { isCompleted: true, completedAt: new Date().toISOString(), completedSunnet: true, completedTesbihat: false },
          ogle: { isCompleted: true, completedAt: new Date().toISOString(), completedSunnet: false, completedTesbihat: true },
          ikindi: { isCompleted: false, completedAt: null, completedSunnet: false, completedTesbihat: false },
          aksam: { isCompleted: false, completedAt: null, completedSunnet: false, completedTesbihat: false },
          yatsi: { isCompleted: false, completedAt: null, completedSunnet: false, completedTesbihat: false },
        },
        sunnahPrayers: {
          teheccud: false,
          duha: true,
          evvabin: false,
          tespih: true,
        },
        kazaPrayers: {
          sabah: 2,
          ogle: 1,
          ikindi: 0,
          aksam: 0,
          yatsi: 3,
        },
      },
      {
        userId: testUser1.id,
        date: yesterday,
        fardPrayers: {
          sabah: { isCompleted: true, completedAt: new Date().toISOString(), completedSunnet: true, completedTesbihat: true },
          ogle: { isCompleted: true, completedAt: new Date().toISOString(), completedSunnet: true, completedTesbihat: true },
          ikindi: { isCompleted: true, completedAt: new Date().toISOString(), completedSunnet: false, completedTesbihat: true },
          aksam: { isCompleted: true, completedAt: new Date().toISOString(), completedSunnet: true, completedTesbihat: false },
          yatsi: { isCompleted: true, completedAt: new Date().toISOString(), completedSunnet: true, completedTesbihat: true },
        },
        sunnahPrayers: {
          teheccud: true,
          duha: true,
          evvabin: true,
          tespih: false,
        },
        kazaPrayers: {
          sabah: 2,
          ogle: 1,
          ikindi: 0,
          aksam: 0,
          yatsi: 3,
        },
      },
    ],
  });

  console.log('📊 Created sample prayer tracking data');

  // Create test groups
  const hatimGroup = await prisma.group.create({
    data: {
      title: 'Hatim Grubu - Test',
      description: 'Kur\'an-ı Kerim\'i 30 cüzde tamamlayalım',
      creatorId: testUser1.id,
      type: 'hatim',
      targetCount: 30,
      currentProgress: 5,
      inviteCode: 'HATIM001',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  const yasinGroup = await prisma.group.create({
    data: {
      title: 'Yasin Suresi Grubu',
      description: '41 defa Yasin Suresi okuyalım',
      creatorId: testUser2.id,
      type: 'yasin',
      targetCount: 41,
      currentProgress: 12,
      inviteCode: 'YASIN001',
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    },
  });

  console.log('👥 Created test groups:', { hatimGroup: hatimGroup.id, yasinGroup: yasinGroup.id });

  // Add group members
  await prisma.groupMember.createMany({
    data: [
      { groupId: hatimGroup.id, userId: testUser1.id, role: 'creator' },
      { groupId: hatimGroup.id, userId: testUser2.id, role: 'member' },
      { groupId: yasinGroup.id, userId: testUser2.id, role: 'creator' },
      { groupId: yasinGroup.id, userId: testUser1.id, role: 'member' },
    ],
  });

  // Create tasks for Hatim group (30 cüz)
  const hatimTasks = Array.from({ length: 30 }, (_, i) => ({
    groupId: hatimGroup.id,
    taskIndex: i + 1,
    status: i < 5 ? 'completed' : i < 8 ? 'assigned' : 'available',
    assignedTo: i < 8 ? (i % 2 === 0 ? testUser1.id : testUser2.id) : null,
    assignedAt: i < 8 ? new Date() : null,
    completedAt: i < 5 ? new Date() : null,
  }));

  await prisma.task.createMany({
    data: hatimTasks,
  });

  // Create tasks for Yasin group (41 adet)
  const yasinTasks = Array.from({ length: 41 }, (_, i) => ({
    groupId: yasinGroup.id,
    taskIndex: i + 1,
    status: i < 12 ? 'completed' : i < 15 ? 'assigned' : 'available',
    assignedTo: i < 15 ? (i % 2 === 0 ? testUser2.id : testUser1.id) : null,
    assignedAt: i < 15 ? new Date() : null,
    completedAt: i < 12 ? new Date() : null,
  }));

  await prisma.task.createMany({
    data: yasinTasks,
  });

  console.log('✅ Created tasks for groups');

  // Create system settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'app_version', value: '1.0.0' },
      { key: 'maintenance_mode', value: 'false' },
      { key: 'max_groups_per_user', value: '10' },
      { key: 'prayer_time_api_url', value: 'https://api.aladhan.com/v1/timings' },
    ],
  });

  console.log('⚙️ Created system settings');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 