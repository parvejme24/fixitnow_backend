import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

type ServiceTag = "MOST_BOOKED" | "TOP_RATED" | "EMERGENCY";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Calendar date at UTC midnight for AvailabilitySlot @db.Date */
function dateOnly(daysFromToday: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d;
}

const AREA_NAMES = [
  "Dhanmondi",
  "Mohammadpur",
  "Gulshan",
  "Uttara",
  "Bashundhara",
  "Mirpur",
  "Banani",
  "Old Dhaka",
] as const;

const CATEGORIES = [
  { name: "Plumbing", icon: "🔧", isVisible: true, sortOrder: 1 },
  { name: "Electrical", icon: "⚡", isVisible: true, sortOrder: 2 },
  { name: "AC & Cooling", icon: "❄️", isVisible: true, sortOrder: 3 },
  { name: "Cleaning", icon: "🧹", isVisible: true, sortOrder: 4 },
  { name: "Painting", icon: "🎨", isVisible: true, sortOrder: 5 },
  { name: "Carpentry", icon: "🪚", isVisible: true, sortOrder: 6 },
  { name: "Appliance Repair", icon: "🔌", isVisible: true, sortOrder: 7 },
  { name: "Pest Control", icon: "🐛", isVisible: true, sortOrder: 8 },
] as const;

