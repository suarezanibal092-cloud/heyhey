import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@heyhey.com" },
    update: {},
    create: {
      email: "admin@heyhey.com",
      password: adminPassword,
      name: "Administrador",
      role: "admin",
    },
  });

  console.log("Admin user created:", admin.email);

  // Create a test client user
  const clientPassword = await hash("client123", 12);

  const client = await prisma.user.upsert({
    where: { email: "cliente@test.com" },
    update: {},
    create: {
      email: "cliente@test.com",
      password: clientPassword,
      name: "Cliente Demo",
      role: "client",
    },
  });

  console.log("Client user created:", client.email);

  console.log("Seeding completed!");
  console.log("\nCredentials:");
  console.log("Admin: admin@heyhey.com / admin123");
  console.log("Client: cliente@test.com / client123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
