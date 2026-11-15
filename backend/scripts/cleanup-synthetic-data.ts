import { PrismaClient } from '@prisma/client';
import { SyntheticGeneratorService } from '../src/database/seed/synthetic-generator.service';

const prisma = new PrismaClient();

async function main() {
  const generator = new SyntheticGeneratorService(prisma);
  const result = await generator.cleanup();
  console.log('Cleanup result:', result);
}

main()
  .catch((e) => {
    console.error('Cleanup error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
