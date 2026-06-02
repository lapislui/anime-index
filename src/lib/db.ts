import { PrismaClient } from "@/generated/prisma/client";

// Manually set or fix DATABASE_URL at runtime for Next.js dev server hot-reloads
process.env.DATABASE_URL = "file:c:/Users/Keval/anime-index/prisma/dev.db";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