const SERVICES: {
  categorySlug: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  tag: ServiceTag | null;
  isFeatured: boolean;
  sortOrder: number;
  ratingAvg: number;
  reviewCount: number;
}[] = [
  // Plumbing
  {
    categorySlug: "plumbing",
    title: "Kitchen Sink & Tap Fix",
    description:
      "Repair leaking taps, replace cartridges, and clear minor kitchen sink blockages in Dhaka apartments.",
    price: 900,
    duration: "45 min",
    tag: "MOST_BOOKED",
    isFeatured: true,
    sortOrder: 1,
    ratingAvg: 4.7,
    reviewCount: 128,
  },
  {
    categorySlug: "plumbing",
    title: "Bathroom Leak & Pipe Repair",
    description:
      "Locate and fix bathroom pipe leaks, shower fittings, and WC flush issues with proper sealing.",
    price: 1500,
    duration: "1.5 hrs",
    tag: "EMERGENCY",
    isFeatured: false,
    sortOrder: 2,
    ratingAvg: 4.5,
    reviewCount: 86,
  },
  // Electrical
  {
    categorySlug: "electrical",
    title: "Fan & Light Installation",
    description:
      "Install or replace ceiling fans, LED lights, and switches with safe wiring checks.",
    price: 800,
    duration: "1 hrs",
    tag: "MOST_BOOKED",
    isFeatured: true,
    sortOrder: 3,
    ratingAvg: 4.8,
    reviewCount: 210,
  },
  {
    categorySlug: "electrical",
    title: "MCB & Wiring Fault Diagnosis",
    description:
      "Diagnose short circuits, trip issues, and fix household wiring faults for flats and duplexes.",
    price: 1800,
    duration: "1.5 hrs",
    tag: "EMERGENCY",
    isFeatured: false,
    sortOrder: 4,
    ratingAvg: 4.6,
    reviewCount: 64,
  },
  // AC & Cooling
  {
    categorySlug: "ac-and-cooling",
    title: "AC Deep Clean & Servicing",
    description:
      "Full indoor/outdoor unit cleaning, gas pressure check, and filter wash for split ACs.",
    price: 2200,
    duration: "1.5 hrs",
    tag: "TOP_RATED",
    isFeatured: true,
    sortOrder: 5,
    ratingAvg: 4.9,
    reviewCount: 305,
  },
  {
    categorySlug: "ac-and-cooling",
    title: "AC Gas Refill & Cooling Fix",
    description:
      "Leak check, gas refill, and cooling performance restore for 1–2 ton split ACs.",
    price: 3500,
    duration: "2 hrs",
    tag: "EMERGENCY",
    isFeatured: false,
    sortOrder: 6,
    ratingAvg: 4.4,
    reviewCount: 97,
  },
  // Cleaning
  {
    categorySlug: "cleaning",
    title: "2BHK Deep Home Cleaning",
    description:
      "Kitchen, bathroom, and floor deep clean for typical Dhaka 2BHK flats including balcony wipe-down.",
    price: 2800,
    duration: "3 hrs",
    tag: "MOST_BOOKED",
    isFeatured: true,
    sortOrder: 7,
    ratingAvg: 4.7,
    reviewCount: 174,
  },
  {
    categorySlug: "cleaning",
    title: "Kitchen & Bathroom Deep Clean",
    description:
      "Degrease kitchen surfaces, descale bathrooms, and sanitize high-touch areas.",
    price: 1600,
    duration: "2 hrs",
    tag: "TOP_RATED",
    isFeatured: false,
    sortOrder: 8,
    ratingAvg: 4.6,
    reviewCount: 112,
  },
  // Painting
  {
    categorySlug: "painting",
    title: "Single Room Wall Paint",
    description:
      "Prep, putty touch-ups, and two coats of emulsion for one standard bedroom or living room.",
    price: 4500,
    duration: "1 day",
    tag: "TOP_RATED",
    isFeatured: false,
    sortOrder: 9,
    ratingAvg: 4.5,
    reviewCount: 58,
  },
  {
    categorySlug: "painting",
    title: "Door & Window Touch-up Paint",
    description:
      "Sand, prime, and repaint wooden doors, frames, and window sills with durable enamel.",
    price: 2000,
    duration: "3 hrs",
    tag: null,
    isFeatured: false,
    sortOrder: 10,
    ratingAvg: 4.3,
    reviewCount: 41,
  },
  // Carpentry
  {
    categorySlug: "carpentry",
    title: "Furniture Assembly & Fit",
    description:
      "Assemble flat-pack furniture, shelves, and wardrobe fittings with wall anchoring where needed.",
    price: 1200,
    duration: "1.5 hrs",
    tag: "MOST_BOOKED",
    isFeatured: false,
    sortOrder: 11,
    ratingAvg: 4.6,
    reviewCount: 93,
  },
  {
    categorySlug: "carpentry",
    title: "Door Hinge & Lock Repair",
    description:
      "Fix sticking doors, replace hinges, and install or repair cylinder locks for home security.",
    price: 1000,
    duration: "45 min",
    tag: null,
    isFeatured: false,
    sortOrder: 12,
    ratingAvg: 4.4,
    reviewCount: 77,
  },
  // Appliance Repair
  {
    categorySlug: "appliance-repair",
    title: "Washing Machine Repair",
    description:
      "Diagnose drain, spin, and power issues for top-load and front-load washing machines.",
    price: 1500,
    duration: "1.5 hrs",
    tag: "TOP_RATED",
    isFeatured: false,
    sortOrder: 13,
    ratingAvg: 4.5,
    reviewCount: 119,
  },
  {
    categorySlug: "appliance-repair",
    title: "Fridge Cooling & Thermostat Fix",
    description:
      "Restore fridge cooling, check compressor, and replace faulty thermostat or door seal.",
    price: 1800,
    duration: "1.5 hrs",
    tag: "EMERGENCY",
    isFeatured: false,
    sortOrder: 14,
    ratingAvg: 4.4,
    reviewCount: 68,
  },
  // Pest Control
  {
    categorySlug: "pest-control",
    title: "Cockroach & Ant Control",
    description:
      "Targeted gel and spray treatment for kitchens and bathrooms with follow-up guidance.",
    price: 2500,
    duration: "1 hrs",
    tag: "MOST_BOOKED",
    isFeatured: false,
    sortOrder: 15,
    ratingAvg: 4.6,
    reviewCount: 142,
  },
  {
    categorySlug: "pest-control",
    title: "Mosquito Fogging (Flat)",
    description:
      "Indoor fogging for mosquitoes and flying insects suitable for flats up to 1200 sq ft.",
    price: 3000,
    duration: "45 min",
    tag: null,
    isFeatured: false,
    sortOrder: 16,
    ratingAvg: 4.2,
    reviewCount: 53,
  },
];

