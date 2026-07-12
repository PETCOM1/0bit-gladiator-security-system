/**
 * Realistic South African demo-data seeder for Gladiator Pro.
 *
 * Pure data population — no schema changes. Safe to run against an
 * already-migrated database (production included). Re-running is NOT
 * idempotent: it always creates new rows, so only run this once against
 * a freshly flushed database, or you'll get duplicate companies.
 *
 * Usage (from packages/database):
 *   DATABASE_URL="<production connection string>" npx tsx prisma/seed-demo.ts
 */
import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";

// ── RNG helpers ──────────────────────────────────────────────────────────────
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)];
const pickN = <T,>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  return out;
};
const chance = (pct: number) => Math.random() * 100 < pct;
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
const daysAgo = (n: number, hour = 8, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, min, 0, 0);
  return d;
};

// ── Name pools ───────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Sipho", "Thabo", "Sibusiso", "Themba", "Kabelo", "Mpho", "Neo", "Karabo",
  "Bongani", "Musa", "Vusi", "Nkosinathi", "Sandile", "Lethabo", "Lesego",
  "Lebogang", "Tshepo", "Tebogo", "Kgosi", "Bheki", "Zanele", "Nomsa",
  "Nokuthula", "Busisiwe", "Ayanda", "Lerato", "Boitumelo", "Nompumelelo",
  "Khensani", "Rhandzu", "Mulalo", "Tshilidzi", "Lutendo", "Vhutshilo",
  "Rendani", "Ndivhuwo", "Fulufhelo", "Takalani", "Sizwe", "Mandla", "Sfiso",
  "Ntokozo", "Xolani", "Mzwandile", "Zola", "Andile", "Thandeka", "Palesa",
  "Refilwe", "Dineo", "Naledi", "Nthabiseng", "Precious", "Portia", "Zodwa",
];

const SURNAMES = [
  // Zulu / Xhosa / Ndebele
  "Ndlovu", "Dlamini", "Khumalo", "Mokoena", "Zulu", "Nkosi", "Mahlangu",
  "Sithole", "Mthembu", "Ngcobo", "Zwane", "Radebe", "Cele", "Buthelezi",
  "Mabaso", "Mchunu", "Gumede", "Shabalala",
  // Sotho / Tswana / Pedi
  "Mokoena", "Molefe", "Sebe", "Motaung", "Tshabalala", "Mofokeng", "Sekhukhune",
  "Mahamba", "Ramaboea", "Kekana", "Maluleke", "Mabelane", "Setshedi",
  // Venda
  "Munyai", "Ravele", "Nemakonde", "Mudau", "Netshitenzhe", "Tshivhase",
  "Mulaudzi", "Sikhwari", "Rambau", "Nemudzivhadi",
  // Tsonga
  "Baloyi", "Chauke", "Ngobeni", "Mathebula", "Shirindza", "Rikhotso", "Hlungwani",
  // Xhosa
  "Mahlati", "Mbeki", "Sisulu", "Ngwenya", "Mgidlana", "Qwabe", "Tolashe",
];

const COMPANY_DOMAINS: Record<string, string> = {
  "Fidelity ADT": "fidelityadt.co.za",
  "G4S South Africa": "g4s.co.za",
  "Bidvest Protea Coin": "proteacoin.co.za",
  "TSU Protection Services": "tsuprotection.co.za",
  "Mafoko Security Patrols": "mafokosecurity.co.za",
  "SBV Services": "sbv.co.za",
  "Blue Security": "bluesecurity.co.za",
  "CPS Security": "cpssecurity.co.za",
  "TRSS Security": "trss.co.za",
  "AM Security Services": "amsecurity.co.za",
};
const COMPANY_NAMES = Object.keys(COMPANY_DOMAINS);

