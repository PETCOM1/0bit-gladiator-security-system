import { prisma } from "@repo/database";
async function run() {
  try {
    const tenants = await prisma.tenant.findMany({ orderBy: { name: 'asc' }});
    console.log("Success:", tenants);
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
