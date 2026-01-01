/**
 * Prisma Client Configuration
 * 
 * Shares the same database as the backend
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'], // Only log errors and warnings, not queries
  errorFormat: 'pretty'
});

// Handle shutdown gracefully
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

