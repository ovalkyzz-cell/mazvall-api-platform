const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create rate limit configs
  const tiers = [
    { tier: 'free', requestsPerMinute: 10, requestsPerHour: 100, requestsPerDay: 1000, description: 'Free tier - Basic access' },
    { tier: 'developer', requestsPerMinute: 60, requestsPerHour: 2000, requestsPerDay: 20000, description: 'Developer tier - Enhanced access' },
    { tier: 'enterprise', requestsPerMinute: 300, requestsPerHour: 10000, requestsPerDay: 100000, description: 'Enterprise tier - Unlimited access' },
  ];

  for (const tier of tiers) {
    await prisma.rateLimitConfig.upsert({
      where: { tier: tier.tier },
      update: tier,
      create: tier,
    });
  }

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@mazvall.com' },
    update: {},
    create: {
      email: 'admin@mazvall.com',
      name: 'Mazz-Vall Admin',
      password: adminHash,
      role: 'admin',
      tier: 'enterprise',
    },
  });

  // Create demo user
  const userHash = await bcrypt.hash('user123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@mazvall.com' },
    update: {},
    create: {
      email: 'demo@mazvall.com',
      name: 'Demo User',
      password: userHash,
      role: 'user',
      tier: 'developer',
    },
  });

  // Create demo API key for demo user
  await prisma.apiKey.upsert({
    where: { key: 'MVAL-DEMO1234567890' },
    update: {},
    create: {
      key: 'MVAL-DEMO1234567890',
      name: 'Demo API Key',
      userId: demoUser.id,
      rateLimit: 60,
    },
  });

  // System config
  const configs = [
    { key: 'site_name', value: "Api's Mazvall" },
    { key: 'site_description', value: 'Professional REST API Platform & Documentation' },
    { key: 'api_base_url', value: 'https://mazvall-official.my.id' },
    { key: 'maintenance_mode', value: 'false' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
