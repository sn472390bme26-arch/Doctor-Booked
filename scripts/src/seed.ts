import { db } from "@workspace/db";
import {
  usersTable,
  hospitalsTable,
  doctorsTable,
  sessionsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  const existingHospitals = await db.select().from(hospitalsTable).limit(1);
  if (existingHospitals.length > 0) {
    console.log("Data already seeded, skipping.");
    process.exit(0);
  }

  const [h1] = await db.insert(hospitalsTable).values({
    name: "Apollo Medical Centre",
    location: "Chennai",
    address: "21 Greams Lane, Thousand Lights, Chennai - 600006",
    phone: "+91 44 2829 0200",
    imageUrl: "/images/hospital-placeholder.png",
    specialties: ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Dermatology"],
  }).returning();

  const [h2] = await db.insert(hospitalsTable).values({
    name: "Fortis Healthcare",
    location: "Bangalore",
    address: "154/9 Bannerghatta Road, Bangalore - 560076",
    phone: "+91 80 6621 4444",
    imageUrl: "/images/hospital-placeholder.png",
    specialties: ["Oncology", "Cardiology", "Physiotherapy", "Dermatology", "ENT"],
  }).returning();

  const [h3] = await db.insert(hospitalsTable).values({
    name: "AIIMS Delhi",
    location: "New Delhi",
    address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi - 110029",
    phone: "+91 11 2658 8500",
    imageUrl: "/images/hospital-placeholder.png",
    specialties: ["General Medicine", "Surgery", "Pediatrics", "Orthopedics", "Psychiatry"],
  }).returning();

  const [h4] = await db.insert(hospitalsTable).values({
    name: "Manipal Hospitals",
    location: "Hyderabad",
    address: "5-9-22 Secretariat Road, Hyderabad - 500063",
    phone: "+91 40 4024 4424",
    imageUrl: "/images/hospital-placeholder.png",
    specialties: ["Cardiology", "Neurology", "Orthopedics", "Nephrology", "Gastroenterology"],
  }).returning();

  const [u1] = await db.insert(usersTable).values({ name: "Dr. Ramesh Kumar", email: "dr.ramesh@apollo.com", role: "doctor" }).returning();
  const [u2] = await db.insert(usersTable).values({ name: "Dr. Priya Nair", email: "dr.priya@apollo.com", role: "doctor" }).returning();
  const [u3] = await db.insert(usersTable).values({ name: "Dr. Arjun Singh", email: "dr.arjun@fortis.com", role: "doctor" }).returning();
  const [u4] = await db.insert(usersTable).values({ name: "Dr. Sneha Mehta", email: "dr.sneha@aiims.com", role: "doctor" }).returning();
  const [u5] = await db.insert(usersTable).values({ name: "Dr. Vikram Rao", email: "dr.vikram@manipal.com", role: "doctor" }).returning();
  const [u6] = await db.insert(usersTable).values({ name: "Dr. Lakshmi Devi", email: "dr.lakshmi@apollo.com", role: "doctor" }).returning();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const day3 = new Date();
  day3.setDate(day3.getDate() + 3);

  const fmtDate = (d: Date) => d.toISOString().split("T")[0];

  const sessionTypes = [
    { type: "morning", startTime: "09:00", endTime: "12:00", isActive: true },
    { type: "afternoon", startTime: "14:00", endTime: "17:00", isActive: true },
    { type: "evening", startTime: "18:00", endTime: "20:00", isActive: true },
  ];

  const [d1] = await db.insert(doctorsTable).values({
    userId: u1.id,
    hospitalId: h1.id,
    name: "Dr. Ramesh Kumar",
    specialty: "Cardiology",
    photoUrl: "/images/doctor-placeholder.png",
    bio: "15+ years experience in interventional cardiology. MBBS, MD, DM Cardiology from AIIMS.",
    consultationFee: "600",
    tokensPerSession: 20,
    sessionTypes,
    loginCode: "DOC001",
    isAvailable: true,
  }).returning();

  const [d2] = await db.insert(doctorsTable).values({
    userId: u2.id,
    hospitalId: h1.id,
    name: "Dr. Priya Nair",
    specialty: "Pediatrics",
    photoUrl: "/images/doctor-placeholder.png",
    bio: "Child specialist with 10 years experience. MBBS, MD Pediatrics, Fellowship in Neonatology.",
    consultationFee: "500",
    tokensPerSession: 25,
    sessionTypes: [
      { type: "morning", startTime: "09:00", endTime: "13:00", isActive: true },
      { type: "evening", startTime: "17:00", endTime: "20:00", isActive: true },
    ],
    loginCode: "DOC002",
    isAvailable: true,
  }).returning();

  const [d3] = await db.insert(doctorsTable).values({
    userId: u3.id,
    hospitalId: h2.id,
    name: "Dr. Arjun Singh",
    specialty: "Physiotherapy",
    photoUrl: "/images/doctor-placeholder.png",
    bio: "Sports medicine & rehabilitation specialist. 12 years experience treating athletes and post-surgery patients.",
    consultationFee: "400",
    tokensPerSession: 15,
    sessionTypes: [
      { type: "morning", startTime: "08:00", endTime: "11:00", isActive: true },
      { type: "afternoon", startTime: "15:00", endTime: "18:00", isActive: true },
    ],
    loginCode: "DOC003",
    isAvailable: true,
  }).returning();

  const [d4] = await db.insert(doctorsTable).values({
    userId: u4.id,
    hospitalId: h3.id,
    name: "Dr. Sneha Mehta",
    specialty: "Dermatology",
    photoUrl: "/images/doctor-placeholder.png",
    bio: "Skin care expert and cosmetologist. MBBS, MD Dermatology. Specialises in acne, psoriasis, and cosmetic procedures.",
    consultationFee: "700",
    tokensPerSession: 20,
    sessionTypes: [
      { type: "afternoon", startTime: "13:00", endTime: "17:00", isActive: true },
    ],
    loginCode: "DOC004",
    isAvailable: true,
  }).returning();

  const [d5] = await db.insert(doctorsTable).values({
    userId: u5.id,
    hospitalId: h4.id,
    name: "Dr. Vikram Rao",
    specialty: "Neurology",
    photoUrl: "/images/doctor-placeholder.png",
    bio: "Neurologist with expertise in stroke, epilepsy and movement disorders. 18 years clinical experience.",
    consultationFee: "800",
    tokensPerSession: 15,
    sessionTypes: [
      { type: "morning", startTime: "10:00", endTime: "13:00", isActive: true },
      { type: "evening", startTime: "18:00", endTime: "20:00", isActive: true },
    ],
    loginCode: "DOC005",
    isAvailable: true,
  }).returning();

  const [d6] = await db.insert(doctorsTable).values({
    userId: u6.id,
    hospitalId: h1.id,
    name: "Dr. Lakshmi Devi",
    specialty: "Orthopedics",
    photoUrl: "/images/doctor-placeholder.png",
    bio: "Orthopedic surgeon specializing in joint replacement and spine surgery. MBBS, MS Ortho, Fellowship UK.",
    consultationFee: "750",
    tokensPerSession: 18,
    sessionTypes,
    loginCode: "DOC006",
    isAvailable: true,
  }).returning();

  await db.insert(sessionsTable).values([
    {
      doctorId: d1.id, date: fmtDate(tomorrow), sessionType: "morning",
      startTime: "09:00", endTime: "12:00", totalTokens: 20, bookedTokens: 4, status: "upcoming",
    },
    {
      doctorId: d1.id, date: fmtDate(tomorrow), sessionType: "afternoon",
      startTime: "14:00", endTime: "17:00", totalTokens: 20, bookedTokens: 0, status: "upcoming",
    },
    {
      doctorId: d2.id, date: fmtDate(tomorrow), sessionType: "morning",
      startTime: "09:00", endTime: "13:00", totalTokens: 25, bookedTokens: 10, status: "upcoming",
    },
    {
      doctorId: d3.id, date: fmtDate(dayAfter), sessionType: "morning",
      startTime: "08:00", endTime: "11:00", totalTokens: 15, bookedTokens: 3, status: "upcoming",
    },
    {
      doctorId: d4.id, date: fmtDate(dayAfter), sessionType: "afternoon",
      startTime: "13:00", endTime: "17:00", totalTokens: 20, bookedTokens: 7, status: "upcoming",
    },
    {
      doctorId: d5.id, date: fmtDate(day3), sessionType: "morning",
      startTime: "10:00", endTime: "13:00", totalTokens: 15, bookedTokens: 2, status: "upcoming",
    },
    {
      doctorId: d6.id, date: fmtDate(tomorrow), sessionType: "evening",
      startTime: "18:00", endTime: "20:00", totalTokens: 18, bookedTokens: 5, status: "upcoming",
    },
  ]);

  console.log("Seeding complete!");
  console.log("Doctor Login Codes:");
  console.log("  Dr. Ramesh Kumar (Cardiology): DOC001");
  console.log("  Dr. Priya Nair (Pediatrics):   DOC002");
  console.log("  Dr. Arjun Singh (Physio):      DOC003");
  console.log("  Dr. Sneha Mehta (Dermatology): DOC004");
  console.log("  Dr. Vikram Rao (Neurology):    DOC005");
  console.log("  Dr. Lakshmi Devi (Ortho):      DOC006");
  process.exit(0);
}

seed().catch(e => {
  console.error("Seed failed:", e);
  process.exit(1);
});
