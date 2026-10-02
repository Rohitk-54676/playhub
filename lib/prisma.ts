import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DIRECT_URL!;
const parsed = new URL(connectionString);

const adapter = new PrismaPg({
  host: parsed.hostname,
  port: parseInt(parsed.port),
  user: parsed.username,
  password: parsed.password,
  database: parsed.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
  // Keep connections alive — prevents Supabase pooler from closing them
  keepAlive: true,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  max: 5,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}