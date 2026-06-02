import { PrismaClient } from "@/generated/prisma/client";
import path from "path";

// Resolve database path dynamically in development to prevent working directory issues
if (process.env.NODE_ENV !== "production") {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  process.env.DATABASE_URL = `file:${dbPath}`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
