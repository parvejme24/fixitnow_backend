import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

type ServiceTag = "MOST_BOOKED" | "TOP_RATED" | "EMERGENCY";
type BookingStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "DECLINED"
  | "PAID"
  | "EN_ROUTE"
  | "ON_SITE"
  | "COMPLETED"
  | "CANCELLED";
type PaymentMethod = "BKASH" | "NAGAD" | "CARD";
type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "CANCELLED";

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

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function dateOnly(daysFromToday: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/** Stable Unsplash portrait URLs for demo profiles */
const PORTRAITS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1544005313-94cfbc94d61b?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1529626455594-64432c1c1b1d?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1619895862022-09114b69e63b?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1614283233556-f35b0c8014a8?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?auto=format&fit=crop&w=400&h=400&q=80",
  "https://images.unsplash.com/photo-1619895862022-09114b69e63b?auto=format&fit=crop&w=400&h=400&q=80",
] as const;

const SERVICE_IMAGES = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1595428774223-ef5262434a16?auto=format&fit=crop&w=800&q=80",
] as const;

// ── Entire Dhaka city service zones ─────────────────────────
const AREA_NAMES = [
  "Dhanmondi",
  "Lalmatia",
  "Mohammadpur",
  "Adabor",
  "Shyamoli",
  "Agargaon",
  "Sher-e-Bangla Nagar",
  "Farmgate",
  "Tejgaon",
  "Kawran Bazar",
  "Panthapath",
  "Green Road",
  "Elephant Road",
  "New Market",
  "Azimpur",
  "Lalbagh",
  "Old Dhaka",
  "Kotwali",
  "Wari",
  "Sutrapur",
  "Motijheel",
  "Paltan",
  "Segunbagicha",
  "Eskaton",
  "Ramna",
  "Kakrail",
  "Malibagh",
  "Mouchak",
  "Rampura",
  "Badda",
  "Merul Badda",
  "Notun Bazar",
  "Gulshan",
  "Banani",
  "Baridhara",
  "Baridhara DOHS",
  "Mohakhali",
  "Mohakhali DOHS",
  "Cantonment",
  "Bashundhara R/A",
  "Niketan",
  "Nikunja",
  "Khilkhet",
  "Uttara Sector 1",
  "Uttara Sector 7",
  "Uttara Sector 10",
  "Uttara Sector 14",
  "Airport Area",
  "Mirpur 1",
  "Mirpur 2",
  "Mirpur 10",
  "Mirpur 11",
  "Mirpur 12",
  "Pallabi",
  "Kazipara",
  "Shewrapara",
  "Kafrul",
  "Kalshi",
  "Khilgaon",
  "Mugda",
  "Basabo",
  "Sabujbagh",
  "Jatrabari",
  "Demra",
  "Shantinagar",
  "Bailey Road",
  "Hatirjheel",
  "Aftabnagar",
  "Vatara",
  "Joar Sahara",
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
  { name: "Moving & Packing", icon: "📦", isVisible: true, sortOrder: 9 },
  { name: "Gardening", icon: "🌿", isVisible: true, sortOrder: 10 },
  { name: "Waterproofing", icon: "💧", isVisible: true, sortOrder: 11 },
  { name: "CCTV & Security", icon: "📷", isVisible: true, sortOrder: 12 },
] as const;

type ServiceSeed = {
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
};

