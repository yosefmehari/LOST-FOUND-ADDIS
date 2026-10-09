import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";
import { ItemType, ItemStatus, Role } from "@prisma/client";

async function main() {
  console.log("🌱 Starting development seed for Lost & Found Addis...");

  // Create demo users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Password123!", salt);

  const demoUser1 = await prisma.user.upsert({
    where: { email: "almaz.kebede@example.com" },
    update: {},
    create: {
      name: "Almaz Kebede",
      email: "almaz.kebede@example.com",
      passwordHash,
      role: Role.USER,
    },
  });

  const demoUser2 = await prisma.user.upsert({
    where: { email: "dawit.tesfaye@example.com" },
    update: {},
    create: {
      name: "Dawit Tesfaye",
      email: "dawit.tesfaye@example.com",
      passwordHash,
      role: Role.USER,
    },
  });

  const demoAdmin = await prisma.user.upsert({
    where: { email: "admin@lostfoundaddis.et" },
    update: {},
    create: {
      name: "System Moderator",
      email: "admin@lostfoundaddis.et",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log(`👤 Users seeded: ${demoUser1.name}, ${demoUser2.name}, ${demoAdmin.name}`);

  // Create realistic Addis Ababa demo items
  const demoItems = [
    {
      title: "Ethiopian National ID & CBE Debit Card",
      description: "Found on a cafe table near Edna Mall, Bole. Name on the ID card is Almaz. Kept safely, please provide bank branch name or ID serial number to claim.",
      category: "Wallets & Cards",
      type: ItemType.FOUND,
      location: "Bole Medhanialem, Edna Mall area",
      contactInfo: "@addis_finder_bot on Telegram",
      userId: demoUser2.id,
      status: ItemStatus.OPEN,
    },
    {
      title: "Samsung Galaxy S23 Ultra (Black)",
      description: "Lost inside a white minibus taxi going from Megenagna to Mexico Square around 6:00 PM. Screen has a clear protective glass with a tiny bubble on the top left.",
      category: "Phones & Electronics",
      type: ItemType.LOST,
      location: "Route: Megenagna to Mexico Square",
      contactInfo: "+251911000000",
      userId: demoUser1.id,
      status: ItemStatus.OPEN,
    },
    {
      title: "Toyota Car Key with Light Rail Transit Pass",
      description: "Found on the platform bench at Stadium Light Rail Transit station. Includes a remote car key and a blue plastic Addis Ababa LRT card.",
      category: "Keys & Bags",
      type: ItemType.FOUND,
      location: "Stadium Light Rail Transit Station, Kirkos",
      contactInfo: "Handed over to station security / Telegram @stadium_lrt",
      userId: demoUser2.id,
      status: ItemStatus.OPEN,
    },
    {
      title: "Brown Leather Satchel with Degree Certificates",
      description: "Lost in a ride hailing car near Addis Ababa University main campus (6 Kilo). Contains original AAU graduation documents.",
      category: "Documents & IDs",
      type: ItemType.LOST,
      location: "Sidist Kilo / Arat Kilo",
      contactInfo: "+251922000000",
      userId: demoUser1.id,
      status: ItemStatus.OPEN,
    },
    {
      title: "HP Laptop Charger & Reading Glasses",
      description: "Left behind on an outdoor table at Tomoca Coffee in Kazanchis yesterday afternoon. The glasses have a dark tortoise-shell frame.",
      category: "Other",
      type: ItemType.FOUND,
      location: "Kazanchis, near Tomoca Coffee",
      contactInfo: "With Tomoca counter staff",
      userId: demoUser2.id,
      status: ItemStatus.OPEN,
    },
  ];

  for (const item of demoItems) {
    const existing = await prisma.item.findFirst({
      where: { title: item.title, userId: item.userId },
    });
    if (!existing) {
      await prisma.item.create({ data: item });
    }
  }

  console.log(`✅ ${demoItems.length} demonstration listings seeded successfully!`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
