import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Create or update demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      passwordHash,
    },
    create: {
      email: 'demo@example.com',
      name: 'Demo Merchant',
      plan: 'pro',
      passwordHash,
    },
  });

  console.log(`Demo user ready: ${demoUser.email} (${demoUser.id})`);

  // Check if default prompt template exists for demo user
  const existingTemplate = await prisma.promptTemplate.findFirst({
    where: {
      userId: demoUser.id,
      isDefault: true,
    },
  });

  if (!existingTemplate) {
    const defaultPrompt = await prisma.promptTemplate.create({
      data: {
        userId: demoUser.id,
        name: 'E-commerce Standard High-Converting',
        templateText: `Write an engaging, SEO-optimized product title, a rich 3-paragraph product description, and 8 search tags for an e-commerce store based on the image provided and keywords: {{keywords}}. Target language: {{language}}. Focus on key benefits, target audience, and feature highlights.`,
        isDefault: true,
      },
    });

    console.log(`Default prompt template created: ${defaultPrompt.name} (${defaultPrompt.id})`);
  } else {
    console.log(`Default prompt template already exists: ${existingTemplate.name} (${existingTemplate.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