const SERVICES: ServiceSeed[] = [
  { categorySlug: "plumbing", title: "Kitchen Sink & Tap Fix", description: "Repair leaking taps, replace cartridges, and clear minor kitchen sink blockages in Dhaka apartments.", price: 900, duration: "45 min", tag: "MOST_BOOKED", isFeatured: true, sortOrder: 1, ratingAvg: 4.7, reviewCount: 128 },
  { categorySlug: "plumbing", title: "Bathroom Leak & Pipe Repair", description: "Locate and fix bathroom pipe leaks, shower fittings, and WC flush issues with proper sealing.", price: 1500, duration: "1.5 hrs", tag: "EMERGENCY", isFeatured: false, sortOrder: 2, ratingAvg: 4.5, reviewCount: 86 },
  { categorySlug: "plumbing", title: "Water Tank Cleaning", description: "Roof tank scrub, disinfectant rinse, and outlet flush for residential buildings.", price: 2500, duration: "2 hrs", tag: "TOP_RATED", isFeatured: true, sortOrder: 3, ratingAvg: 4.8, reviewCount: 74 },
  { categorySlug: "electrical", title: "Fan & Light Installation", description: "Install or replace ceiling fans, LED lights, and switches with safe wiring checks.", price: 800, duration: "1 hrs", tag: "MOST_BOOKED", isFeatured: true, sortOrder: 4, ratingAvg: 4.8, reviewCount: 210 },
  { categorySlug: "electrical", title: "MCB & Wiring Fault Diagnosis", description: "Diagnose short circuits, trip issues, and fix household wiring faults for flats and duplexes.", price: 1800, duration: "1.5 hrs", tag: "EMERGENCY", isFeatured: false, sortOrder: 5, ratingAvg: 4.6, reviewCount: 64 },
  { categorySlug: "electrical", title: "Full Flat Electrical Check", description: "Socket, switchboard, and load audit with recommendations for safety upgrades.", price: 2200, duration: "2 hrs", tag: null, isFeatured: false, sortOrder: 6, ratingAvg: 4.4, reviewCount: 41 },
  { categorySlug: "ac-and-cooling", title: "AC Deep Clean & Servicing", description: "Full indoor/outdoor unit cleaning, gas pressure check, and filter wash for split ACs.", price: 2200, duration: "1.5 hrs", tag: "TOP_RATED", isFeatured: true, sortOrder: 7, ratingAvg: 4.9, reviewCount: 305 },
  { categorySlug: "ac-and-cooling", title: "AC Gas Refill & Cooling Fix", description: "Leak check, gas refill, and cooling performance restore for 1–2 ton split ACs.", price: 3500, duration: "2 hrs", tag: "EMERGENCY", isFeatured: false, sortOrder: 8, ratingAvg: 4.4, reviewCount: 97 },
  { categorySlug: "ac-and-cooling", title: "AC Installation & Bracket Fit", description: "New split AC install with copper piping, drain setup, and test run.", price: 4500, duration: "3 hrs", tag: "MOST_BOOKED", isFeatured: true, sortOrder: 9, ratingAvg: 4.7, reviewCount: 112 },
  { categorySlug: "cleaning", title: "2BHK Deep Home Cleaning", description: "Kitchen, bathroom, and floor deep clean for typical Dhaka 2BHK flats including balcony wipe-down.", price: 2800, duration: "3 hrs", tag: "MOST_BOOKED", isFeatured: true, sortOrder: 10, ratingAvg: 4.6, reviewCount: 188 },
  { categorySlug: "cleaning", title: "Sofa & Mattress Steam Clean", description: "Professional steam cleaning for sofas, mattresses, and fabric chairs.", price: 1800, duration: "1.5 hrs", tag: "TOP_RATED", isFeatured: false, sortOrder: 11, ratingAvg: 4.7, reviewCount: 93 },
  { categorySlug: "cleaning", title: "Office Floor & Washroom Clean", description: "Daily or one-time office cleaning for washrooms, desks, and common floors.", price: 3200, duration: "2.5 hrs", tag: null, isFeatured: false, sortOrder: 12, ratingAvg: 4.3, reviewCount: 55 },
  { categorySlug: "painting", title: "Single Room Interior Paint", description: "Wall prep, putty touch-ups, and two coats for one standard bedroom.", price: 4500, duration: "1 day", tag: "MOST_BOOKED", isFeatured: true, sortOrder: 13, ratingAvg: 4.5, reviewCount: 67 },
  { categorySlug: "painting", title: "Full Flat Fresh Paint", description: "Interior painting for 2–3 bedroom flats with masking and cleanup.", price: 18000, duration: "3 days", tag: "TOP_RATED", isFeatured: true, sortOrder: 14, ratingAvg: 4.8, reviewCount: 39 },
  { categorySlug: "painting", title: "Door & Grill Enamel Paint", description: "Metal grill and wooden door enamel finish with rust prep.", price: 2200, duration: "4 hrs", tag: null, isFeatured: false, sortOrder: 15, ratingAvg: 4.2, reviewCount: 28 },
  { categorySlug: "carpentry", title: "Door Hinge & Lock Repair", description: "Fix jammed doors, replace hinges, and install quality locks.", price: 1200, duration: "1 hrs", tag: "MOST_BOOKED", isFeatured: false, sortOrder: 16, ratingAvg: 4.6, reviewCount: 101 },
  { categorySlug: "carpentry", title: "Custom Shelf Installation", description: "Measure and install wall shelves or TV panels with anchors.", price: 2500, duration: "2 hrs", tag: null, isFeatured: true, sortOrder: 17, ratingAvg: 4.5, reviewCount: 58 },
  { categorySlug: "carpentry", title: "Kitchen Cabinet Fix", description: "Repair cabinet doors, soft-close hinges, and drawer slides.", price: 1800, duration: "1.5 hrs", tag: "TOP_RATED", isFeatured: false, sortOrder: 18, ratingAvg: 4.7, reviewCount: 72 },
  { categorySlug: "appliance-repair", title: "Fridge Cooling Problem", description: "Diagnose fridge compressor, thermostat, and gas issues.", price: 1500, duration: "1.5 hrs", tag: "EMERGENCY", isFeatured: true, sortOrder: 19, ratingAvg: 4.4, reviewCount: 143 },
  { categorySlug: "appliance-repair", title: "Washing Machine Repair", description: "Fix drainage, spin, and PCB faults for top/front load machines.", price: 1600, duration: "1.5 hrs", tag: "MOST_BOOKED", isFeatured: true, sortOrder: 20, ratingAvg: 4.6, reviewCount: 119 },
  { categorySlug: "appliance-repair", title: "Oven & Microwave Fix", description: "Repair heating elements, turntables, and control panels.", price: 1400, duration: "1 hrs", tag: null, isFeatured: false, sortOrder: 21, ratingAvg: 4.3, reviewCount: 46 },
  { categorySlug: "pest-control", title: "Cockroach & Ant Treatment", description: "Gel and spray treatment for kitchens and wet areas.", price: 1800, duration: "1 hrs", tag: "MOST_BOOKED", isFeatured: true, sortOrder: 22, ratingAvg: 4.5, reviewCount: 160 },
  { categorySlug: "pest-control", title: "Termite Inspection & Spray", description: "Wood and soil treatment for termite prevention.", price: 4500, duration: "2 hrs", tag: "TOP_RATED", isFeatured: false, sortOrder: 23, ratingAvg: 4.7, reviewCount: 52 },
  { categorySlug: "pest-control", title: "Mosquito Fogging (Flat)", description: "Indoor fogging for mosquitoes and flies in apartments.", price: 1200, duration: "45 min", tag: "EMERGENCY", isFeatured: false, sortOrder: 24, ratingAvg: 4.1, reviewCount: 88 },
  { categorySlug: "moving-and-packing", title: "1BHK Local Shift", description: "Packing help and mini-truck shift within Dhaka city.", price: 6500, duration: "4 hrs", tag: "MOST_BOOKED", isFeatured: true, sortOrder: 25, ratingAvg: 4.4, reviewCount: 77 },
  { categorySlug: "moving-and-packing", title: "2BHK Full Home Move", description: "Furniture dismantle, packing, transport, and unload.", price: 12000, duration: "1 day", tag: "TOP_RATED", isFeatured: true, sortOrder: 26, ratingAvg: 4.6, reviewCount: 44 },
  { categorySlug: "moving-and-packing", title: "Office Desk Relocation", description: "Move desks, cabinets, and IT boxes between floors or buildings.", price: 4000, duration: "3 hrs", tag: null, isFeatured: false, sortOrder: 27, ratingAvg: 4.2, reviewCount: 31 },
  { categorySlug: "gardening", title: "Balcony Garden Makeover", description: "Soil refresh, pot arrangement, and plant health check.", price: 2200, duration: "2 hrs", tag: null, isFeatured: true, sortOrder: 28, ratingAvg: 4.5, reviewCount: 36 },
  { categorySlug: "gardening", title: "Lawn & Hedge Trimming", description: "Trim hedges, cut grass, and clear garden waste.", price: 2800, duration: "2.5 hrs", tag: "MOST_BOOKED", isFeatured: false, sortOrder: 29, ratingAvg: 4.3, reviewCount: 29 },
  { categorySlug: "gardening", title: "Indoor Plant Care Visit", description: "Watering schedule setup and pest check for indoor plants.", price: 900, duration: "45 min", tag: "TOP_RATED", isFeatured: false, sortOrder: 30, ratingAvg: 4.8, reviewCount: 61 },
  { categorySlug: "waterproofing", title: "Roof Leak Waterproofing", description: "Identify roof cracks and apply waterproof coating.", price: 5500, duration: "4 hrs", tag: "EMERGENCY", isFeatured: true, sortOrder: 31, ratingAvg: 4.4, reviewCount: 48 },
  { categorySlug: "waterproofing", title: "Bathroom Damp Proofing", description: "Tile-edge sealing and damp treatment for bathrooms.", price: 3200, duration: "3 hrs", tag: "MOST_BOOKED", isFeatured: false, sortOrder: 32, ratingAvg: 4.5, reviewCount: 57 },
  { categorySlug: "waterproofing", title: "Basement Seepage Fix", description: "Seepage diagnosis and chemical injection for basements.", price: 8000, duration: "1 day", tag: "TOP_RATED", isFeatured: false, sortOrder: 33, ratingAvg: 4.6, reviewCount: 22 },
  { categorySlug: "cctv-and-security", title: "2-Camera CCTV Install", description: "Install 2 IP/analog cameras with DVR/NVR setup.", price: 6500, duration: "3 hrs", tag: "MOST_BOOKED", isFeatured: true, sortOrder: 34, ratingAvg: 4.7, reviewCount: 83 },
  { categorySlug: "cctv-and-security", title: "Door Access & Bell Camera", description: "Smart doorbell or access control install for apartments.", price: 4200, duration: "2 hrs", tag: "TOP_RATED", isFeatured: true, sortOrder: 35, ratingAvg: 4.6, reviewCount: 54 },
  { categorySlug: "cctv-and-security", title: "CCTV Troubleshooting", description: "Fix offline cameras, storage issues, and remote viewing.", price: 1500, duration: "1.5 hrs", tag: "EMERGENCY", isFeatured: false, sortOrder: 36, ratingAvg: 4.3, reviewCount: 70 },
];

