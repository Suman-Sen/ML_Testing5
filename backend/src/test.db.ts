import { PrismaClient } from "../prisma/generated/prisma";
// import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const main = async () => {
  try {
    const randomUser = await prisma.user.create({
      data: {
        // email: `user${Date.now()}@example.com`,
        email:"johndoe@example.com",
        role: "SCANNER",
        firstName: "Random",
        lastName: "User",
      },
    });

    console.log("Created user:", randomUser);
  } catch (error) {
    console.error("Error creating user:", error);
  } finally {
    await prisma.$disconnect();
  }
};

main();
