const { prisma } = require('@repo/database');
async function main() {
  await prisma.subscriptionTier.upsert({
    where: { name: 'Pilot' },
    update: {},
    create: {
      name: 'Pilot',
      price: 0,
      maxUsers: 10,
      maxSites: 1,
      features: { trial: true, description: 'Pilot plan for testing' },
    }
  });
  console.log('Pilot plan created');
}
main().catch(console.error);