const ADMINS = [
  { name: "Md Parvej", email: "mdparvej@gmail.com", phone: "01710000001" },
  { name: "Nusrat Jahan", email: "nusrat.admin@fixitnow.test", phone: "01710000002" },
  { name: "Imran Hossain", email: "imran.admin@fixitnow.test", phone: "01710000003" },
  { name: "Sadia Rahman", email: "sadia.admin@fixitnow.test", phone: "01710000004" },
  { name: "Tanvir Ahmed", email: "tanvir.admin@fixitnow.test", phone: "01710000005" },
] as const;

const CUSTOMERS = [
  { name: "Ayesha Khan", email: "ayesha.customer@fixitnow.test", phone: "01820000001" },
  { name: "Rahim Uddin", email: "rahim.customer@fixitnow.test", phone: "01820000002" },
  { name: "Farzana Akter", email: "farzana.customer@fixitnow.test", phone: "01820000003" },
  { name: "Mehedi Hasan", email: "mehedi.customer@fixitnow.test", phone: "01820000004" },
  { name: "Lamia Chowdhury", email: "lamia.customer@fixitnow.test", phone: "01820000005" },
  { name: "Sakib Al Hasan", email: "sakib.customer@fixitnow.test", phone: "01820000006" },
  { name: "Nabila Islam", email: "nabila.customer@fixitnow.test", phone: "01820000007" },
  { name: "Arif Mahmud", email: "arif.customer@fixitnow.test", phone: "01820000008" },
  { name: "Tamanna Sultana", email: "tamanna.customer@fixitnow.test", phone: "01820000009" },
  { name: "Jahidul Islam", email: "jahid.customer@fixitnow.test", phone: "01820000010" },
] as const;