type TechSeed = {
  name: string;
  email: string;
  phone: string;
  initials: string;
  trade: string;
  areaNames: (typeof AREA_NAMES)[number][];
  visitFee: number;
  experienceYrs: number;
  jobsCompleted: number;
  ratingAvg: number;
  online: boolean;
  verified: boolean;
  bio: string;
  categorySlugs: string[];
  skills: string[];
};

const TECHNICIANS: TechSeed[] = [
  {
    name: "Rakib",
    email: "rakib@fixitnow.test",
    phone: "01711000001",
    initials: "RA",
    trade: "Plumbing",
    areaNames: ["Dhanmondi", "Mohammadpur"],
    visitFee: 200,
    experienceYrs: 8,
    jobsCompleted: 420,
    ratingAvg: 4.8,
    online: true,
    verified: true,
    bio: "Trusted plumber for flats in Dhanmondi and nearby lakeside areas.",
    categorySlugs: ["plumbing"],
    skills: ["Pipe repair", "Tap replacement", "Drain clearing", "WC install"],
  },
  {
    name: "Shamim",
    email: "shamim@fixitnow.test",
    phone: "01711000002",
    initials: "SH",
    trade: "Electrical",
    areaNames: ["Mirpur", "Uttara"],
    visitFee: 150,
    experienceYrs: 6,
    jobsCompleted: 310,
    ratingAvg: 4.6,
    online: true,
    verified: true,
    bio: "Licensed electrician specializing in household wiring and fan installs.",
    categorySlugs: ["electrical"],
    skills: ["Wiring", "MCB change", "Fan install", "Switchboard"],
  },
  {
    name: "Nasima",
    email: "nasima@fixitnow.test",
    phone: "01711000003",
    initials: "NA",
    trade: "Cleaning",
    areaNames: ["Mohammadpur"],
    visitFee: 100,
    experienceYrs: 5,
    jobsCompleted: 280,
    ratingAvg: 4.9,
    online: true,
    verified: true,
    bio: "Detail-oriented home cleaner for kitchens, baths, and full-flat deep cleans.",
    categorySlugs: ["cleaning"],
    skills: ["Deep cleaning", "Kitchen degrease", "Bathroom sanitize"],
  },
  {
    name: "Jubayer",
    email: "jubayer@fixitnow.test",
    phone: "01711000004",
    initials: "JU",
    trade: "AC & Cooling",
    areaNames: ["Gulshan", "Banani", "Bashundhara"],
    visitFee: 300,
    experienceYrs: 10,
    jobsCompleted: 560,
    ratingAvg: 4.7,
    online: true,
    verified: true,
    bio: "AC specialist for split units — servicing, gas, and cooling repairs.",
    categorySlugs: ["ac-and-cooling", "appliance-repair"],
    skills: ["AC servicing", "Gas refill", "Filter clean", "Thermostat"],
  },
  {
    name: "Milon",
    email: "milon@fixitnow.test",
    phone: "01711000005",
    initials: "MI",
    trade: "Painting",
    areaNames: ["Uttara"],
    visitFee: 250,
    experienceYrs: 7,
    jobsCompleted: 190,
    ratingAvg: 4.5,
    online: false,
    verified: true,
    bio: "Interior painter for rooms, doors, and neat touch-up work in Uttara.",
    categorySlugs: ["painting"],
    skills: ["Wall paint", "Putty work", "Enamel paint"],
  },
  {
    name: "Farhana",
    email: "farhana@fixitnow.test",
    phone: "01711000006",
    initials: "FA",
    trade: "Pest Control",
    areaNames: ["Bashundhara"],
    visitFee: 200,
    experienceYrs: 4,
    jobsCompleted: 150,
    ratingAvg: 4.6,
    online: true,
    verified: true,
    bio: "Safe pest treatments for cockroaches, ants, and mosquitoes in flats.",
    categorySlugs: ["pest-control"],
    skills: ["Gel treatment", "Fogging", "Ant control", "Kitchen pests"],
  },
  {
    name: "Tanvir",
    email: "tanvir@fixitnow.test",
    phone: "01711000007",
    initials: "TA",
    trade: "Carpentry",
    areaNames: ["Banani"],
    visitFee: 180,
    experienceYrs: 9,
    jobsCompleted: 340,
    ratingAvg: 4.7,
    online: true,
    verified: true,
    bio: "Carpenter for furniture assembly, doors, and custom shelf fitting.",
    categorySlugs: ["carpentry"],
    skills: ["Furniture assembly", "Door repair", "Lock fitting"],
  },
  {
    name: "Imran",
    email: "imran@fixitnow.test",
    phone: "01711000008",
    initials: "IM",
    trade: "Appliance Repair",
    areaNames: ["Mirpur"],
    visitFee: 220,
    experienceYrs: 6,
    jobsCompleted: 260,
    ratingAvg: 4.4,
    online: false,
    verified: false,
    bio: "Repairs washing machines and fridges with on-site diagnosis.",
    categorySlugs: ["appliance-repair", "electrical"],
    skills: ["Washing machine", "Fridge repair", "Basic electrical"],
  },
  {
    name: "Sohel",
    email: "sohel@fixitnow.test",
    phone: "01711000009",
    initials: "SO",
    trade: "Plumbing",
    areaNames: ["Old Dhaka"],
    visitFee: 400,
    experienceYrs: 12,
    jobsCompleted: 610,
    ratingAvg: 4.8,
    online: true,
    verified: true,
    bio: "Veteran plumber covering Old Dhaka emergencies and pipe overhauls.",
    categorySlugs: ["plumbing", "carpentry"],
    skills: ["Emergency plumbing", "Pipe welding", "Tank overflow", "Fixture fit"],
  },
];