const PROVINCES: Record<string, string[]> = {
  Gauteng: ["Johannesburg", "Pretoria", "Sandton", "Midrand", "Centurion"],
  "Western Cape": ["Cape Town", "Stellenbosch", "Bellville", "George"],
  "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Umhlanga", "Richards Bay"],
  Limpopo: ["Polokwane", "Tzaneen", "Mokopane"],
  Mpumalanga: ["Mbombela", "eMalahleni", "Secunda"],
  "Eastern Cape": ["Gqeberha", "East London", "Mthatha"],
  "North West": ["Rustenburg", "Mahikeng", "Klerksdorp"],
  "Free State": ["Bloemfontein", "Welkom", "Bethlehem"],
  "Northern Cape": ["Kimberley", "Upington"],
};
const PROVINCE_NAMES = Object.keys(PROVINCES);
const STREET_NAMES = [
  "Voortrekker", "Church", "Main", "Nelson Mandela", "Jan Smuts", "Oxford",
  "Bram Fischer", "Malibongwe", "Beyers Naude", "Rivonia", "Louis Botha",
  "OR Tambo", "Steve Biko", "Chris Hani", "Anton Lembede",
];

const SITE_TYPES = [
  "Head Office", "Distribution Centre", "Warehouse", "Shopping Centre",
  "Office Park", "Industrial Site", "Residential Estate", "Mining Site",
];
const POST_TYPES = [
  "Main Gate", "Reception", "Patrol Route A", "Patrol Route B",
  "Parking Entrance", "Control Room", "Loading Bay", "Warehouse Entrance",
  "Perimeter Patrol", "Visitor Entrance",
];

const INCIDENT_CATEGORIES = [
  "Unauthorized Access", "Theft/Burglary", "Vandalism", "Suspicious Activity",
  "Fire/Hazard", "Medical Emergency", "Equipment Fault", "Policy Violation",
];
const INCIDENT_TEMPLATES: Record<string, string[]> = {
  "Unauthorized Access": ["Trespassing", "Access Control Violation", "Tailgating at main gate"],
  "Theft/Burglary": ["Theft of equipment", "Attempted burglary", "Stock loss reported"],
  Vandalism: ["Property damage to perimeter fence", "Graffiti on premises"],
  "Suspicious Activity": ["Suspicious individual loitering", "Unattended vehicle reported"],
  "Fire/Hazard": ["Fire alarm activated", "Gas smell reported", "Electrical hazard"],
  "Medical Emergency": ["Medical emergency on site", "Injury reported"],
  "Equipment Fault": ["Gate malfunction reported", "CCTV outage", "Alarm system fault"],
  "Policy Violation": ["Guard found off-post", "Unauthorized break"],
};

const OB_CATEGORIES = ["ROUTINE", "HANDOVER", "PATROL", "VISITOR", "MAINTENANCE", "SECURITY"];
const OB_ENTRIES: Record<string, string[]> = {
  ROUTINE: ["Perimeter patrol completed without incident.", "Shift commenced, all posts checked."],
  HANDOVER: ["Shift handover completed. No outstanding issues.", "Handed over to relief guard, briefed on site status."],
  PATROL: ["Patrol completed without incident.", "Patrol route A checked, all clear."],
  VISITOR: ["Visitor escorted to reception.", "Delivery vehicle inspected and logged."],
  MAINTENANCE: ["Gate malfunction reported to facilities.", "Faulty CCTV camera logged for repair."],
  SECURITY: ["Alarm activated and investigated — false trigger.", "Vehicle inspection completed at main gate."],
};

const AUDIT_ACTIONS = [
  "EMPLOYEE_ADDED", "SITE_CREATED", "SITE_MANAGER_ASSIGNED", "SHIFT_PUBLISHED",
  "VISITOR_REGISTERED", "INCIDENT_REPORTED", "PERSONNEL_UPDATED",
  "ATTENDANCE_RECORDED", "LOGIN",
];

// ── Late/overtime thresholds — match the site-manager analytics definitions ──
const LATE_MS = 10 * 60 * 1000;
const OVERTIME_MS = 15 * 60 * 1000;