type TechSeed = {
  name: string;
  email: string;
  phone: string;
  trade: string;
  areaNames: string[];
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
  { name: "Rakib Hasan", email: "rakib@fixitnow.test", phone: "01711000001", trade: "Plumbing", areaNames: ["Dhanmondi", "Lalmatia", "Mohammadpur"], visitFee: 200, experienceYrs: 8, jobsCompleted: 420, ratingAvg: 4.8, online: true, verified: true, bio: "Licensed plumber specializing in Dhaka flat kitchens and bathrooms.", categorySlugs: ["plumbing"], skills: ["Tap repair", "Pipe leak", "WC flush", "Tank clean"] },
  { name: "Karim Mia", email: "karim@fixitnow.test", phone: "01711000002", trade: "Electrical", areaNames: ["Mirpur 10", "Mirpur 11", "Pallabi", "Kazipara"], visitFee: 150, experienceYrs: 6, jobsCompleted: 310, ratingAvg: 4.6, online: true, verified: true, bio: "House wiring and fan/light installs across Mirpur.", categorySlugs: ["electrical"], skills: ["Wiring", "MCB", "Fan install", "Switchboard"] },
  { name: "Shuvo Ahmed", email: "shuvo@fixitnow.test", phone: "01711000003", trade: "AC & Cooling", areaNames: ["Gulshan", "Banani", "Baridhara", "Mohakhali"], visitFee: 300, experienceYrs: 10, jobsCompleted: 560, ratingAvg: 4.9, online: true, verified: true, bio: "Split AC specialist for Gulshan–Banani homes and offices.", categorySlugs: ["ac-and-cooling"], skills: ["AC service", "Gas refill", "Install", "Leak check"] },
  { name: "Nadia Sultana", email: "nadia@fixitnow.test", phone: "01711000004", trade: "Cleaning", areaNames: ["Uttara Sector 7", "Uttara Sector 10", "Uttara Sector 14", "Airport Area"], visitFee: 100, experienceYrs: 5, jobsCompleted: 280, ratingAvg: 4.7, online: true, verified: true, bio: "Deep cleaning teams for Uttara apartments.", categorySlugs: ["cleaning"], skills: ["Deep clean", "Sofa steam", "Kitchen degrease"] },
  { name: "Imtiaz Kabir", email: "imtiaz@fixitnow.test", phone: "01711000005", trade: "Painting", areaNames: ["Bashundhara R/A", "Nikunja", "Vatara", "Aftabnagar"], visitFee: 250, experienceYrs: 7, jobsCompleted: 190, ratingAvg: 4.5, online: false, verified: true, bio: "Interior painting with neat masking and fast turnaround.", categorySlugs: ["painting"], skills: ["Interior paint", "Putty", "Enamel"] },
  { name: "Rashed Khan", email: "rashed@fixitnow.test", phone: "01711000006", trade: "Carpentry", areaNames: ["Dhanmondi", "Green Road", "Elephant Road", "New Market"], visitFee: 180, experienceYrs: 9, jobsCompleted: 340, ratingAvg: 4.6, online: true, verified: true, bio: "Furniture fixes and custom shelves for central Dhaka.", categorySlugs: ["carpentry"], skills: ["Door fix", "Shelves", "Cabinet"] },
  { name: "Farhan Islam", email: "farhan@fixitnow.test", phone: "01711000007", trade: "Appliance Repair", areaNames: ["Badda", "Rampura", "Malibagh", "Notun Bazar"], visitFee: 200, experienceYrs: 4, jobsCompleted: 150, ratingAvg: 4.4, online: true, verified: true, bio: "Fridge and washer repairs with genuine parts sourcing.", categorySlugs: ["appliance-repair"], skills: ["Fridge", "Washer", "Microwave"] },
  { name: "Sumaiya Begum", email: "sumaiya@fixitnow.test", phone: "01711000008", trade: "Pest Control", areaNames: ["Mirpur 1", "Mirpur 2", "Shewrapara", "Kafrul"], visitFee: 220, experienceYrs: 6, jobsCompleted: 260, ratingAvg: 4.5, online: true, verified: true, bio: "Safe gel treatments for kitchens and wet zones.", categorySlugs: ["pest-control"], skills: ["Cockroach gel", "Termite", "Fogging"] },
  { name: "Jahangir Alam", email: "jahangir@fixitnow.test", phone: "01711000009", trade: "Plumbing", areaNames: ["Old Dhaka", "Lalbagh", "Wari", "Azimpur", "Kotwali"], visitFee: 400, experienceYrs: 12, jobsCompleted: 610, ratingAvg: 4.8, online: true, verified: true, bio: "Emergency plumbing across Old Dhaka lanes.", categorySlugs: ["plumbing", "waterproofing"], skills: ["Emergency plumbing", "Pipe welding", "Seepage"] },
  { name: "Tania Rahman", email: "tania@fixitnow.test", phone: "01711000010", trade: "Electrical", areaNames: ["Motijheel", "Paltan", "Segunbagicha", "Eskaton", "Ramna"], visitFee: 180, experienceYrs: 5, jobsCompleted: 210, ratingAvg: 4.5, online: true, verified: true, bio: "Office and flat electrical diagnostics downtown.", categorySlugs: ["electrical", "cctv-and-security"], skills: ["Wiring audit", "CCTV power", "MCB"] },
  { name: "Mahmud Hasan", email: "mahmud@fixitnow.test", phone: "01711000011", trade: "AC & Cooling", areaNames: ["Dhanmondi", "Mohammadpur", "Adabor", "Shyamoli"], visitFee: 280, experienceYrs: 8, jobsCompleted: 390, ratingAvg: 4.7, online: false, verified: true, bio: "Seasonal AC servicing for west Dhaka homes.", categorySlugs: ["ac-and-cooling"], skills: ["Deep clean", "Install", "Gas"] },
  { name: "Rima Akter", email: "rima@fixitnow.test", phone: "01711000012", trade: "Cleaning", areaNames: ["Gulshan", "Banani", "Niketan", "Baridhara DOHS"], visitFee: 150, experienceYrs: 4, jobsCompleted: 175, ratingAvg: 4.6, online: true, verified: true, bio: "Premium flat cleaning with eco-friendly products.", categorySlugs: ["cleaning"], skills: ["Deep clean", "Glass wipe", "Kitchen"] },
  { name: "Sajid Hossain", email: "sajid@fixitnow.test", phone: "01711000013", trade: "Moving & Packing", areaNames: ["Uttara Sector 1", "Mirpur 12", "Airport Area", "Khilkhet"], visitFee: 500, experienceYrs: 7, jobsCompleted: 220, ratingAvg: 4.4, online: true, verified: true, bio: "Careful packing and local shifts with mini trucks.", categorySlugs: ["moving-and-packing"], skills: ["Packing", "Furniture move", "Unload"] },
  { name: "Anika Chowdhury", email: "anika@fixitnow.test", phone: "01711000014", trade: "Gardening", areaNames: ["Bashundhara R/A", "Baridhara", "Gulshan", "Banani"], visitFee: 200, experienceYrs: 5, jobsCompleted: 130, ratingAvg: 4.7, online: true, verified: true, bio: "Balcony and rooftop garden makeovers.", categorySlugs: ["gardening"], skills: ["Potting", "Trim", "Plant care"] },
  { name: "Omar Faruq", email: "omar@fixitnow.test", phone: "01711000015", trade: "Waterproofing", areaNames: ["Khilgaon", "Mugda", "Basabo", "Sabujbagh", "Jatrabari"], visitFee: 350, experienceYrs: 9, jobsCompleted: 205, ratingAvg: 4.5, online: false, verified: true, bio: "Roof and bathroom waterproofing specialist.", categorySlugs: ["waterproofing", "plumbing"], skills: ["Roof coat", "Damp proof", "Seepage"] },
  { name: "Pritom Das", email: "pritom@fixitnow.test", phone: "01711000016", trade: "CCTV & Security", areaNames: ["Tejgaon", "Farmgate", "Kawran Bazar", "Panthapath", "Agargaon"], visitFee: 250, experienceYrs: 6, jobsCompleted: 245, ratingAvg: 4.6, online: true, verified: true, bio: "CCTV and doorbell camera installs for shops and flats.", categorySlugs: ["cctv-and-security", "electrical"], skills: ["IP camera", "NVR", "Remote view"] },
  { name: "Hasan Ali", email: "hasan@fixitnow.test", phone: "01711000017", trade: "Appliance Repair", areaNames: ["Mirpur 10", "Kalshi", "Pallabi", "Kafrul"], visitFee: 160, experienceYrs: 3, jobsCompleted: 95, ratingAvg: 4.2, online: true, verified: false, bio: "New technician focused on washers and fridges.", categorySlugs: ["appliance-repair"], skills: ["Washer", "Fridge"] },
  { name: "Liza Khan", email: "liza@fixitnow.test", phone: "01711000018", trade: "Painting", areaNames: ["Dhanmondi", "Lalmatia", "Azimpur", "New Market"], visitFee: 220, experienceYrs: 4, jobsCompleted: 110, ratingAvg: 4.3, online: true, verified: false, bio: "Affordable room painting with color consult.", categorySlugs: ["painting"], skills: ["Interior", "Touch-up"] },
  { name: "Nayeem Reza", email: "nayeem@fixitnow.test", phone: "01711000019", trade: "Carpentry", areaNames: ["Badda", "Merul Badda", "Hatirjheel", "Rampura"], visitFee: 190, experienceYrs: 11, jobsCompleted: 455, ratingAvg: 4.8, online: true, verified: true, bio: "Custom woodwork and kitchen cabinet repairs.", categorySlugs: ["carpentry"], skills: ["Cabinet", "Door", "Wardrobe"] },
  { name: "Shila Begum", email: "shila@fixitnow.test", phone: "01711000020", trade: "Pest Control", areaNames: ["Uttara Sector 7", "Joar Sahara", "Nikunja", "Khilkhet"], visitFee: 210, experienceYrs: 8, jobsCompleted: 300, ratingAvg: 4.6, online: true, verified: true, bio: "Family-safe pest control for Uttara residences.", categorySlugs: ["pest-control"], skills: ["Gel treatment", "Termite", "Mosquito"] },
];

