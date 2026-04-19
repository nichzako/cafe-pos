import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "กาแฟ", sortOrder: 1 },
    { name: "ชา", sortOrder: 2 },
    { name: "ชานมไข่มุก", sortOrder: 3 },
    { name: "เครื่องดื่มอื่น", sortOrder: 4 },
    { name: "เบเกอรี่", sortOrder: 5 },
    { name: "ของว่าง", sortOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log(`Seeded ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