const usedNames = new Set<string>();
function uniqueName(): { firstName: string; lastName: string } {
  for (let i = 0; i < 50; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(SURNAMES);
    const key = `${firstName} ${lastName}`;
    if (!usedNames.has(key)) {
      usedNames.add(key);
      return { firstName, lastName };
    }
  }
  // Extremely unlikely fallback after 50 tries — append a number
  const firstName = pick(FIRST_NAMES);
  const lastName = `${pick(SURNAMES)}${randInt(2, 99)}`;
  return { firstName, lastName };
}

function emailFor(firstName: string, lastName: string, domain: string, usedEmails: Set<string>): string {
  const base = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, "");
  let email = `${base}@${domain}`;
  let n = 2;
  while (usedEmails.has(email)) {
    email = `${base}${n}@${domain}`;
    n++;
  }
  usedEmails.add(email);
  return email;
}

async function main() {
  console.log("Seeding realistic South African demo data for Gladiator Pro...\n");

  const password = await bcrypt.hash("Password@123", 12);

  // ── Subscription tiers ──────────────────────────────────────────────────
  const tierDefs = [
    { name: "Starter", price: 2999, maxUsers: 60, maxSites: 5 },
    { name: "Professional", price: 7999, maxUsers: 200, maxSites: 15 },
    { name: "Enterprise", price: 19999, maxUsers: 1000, maxSites: 50 },
  ];
  const tiers = [];
  for (const t of tierDefs) {
    tiers.push(await prisma.subscriptionTier.upsert({
      where: { name: t.name },
      update: {},
      create: { ...t, features: { description: `${t.name} plan` } },
    }));
  }

  const superAdmin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });

  let totals = {
    tenants: 0, users: 0, sites: 0, posts: 0, shiftTemplates: 0,
    shifts: 0, visitors: 0, occurrenceEntries: 0, incidents: 0, auditLogs: 0,
  };
  const credentialsSummary: Array<{ company: string; manager: string }> = [];

  for (const companyName of COMPANY_NAMES) {
    const domain = COMPANY_DOMAINS[companyName];
    const usedEmails = new Set<string>();
    const province = pick(PROVINCE_NAMES);
    const city = pick(PROVINCES[province]);
    const streetNum = randInt(1, 400);
    const postalCode = randInt(1, 9) * 1000 + randInt(0, 999);

    console.log(`\n[${companyName}]`);

    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        orgType: "Security Services",
        registrationNumber: `${randInt(2005, 2022)}/${String(randInt(100000, 999999))}/07`,
        physicalAddress: `${streetNum} ${pick(STREET_NAMES)} Street, ${city}, ${postalCode}`,
        countryRegion: `${province}, South Africa`,
        contactEmail: `info@${domain}`,
        contactPhone: `0${randInt(10, 87)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
        subscriptionTierId: pick(tiers).id,
        subscriptionStatus: "ACTIVE",
        allowedUsers: 500,
        createdById: superAdmin?.id,
        createdAt: daysAgo(randInt(180, 720)),
      },
    });
    totals.tenants++;

    // ── Manager ──────────────────────────────────────────────────────────
    const mgrName = uniqueName();
    const manager = await prisma.user.create({
      data: {
        email: emailFor(mgrName.firstName, mgrName.lastName, domain, usedEmails),
        password,
        role: "MANAGER",
        accountStatus: "ACTIVE",
        firstName: mgrName.firstName,
        lastName: mgrName.lastName,
        displayName: `${mgrName.firstName} ${mgrName.lastName}`,
        phone: `0${randInt(60, 84)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
        city, country: "South Africa",
        tenantId: tenant.id,
        createdAt: daysAgo(randInt(150, 700)),
      },
    });
    totals.users++;
    credentialsSummary.push({ company: companyName, manager: manager.email });

    // ── Sites ────────────────────────────────────────────────────────────
    const siteCount = randInt(4, 6);
    const siteTypes = pickN(SITE_TYPES, Math.min(siteCount, SITE_TYPES.length));
    while (siteTypes.length < siteCount) siteTypes.push(pick(SITE_TYPES));

    const sites = [];
    for (const type of siteTypes) {
      const siteCity = pick(PROVINCES[province]);
      const site = await prisma.site.create({
        data: {
          tenantId: tenant.id,
          name: `${companyName.split(" ")[0]} ${type}`,
          address: `${randInt(1, 300)} ${pick(STREET_NAMES)} Road, ${siteCity}`,
          createdAt: daysAgo(randInt(100, 600)),
        },
      });
      sites.push(site);
      totals.sites++;
    }

    // ── Site Managers (one per site, matching 3-6 band) ─────────────────
    const siteManagerCount = Math.min(Math.max(siteCount, 3), 6);
    const siteManagers = [];
    for (let i = 0; i < siteManagerCount; i++) {
      const n = uniqueName();
      const site = sites[i % sites.length];
      const sm = await prisma.user.create({
        data: {
          email: emailFor(n.firstName, n.lastName, domain, usedEmails),
          password,
          role: "SITE_MANAGER",
          accountStatus: "ACTIVE",
          firstName: n.firstName,
          lastName: n.lastName,
          displayName: `${n.firstName} ${n.lastName}`,
          phone: `0${randInt(60, 84)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
          city: pick(PROVINCES[province]), country: "South Africa",
          tenantId: tenant.id,
          siteId: site.id,
          createdAt: daysAgo(randInt(100, 650)),
        },
      });
      siteManagers.push(sm);
      totals.users++;
    }

    // ── Shift templates ──────────────────────────────────────────────────
    const templateDefs = [
      { name: "Day Shift", startTime: "07:00", endTime: "19:00", color: "#f59e0b" },
      { name: "Night Shift", startTime: "19:00", endTime: "07:00", color: "#6366f1" },
      { name: "Morning Shift", startTime: "06:00", endTime: "14:00", color: "#22c55e" },
      { name: "Afternoon Shift", startTime: "14:00", endTime: "22:00", color: "#3b82f6" },
      { name: "Patrol Shift", startTime: "08:00", endTime: "16:00", color: "#10b981" },
    ];
    await prisma.shiftTemplate.createMany({
      data: templateDefs.map(t => ({ ...t, tenantId: tenant.id })),
    });
    totals.shiftTemplates += templateDefs.length;

    // ── Posts per site ───────────────────────────────────────────────────
    const sitePosts: Record<string, any[]> = {};
    for (const site of sites) {
      const postCount = randInt(5, 7);
      const postNames = pickN(POST_TYPES, Math.min(postCount, POST_TYPES.length));
      while (postNames.length < postCount) postNames.push(pick(POST_TYPES));

      const created = await Promise.all(postNames.map(name =>
        prisma.post.create({ data: { tenantId: tenant.id, siteId: site.id, name } })
      ));
      sitePosts[site.id] = created;
      totals.posts += created.length;
    }

    // ── Guards (Site Supervisors folded in — no distinct role in schema) ─
    const guardCount = randInt(45, 70);
    const guards = [];
    for (let i = 0; i < guardCount; i++) {
      const n = uniqueName();
      const site = pick(sites);
      const post = pick(sitePosts[site.id]);
      const onLeave = chance(4);
      const status = chance(3) ? "PENDING" : "ACTIVE";
      const g = await prisma.user.create({
        data: {
          email: emailFor(n.firstName, n.lastName, domain, usedEmails),
          password,
          role: "GUARD",
          accountStatus: status,
          onLeave,
          firstName: n.firstName,
          lastName: n.lastName,
          displayName: `${n.firstName} ${n.lastName}`,
          phone: `0${randInt(60, 84)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
          city: pick(PROVINCES[province]), country: "South Africa",
          tenantId: tenant.id,
          siteId: site.id,
          postId: post.id,
          createdAt: daysAgo(randInt(20, 600)),
        },
      });
      guards.push({ ...g, siteId: site.id });
      totals.users++;
    }
    const guardsBySite: Record<string, typeof guards> = {};
    for (const site of sites) guardsBySite[site.id] = guards.filter(g => g.siteId === site.id);

    console.log(`  ${sites.length} sites, ${siteManagers.length} site managers, ${guardCount} guards, ${Object.values(sitePosts).flat().length} posts`);

    // ── Shifts: day+night coverage per post, last 30 days + next 7 ──────
    const shiftRows: any[] = [];
    for (const site of sites) {
      const siteGuards = guardsBySite[site.id];
      if (siteGuards.length === 0) continue;
      for (const post of sitePosts[site.id]) {
        for (let d = -30; d <= 7; d++) {
          const dayStart = daysAgo(-d, 0, 0);
          const isFuture = d > 0;
          for (const [label, startH, endH] of [["day", 7, 19], ["night", 19, 31]] as const) {
            const start = new Date(dayStart);
            start.setHours(startH % 24, 0, 0, 0);
            if (startH >= 24) start.setDate(start.getDate() + (d === -30 ? 0 : 0));
            const end = new Date(dayStart);
            end.setDate(end.getDate() + (endH >= 24 ? 1 : 0));
            end.setHours(endH % 24, 0, 0, 0);

            const vacant = chance(3);
            const guard = vacant ? null : pick(siteGuards);

            if (isFuture) {
              shiftRows.push({
                tenantId: tenant.id, siteId: site.id, postId: post.id,
                userId: guard?.id ?? null,
                startTime: start, endTime: end,
                status: chance(10) ? "DRAFT" : "SCHEDULED",
              });
            } else {
              const outcome = vacant ? "vacant" : chance(10) ? "absent" : chance(15) ? "late" : "onTime";
              if (outcome === "vacant" || outcome === "absent") {
                shiftRows.push({
                  tenantId: tenant.id, siteId: site.id, postId: post.id,
                  userId: guard?.id ?? null,
                  startTime: start, endTime: end,
                  status: "SCHEDULED",
                });
              } else {
                const lateMinutes = outcome === "late" ? randInt(11, 40) : randInt(0, 8);
                const actualStart = new Date(start.getTime() + lateMinutes * 60000);
                const overtimeMinutes = chance(12) ? randInt(16, 90) : randInt(0, 10);
                const actualEnd = new Date(end.getTime() + overtimeMinutes * 60000);
                shiftRows.push({
                  tenantId: tenant.id, siteId: site.id, postId: post.id,
                  userId: guard!.id,
                  startTime: start, endTime: end,
                  actualStartTime: actualStart, actualEndTime: actualEnd,
                  status: "COMPLETED",
                });
              }
            }
          }
        }
      }
    }
    for (const batch of chunk(shiftRows, 2000)) {
      await prisma.shift.createMany({ data: batch });
    }
    totals.shifts += shiftRows.length;

    // ── Visitors ──────────────────────────────────────────────────────────
    const visitorRows: any[] = [];
    const visitorFirstNames = FIRST_NAMES;
    for (const site of sites) {
      const siteGuards = guardsBySite[site.id];
      if (siteGuards.length === 0) continue;
      const count = randInt(15, 30);
      for (let i = 0; i < count; i++) {
        const n = uniqueName();
        const checkIn = daysAgo(randInt(0, 30), randInt(7, 17), randInt(0, 59));
        const checkedOut = chance(85);
        const checkOut = checkedOut
          ? new Date(checkIn.getTime() + randInt(20, 240) * 60000)
          : null;
        visitorRows.push({
          tenantId: tenant.id, siteId: site.id,
          loggedById: pick(siteGuards).id,
          name: `${n.firstName} ${n.lastName}`,
          company: chance(60) ? pick(["Transnet", "Eskom", "SAB", "Nedbank", "Shoprite Holdings", "Sasol", "MTN", "Vodacom", "Discovery", "Sanlam"]) : null,
          personVisiting: chance(70) ? `${pick(FIRST_NAMES)} ${pick(SURNAMES)}` : null,
          purpose: pick(["Delivery", "Meeting", "Maintenance", "Interview", "Contractor work", "Inspection"]),
          vehicleReg: chance(50) ? `${pick(["CA", "GP", "ND", "WP"])} ${randInt(100, 999)}-${randInt(100, 999)}` : null,
          status: checkedOut ? "CHECKED_OUT" : "CHECKED_IN",
          checkInTime: checkIn,
          checkOutTime: checkOut,
        });
      }
    }
    for (const batch of chunk(visitorRows, 2000)) {
      await prisma.visitor.createMany({ data: batch });
    }
    totals.visitors += visitorRows.length;

    // ── Occurrence Book ───────────────────────────────────────────────────
    const obRows: any[] = [];
    for (const site of sites) {
      const siteGuards = guardsBySite[site.id];
      if (siteGuards.length === 0) continue;
      for (let d = 0; d <= 30; d++) {
        const entriesToday = randInt(1, 3);
        for (let i = 0; i < entriesToday; i++) {
          const category = pick(OB_CATEGORIES);
          obRows.push({
            tenantId: tenant.id, siteId: site.id,
            userId: pick(siteGuards).id,
            entryText: pick(OB_ENTRIES[category]),
            category,
            severity: pick(["low", "low", "low", "medium", "high"]),
            createdAt: daysAgo(d, randInt(6, 22), randInt(0, 59)),
          });
        }
      }
    }
    for (const batch of chunk(obRows, 2000)) {
      await prisma.occurrenceBookEntry.createMany({ data: batch });
    }
    totals.occurrenceEntries += obRows.length;

    // ── Incidents ─────────────────────────────────────────────────────────
    const incidentRows: any[] = [];
    for (const site of sites) {
      const siteGuards = guardsBySite[site.id];
      if (siteGuards.length === 0) continue;
      const count = randInt(2, 6);
      for (let i = 0; i < count; i++) {
        const category = pick(INCIDENT_CATEGORIES);
        const createdAt = daysAgo(randInt(0, 30), randInt(6, 22), randInt(0, 59));
        const severity = pick(["LOW", "LOW", "MEDIUM", "MEDIUM", "HIGH", "CRITICAL"]);
        const resolved = chance(65);
        const status = resolved ? pick(["RESOLVED", "CLOSED"]) : pick(["OPEN", "INVESTIGATING"]);
        const resolvedAt = resolved
          ? new Date(Math.min(createdAt.getTime() + randInt(1, 72) * 3600000, Date.now()))
          : null;
        incidentRows.push({
          tenantId: tenant.id, siteId: site.id,
          reportedById: pick(siteGuards).id,
          title: pick(INCIDENT_TEMPLATES[category]),
          description: `${pick(INCIDENT_TEMPLATES[category])} reported during scheduled patrol. Site security responded and logged the matter for follow-up.`,
          severity, status, category,
          createdAt, resolvedAt,
          updatedAt: resolvedAt ?? createdAt,
        });
      }
    }
    for (const batch of chunk(incidentRows, 2000)) {
      await prisma.incident.createMany({ data: batch });
    }
    totals.incidents += incidentRows.length;

    // ── Audit logs (90 days) ────────────────────────────────────────────
    const actorPool = [manager, ...siteManagers];
    const auditRows: any[] = [];
    const auditCount = randInt(50, 90);
    for (let i = 0; i < auditCount; i++) {
      auditRows.push({
        userId: pick(actorPool).id,
        action: pick(AUDIT_ACTIONS),
        createdAt: daysAgo(randInt(0, 90), randInt(7, 20), randInt(0, 59)),
      });
    }
    for (const batch of chunk(auditRows, 2000)) {
      await prisma.auditLog.createMany({ data: batch });
    }
    totals.auditLogs += auditRows.length;
  }

  console.log("\n──────────────────────────────────────────");
  console.log("Seed complete.");
  console.log(totals);
  console.log("\nAll accounts use the password: Password@123");
  console.log("\nOne Manager login per company:");
  credentialsSummary.forEach(c => console.log(`  ${c.company.padEnd(28)} ${c.manager}`));
  console.log("\nNote: 'Site Supervisor' has no distinct role in the schema —");
  console.log("that headcount was folded into the Guard role, per instructions");
  console.log("not to modify the schema.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