const SLOT_TIMES = [
  { startTime: "09:00 AM", endTime: "11:00 AM" },
  { startTime: "11:00 AM", endTime: "01:00 PM" },
  { startTime: "03:00 PM", endTime: "05:00 PM" },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("password", 12);

  // ── 1. Admin ──────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "mdparvej@gmail.com" },
    update: {
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      initials: "A",
      isActive: true,
    },
    create: {
      name: "Admin",
      email: "mdparvej@gmail.com",
      passwordHash,
      role: "ADMIN",
      initials: "A",
      isActive: true,
    },
  });

  // ── 2. Areas ──────────────────────────────────────────────
  const areaByName = new Map<string, string>();
  for (const name of AREA_NAMES) {
    const area = await prisma.area.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    areaByName.set(name, area.id);
  }

  // ── 3. Categories ─────────────────────────────────────────
  const categoryBySlug = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const slug = slugify(cat.name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        isVisible: cat.isVisible,
        sortOrder: cat.sortOrder,
      },
      create: {
        name: cat.name,
        slug,
        icon: cat.icon,
        isVisible: cat.isVisible,
        sortOrder: cat.sortOrder,
      },
    });
    categoryBySlug.set(slug, category.id);
  }

  // ── 4. Services ───────────────────────────────────────────
  for (const svc of SERVICES) {
    const categoryId = categoryBySlug.get(svc.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing category for slug: ${svc.categorySlug}`);
    }

    const existing = await prisma.service.findFirst({
      where: { title: svc.title },
    });

    const data = {
      categoryId,
      title: svc.title,
      description: svc.description,
      price: svc.price,
      duration: svc.duration,
      tag: svc.tag,
      isFeatured: svc.isFeatured,
      sortOrder: svc.sortOrder,
      ratingAvg: svc.ratingAvg,
      reviewCount: svc.reviewCount,
      isActive: true,
    };

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.service.create({ data });
    }
  }

  // ── 5. Technicians (users + profiles) ─────────────────────
  for (const tech of TECHNICIANS) {
    const areaIds = tech.areaNames.map((name) => {
      const areaId = areaByName.get(name);
      if (!areaId) throw new Error(`Missing area: ${name}`);
      return areaId;
    });

    const user = await prisma.user.upsert({
      where: { email: tech.email },
      update: {
        name: tech.name,
        phone: tech.phone,
        passwordHash,
        role: "TECHNICIAN",
        initials: tech.initials,
        isActive: true,
      },
      create: {
        name: tech.name,
        email: tech.email,
        phone: tech.phone,
        passwordHash,
        role: "TECHNICIAN",
        initials: tech.initials,
        isActive: true,
      },
    });

    const profileData = {
      userId: user.id,
      trade: tech.trade,
      bio: tech.bio,
      initials: tech.initials,
      visitFee: tech.visitFee,
      experienceYrs: tech.experienceYrs,
      jobsCompleted: tech.jobsCompleted,
      ratingAvg: tech.ratingAvg,
      online: tech.online,
      verified: tech.verified,
    };

    const existingProfile = await prisma.technicianProfile.findUnique({
      where: { userId: user.id },
    });

    const profile = existingProfile
      ? await prisma.technicianProfile.update({
          where: { userId: user.id },
          data: profileData,
        })
      : await prisma.technicianProfile.create({
          data: profileData,
        });

    // Service zones
    await prisma.technicianArea.deleteMany({
      where: { technicianId: profile.id },
    });
    for (const areaId of areaIds) {
      await prisma.technicianArea.create({
        data: {
          technicianId: profile.id,
          areaId,
        },
      });
    }

    // Categories
    for (const categorySlug of tech.categorySlugs) {
      const categoryId = categoryBySlug.get(categorySlug);
      if (!categoryId) {
        throw new Error(`Missing category for slug: ${categorySlug}`);
      }

      await prisma.technicianCategory.upsert({
        where: {
          technicianId_categoryId: {
            technicianId: profile.id,
            categoryId,
          },
        },
        update: {},
        create: {
          technicianId: profile.id,
          categoryId,
        },
      });
    }

    // Skills
    for (const skillName of tech.skills) {
      await prisma.technicianSkill.upsert({
        where: {
          technicianId_name: {
            technicianId: profile.id,
            name: skillName,
          },
        },
        update: {},
        create: {
          technicianId: profile.id,
          name: skillName,
        },
      });
    }

    // Availability: next 7 days, a few unbooked slots each day
    for (let day = 0; day < 7; day++) {
      const date = dateOnly(day);
      // Vary slot count slightly (2–3 per day) so each tech has 2–4+ across the week
      const slotsForDay = SLOT_TIMES.slice(0, day % 2 === 0 ? 3 : 2);
      for (const slot of slotsForDay) {
        await prisma.availabilitySlot.upsert({
          where: {
            technicianId_date_startTime: {
              technicianId: profile.id,
              date,
              startTime: slot.startTime,
            },
          },
          update: {
            endTime: slot.endTime,
            isBooked: false,
          },
          create: {
            technicianId: profile.id,
            date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBooked: false,
          },
        });
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────
  const [areas, categories, services, users, techs, skills, techCats, slots] =
    await Promise.all([
      prisma.area.count(),
      prisma.category.count(),
      prisma.service.count(),
      prisma.user.count(),
      prisma.technicianProfile.count(),
      prisma.technicianSkill.count(),
      prisma.technicianCategory.count(),
      prisma.availabilitySlot.count(),
    ]);

  console.log("Seed complete:");
  console.log(`  Areas:               ${areas}`);
  console.log(`  Categories:          ${categories}`);
  console.log(`  Services:            ${services}`);
  console.log(`  Users:               ${users}`);
  console.log(`  Technician profiles: ${techs}`);
  console.log(`  Technician skills:   ${skills}`);
  console.log(`  Technician cats:     ${techCats}`);
  console.log(`  Availability slots:  ${slots}`);
  console.log("  Admin: mdparvej@gmail.com / password");
  console.log("  Techs: *.@fixitnow.test / password");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