const SLOT_TIMES = [
  { startTime: "09:00 AM", endTime: "11:00 AM" },
  { startTime: "11:00 AM", endTime: "01:00 PM" },
  { startTime: "02:00 PM", endTime: "04:00 PM" },
  { startTime: "04:00 PM", endTime: "06:00 PM" },
] as const;

const REVIEW_BODIES = [
  "On-time, polite, and fixed the issue in one visit. Highly recommended!",
  "Great workmanship. Cleaned up after the job. Will book again.",
  "Fair price and clear communication throughout.",
  "Resolved an emergency quickly. Very professional.",
  "Excellent service — explained everything before starting.",
  "Good quality work. Arrived a bit late but finished perfectly.",
  "Friendly technician and solid result. 5 stars.",
  "Dhaka traffic delay aside, the repair was top notch.",
];

async function upsertUser(input: {
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "CUSTOMER" | "TECHNICIAN";
  passwordHash: string;
  profileImage: string;
}) {
  const initials = initialsOf(input.name);

  // Phone is unique — free it if another account currently owns it
  const phoneOwner = await prisma.user.findUnique({
    where: { phone: input.phone },
    select: { id: true, email: true },
  });
  if (phoneOwner && phoneOwner.email !== input.email) {
    await prisma.user.update({
      where: { id: phoneOwner.id },
      data: { phone: null },
    });
  }

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      phone: input.phone,
      passwordHash: input.passwordHash,
      role: input.role,
      initials,
      profileImage: input.profileImage,
      isActive: true,
    },
    create: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: input.passwordHash,
      role: input.role,
      initials,
      profileImage: input.profileImage,
      isActive: true,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("password123@#", 12);
  let portraitIdx = 0;
  const nextPortrait = () => PORTRAITS[portraitIdx++ % PORTRAITS.length];

  console.log("Seeding FixItNow demo data…");

  const keepEmails = new Set<string>([
    ...ADMINS.map((u) => u.email),
    ...CUSTOMERS.map((u) => u.email),
    ...TECHNICIANS.map((u) => u.email),
  ]);

  // Remove leftover demo users from older seeds (keeps this seed set clean)
  const staleUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: "@fixitnow.test" } },
        { email: { notIn: [...keepEmails] }, role: { in: ["CUSTOMER", "TECHNICIAN"] } },
      ],
      NOT: { email: { in: [...keepEmails] } },
    },
    select: { id: true, email: true },
  });
  if (staleUsers.length > 0) {
    const staleIds = staleUsers.map((u) => u.id);
    await prisma.review.deleteMany({ where: { authorId: { in: staleIds } } });
    await prisma.payment.deleteMany({ where: { userId: { in: staleIds } } });
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { customerId: { in: staleIds } },
          { technician: { userId: { in: staleIds } } },
        ],
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: staleIds } } });
    console.log(`  Cleared ${staleUsers.length} stale demo users`);
  }

  // Extra admins not in the 5-admin set (keep only seeded admins)
  await prisma.user.deleteMany({
    where: {
      role: "ADMIN",
      email: { notIn: [...ADMINS.map((u) => u.email)] },
    },
  });

  // ── 1. Admins (5) ─────────────────────────────────────────
  for (const admin of ADMINS) {
    await upsertUser({
      ...admin,
      role: "ADMIN",
      passwordHash,
      profileImage: nextPortrait(),
    });
  }

  // ── 2. Customers (10) ─────────────────────────────────────
  const customerUsers = [];
  for (const customer of CUSTOMERS) {
    customerUsers.push(
      await upsertUser({
        ...customer,
        role: "CUSTOMER",
        passwordHash,
        profileImage: nextPortrait(),
      })
    );
  }

  // ── 3. Areas (entire Dhaka) ───────────────────────────────
  const areaByName = new Map<string, string>();
  for (const name of AREA_NAMES) {
    const area = await prisma.area.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    areaByName.set(name, area.id);
  }

  // ── 4. Categories (12) ────────────────────────────────────
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

  // ── 5. Services (36+) ─────────────────────────────────────
  const serviceByTitle = new Map<string, { id: string; price: number; categoryId: string }>();
  for (let i = 0; i < SERVICES.length; i++) {
    const svc = SERVICES[i]!;
    const categoryId = categoryBySlug.get(svc.categorySlug);
    if (!categoryId) throw new Error(`Missing category: ${svc.categorySlug}`);

    const image = SERVICE_IMAGES[i % SERVICE_IMAGES.length];
    const existing = await prisma.service.findFirst({ where: { title: svc.title } });
    const data = {
      categoryId,
      title: svc.title,
      description: svc.description,
      image,
      price: svc.price,
      duration: svc.duration,
      tag: svc.tag,
      isFeatured: svc.isFeatured,
      sortOrder: svc.sortOrder,
      ratingAvg: svc.ratingAvg,
      reviewCount: svc.reviewCount,
      isActive: true,
    };

    const service = existing
      ? await prisma.service.update({ where: { id: existing.id }, data })
      : await prisma.service.create({ data });

    serviceByTitle.set(service.title, {
      id: service.id,
      price: service.price,
      categoryId: service.categoryId,
    });
  }

  // ── 6. Technicians (20) ───────────────────────────────────
  const techProfiles: {
    profileId: string;
    userId: string;
    visitFee: number;
    categorySlugs: string[];
  }[] = [];

  for (const tech of TECHNICIANS) {
    const areaIds = tech.areaNames.map((name) => {
      const id = areaByName.get(name);
      if (!id) throw new Error(`Missing area: ${name}`);
      return id;
    });

    const user = await upsertUser({
      name: tech.name,
      email: tech.email,
      phone: tech.phone,
      role: "TECHNICIAN",
      passwordHash,
      profileImage: nextPortrait(),
    });

    const initials = initialsOf(tech.name);
    const profileData = {
      trade: tech.trade,
      bio: tech.bio,
      initials,
      visitFee: tech.visitFee,
      experienceYrs: tech.experienceYrs,
      jobsCompleted: tech.jobsCompleted,
      ratingAvg: tech.ratingAvg,
      reviewCount: Math.max(5, Math.floor(tech.jobsCompleted / 8)),
      online: tech.online,
      verified: tech.verified,
      coverKm: 4 + (tech.experienceYrs % 5),
      replyMins: 5 + (tech.experienceYrs % 10),
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
          data: { userId: user.id, ...profileData },
        });

    await prisma.technicianArea.deleteMany({ where: { technicianId: profile.id } });
    await prisma.technicianArea.createMany({
      data: areaIds.map((areaId) => ({ technicianId: profile.id, areaId })),
    });

    for (const categorySlug of tech.categorySlugs) {
      const categoryId = categoryBySlug.get(categorySlug);
      if (!categoryId) throw new Error(`Missing category for tech: ${categorySlug}`);
      await prisma.technicianCategory.upsert({
        where: {
          technicianId_categoryId: { technicianId: profile.id, categoryId },
        },
        update: {},
        create: { technicianId: profile.id, categoryId },
      });
    }

    for (const skillName of tech.skills) {
      await prisma.technicianSkill.upsert({
        where: {
          technicianId_name: { technicianId: profile.id, name: skillName },
        },
        update: {},
        create: { technicianId: profile.id, name: skillName },
      });
    }

    // Availability: next 10 days (bulk insert)
    const slotRows: {
      technicianId: string;
      date: Date;
      startTime: string;
      endTime: string;
      isBooked: boolean;
    }[] = [];
    for (let day = 0; day < 10; day++) {
      const date = dateOnly(day);
      const slotsForDay = SLOT_TIMES.slice(0, day % 2 === 0 ? 4 : 3);
      for (const slot of slotsForDay) {
        slotRows.push({
          technicianId: profile.id,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: false,
        });
      }
    }
    await prisma.availabilitySlot.createMany({
      data: slotRows,
      skipDuplicates: true,
    });

    techProfiles.push({
      profileId: profile.id,
      userId: user.id,
      visitFee: tech.visitFee,
      categorySlugs: tech.categorySlugs,
    });
  }

  // ── 7. Bookings + payments + reviews ──────────────────────
  const serviceList = [...serviceByTitle.values()];
  const bookingSpecs: {
    refCode: string;
    status: BookingStatus;
    customerIdx: number;
    techIdx: number;
    serviceIdx: number;
    daysOffset: number;
    notes: string;
    payment?: { method: PaymentMethod; status: PaymentStatus };
    review?: { rating: number; body: string; target: "SERVICE" | "TECHNICIAN" };
  }[] = [
    { refCode: "FIX-1001", status: "COMPLETED", customerIdx: 0, techIdx: 0, serviceIdx: 0, daysOffset: -12, notes: "Kitchen tap dripping constantly", payment: { method: "BKASH", status: "SUCCESS" }, review: { rating: 5, body: REVIEW_BODIES[0]!, target: "TECHNICIAN" } },
    { refCode: "FIX-1002", status: "COMPLETED", customerIdx: 1, techIdx: 2, serviceIdx: 6, daysOffset: -10, notes: "AC not cooling well", payment: { method: "CARD", status: "SUCCESS" }, review: { rating: 5, body: REVIEW_BODIES[1]!, target: "SERVICE" } },
    { refCode: "FIX-1003", status: "COMPLETED", customerIdx: 2, techIdx: 3, serviceIdx: 9, daysOffset: -9, notes: "Deep clean before guests", payment: { method: "NAGAD", status: "SUCCESS" }, review: { rating: 4, body: REVIEW_BODIES[2]!, target: "TECHNICIAN" } },
    { refCode: "FIX-1004", status: "COMPLETED", customerIdx: 3, techIdx: 6, serviceIdx: 18, daysOffset: -8, notes: "Fridge warm", payment: { method: "BKASH", status: "SUCCESS" }, review: { rating: 4, body: REVIEW_BODIES[3]!, target: "SERVICE" } },
    { refCode: "FIX-1005", status: "COMPLETED", customerIdx: 4, techIdx: 7, serviceIdx: 21, daysOffset: -7, notes: "Cockroach issue in kitchen", payment: { method: "CARD", status: "SUCCESS" }, review: { rating: 5, body: REVIEW_BODIES[4]!, target: "TECHNICIAN" } },
    { refCode: "FIX-1006", status: "COMPLETED", customerIdx: 5, techIdx: 5, serviceIdx: 15, daysOffset: -6, notes: "Main door lock stuck", payment: { method: "NAGAD", status: "SUCCESS" }, review: { rating: 5, body: REVIEW_BODIES[5]!, target: "TECHNICIAN" } },
    { refCode: "FIX-1007", status: "PAID", customerIdx: 6, techIdx: 1, serviceIdx: 3, daysOffset: 1, notes: "Install 2 ceiling fans", payment: { method: "BKASH", status: "SUCCESS" } },
    { refCode: "FIX-1008", status: "PAID", customerIdx: 7, techIdx: 15, serviceIdx: 33, daysOffset: 2, notes: "2 camera CCTV for shop", payment: { method: "CARD", status: "SUCCESS" } },
    { refCode: "FIX-1009", status: "ACCEPTED", customerIdx: 8, techIdx: 4, serviceIdx: 12, daysOffset: 3, notes: "Paint guest bedroom" },
    { refCode: "FIX-1010", status: "ACCEPTED", customerIdx: 9, techIdx: 11, serviceIdx: 10, daysOffset: 2, notes: "Sofa steam clean" },
    { refCode: "FIX-1011", status: "REQUESTED", customerIdx: 0, techIdx: 8, serviceIdx: 1, daysOffset: 4, notes: "Bathroom pipe leak emergency" },
    { refCode: "FIX-1012", status: "REQUESTED", customerIdx: 1, techIdx: 12, serviceIdx: 24, daysOffset: 5, notes: "Moving 1BHK to Uttara" },
    { refCode: "FIX-1013", status: "EN_ROUTE", customerIdx: 2, techIdx: 9, serviceIdx: 4, daysOffset: 0, notes: "MCB keep tripping", payment: { method: "NAGAD", status: "SUCCESS" } },
    { refCode: "FIX-1014", status: "ON_SITE", customerIdx: 3, techIdx: 14, serviceIdx: 30, daysOffset: 0, notes: "Roof leak after rain", payment: { method: "CARD", status: "SUCCESS" } },
    { refCode: "FIX-1015", status: "DECLINED", customerIdx: 4, techIdx: 16, serviceIdx: 19, daysOffset: -2, notes: "Washer not spinning" },
    { refCode: "FIX-1016", status: "CANCELLED", customerIdx: 5, techIdx: 13, serviceIdx: 27, daysOffset: -3, notes: "Balcony garden — cancelled by customer", payment: { method: "BKASH", status: "REFUNDED" } },
    { refCode: "FIX-1017", status: "COMPLETED", customerIdx: 6, techIdx: 18, serviceIdx: 16, daysOffset: -14, notes: "TV shelf install", payment: { method: "CARD", status: "SUCCESS" }, review: { rating: 5, body: REVIEW_BODIES[6]!, target: "TECHNICIAN" } },
    { refCode: "FIX-1018", status: "COMPLETED", customerIdx: 7, techIdx: 19, serviceIdx: 22, daysOffset: -11, notes: "Termite check", payment: { method: "NAGAD", status: "SUCCESS" }, review: { rating: 4, body: REVIEW_BODIES[7]!, target: "SERVICE" } },
  ];

  for (const spec of bookingSpecs) {
    const customer = customerUsers[spec.customerIdx]!;
    const tech = techProfiles[spec.techIdx]!;
    const service = serviceList[spec.serviceIdx]!;
    const visitFee = tech.visitFee;
    const servicePrice = service.price;
    const totalAmount = servicePrice + visitFee;
    const scheduledAt = dateOnly(spec.daysOffset);
    const slotLabel = `${scheduledAt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · 10 AM`;

    const requestedAt = daysAgo(Math.abs(spec.daysOffset) + 2);
    const acceptedAt =
      spec.status !== "REQUESTED" && spec.status !== "DECLINED" && spec.status !== "CANCELLED"
        ? daysAgo(Math.abs(spec.daysOffset) + 1)
        : undefined;
    const paidAt =
      spec.payment?.status === "SUCCESS" ||
      ["PAID", "EN_ROUTE", "ON_SITE", "COMPLETED"].includes(spec.status)
        ? daysAgo(Math.max(0, Math.abs(spec.daysOffset)))
        : undefined;
    const completedAt = spec.status === "COMPLETED" ? daysAgo(Math.max(0, -spec.daysOffset)) : undefined;
    const declinedAt = spec.status === "DECLINED" ? daysAgo(1) : undefined;
    const cancelledAt = spec.status === "CANCELLED" ? daysAgo(2) : undefined;

    const booking = await prisma.booking.upsert({
      where: { refCode: spec.refCode },
      update: {
        customerId: customer.id,
        technicianId: tech.profileId,
        serviceId: service.id,
        status: spec.status,
        scheduledAt,
        slotLabel,
        servicePrice,
        visitFee,
        totalAmount,
        notes: spec.notes,
        requestedAt,
        acceptedAt: acceptedAt ?? null,
        declinedAt: declinedAt ?? null,
        paidAt: paidAt ?? null,
        completedAt: completedAt ?? null,
        cancelledAt: cancelledAt ?? null,
      },
      create: {
        refCode: spec.refCode,
        customerId: customer.id,
        technicianId: tech.profileId,
        serviceId: service.id,
        status: spec.status,
        scheduledAt,
        slotLabel,
        servicePrice,
        visitFee,
        totalAmount,
        notes: spec.notes,
        requestedAt,
        acceptedAt,
        declinedAt,
        paidAt,
        completedAt,
        cancelledAt,
      },
    });

    if (spec.payment) {
      await prisma.payment.upsert({
        where: { bookingId: booking.id },
        update: {
          userId: customer.id,
          amount: totalAmount,
          method: spec.payment.method,
          status: spec.payment.status,
          providerTxnId: `SP-SEED-${spec.refCode}`,
          paidAt: spec.payment.status === "SUCCESS" ? paidAt ?? new Date() : null,
          failedAt: spec.payment.status === "FAILED" ? new Date() : null,
        },
        create: {
          bookingId: booking.id,
          userId: customer.id,
          amount: totalAmount,
          method: spec.payment.method,
          status: spec.payment.status,
          providerTxnId: `SP-SEED-${spec.refCode}`,
          paidAt: spec.payment.status === "SUCCESS" ? paidAt ?? new Date() : null,
        },
      });
    }

    if (spec.review && spec.status === "COMPLETED") {
      const existingReview = await prisma.review.findUnique({
        where: { bookingId: booking.id },
      });

      const reviewData = {
        authorId: customer.id,
        authorName: customer.name,
        authorInitials: customer.initials || initialsOf(customer.name),
        rating: spec.review.rating,
        body: spec.review.body,
        target: spec.review.target,
        serviceId: service.id,
        technicianId: tech.profileId,
        bookingId: booking.id,
      };

      if (existingReview) {
        await prisma.review.update({ where: { id: existingReview.id }, data: reviewData });
      } else {
        await prisma.review.create({ data: reviewData });
      }
    }
  }

  // Refresh category jobsDone from completed bookings
  for (const [slug, categoryId] of categoryBySlug) {
    const completed = await prisma.booking.count({
      where: {
        status: "COMPLETED",
        service: { categoryId },
      },
    });
    await prisma.category.update({
      where: { id: categoryId },
      data: { jobsDone: completed * 12 + 20 },
    });
    void slug;
  }

  // ── Summary ───────────────────────────────────────────────
  const [
    areas,
    categories,
    services,
    users,
    admins,
    customers,
    techs,
    skills,
    techCats,
    techAreas,
    slots,
    bookings,
    payments,
    reviews,
  ] = await Promise.all([
    prisma.area.count(),
    prisma.category.count(),
    prisma.service.count(),
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.technicianProfile.count(),
    prisma.technicianSkill.count(),
    prisma.technicianCategory.count(),
    prisma.technicianArea.count(),
    prisma.availabilitySlot.count(),
    prisma.booking.count(),
    prisma.payment.count(),
    prisma.review.count(),
  ]);

  console.log("Seed complete:");
  console.log(`  Areas:               ${areas}`);
  console.log(`  Categories:          ${categories}`);
  console.log(`  Services:            ${services}`);
  console.log(`  Users:               ${users} (admin ${admins}, customer ${customers}, tech users ${techs})`);
  console.log(`  Technician profiles: ${techs}`);
  console.log(`  Tech areas links:    ${techAreas}`);
  console.log(`  Technician skills:   ${skills}`);
  console.log(`  Technician cats:     ${techCats}`);
  console.log(`  Availability slots:  ${slots}`);
  console.log(`  Bookings:            ${bookings}`);
  console.log(`  Payments:            ${payments}`);
  console.log(`  Reviews:             ${reviews}`);
  console.log("Login password for all seeded users: password123@#");
  console.log("  Admin:    mdparvej@gmail.com");
  console.log("  Customer: ayesha.customer@fixitnow.test");
  console.log("  Tech:     rakib@fixitnow.test");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
