import { prisma } from '@repo/database';

async function main() {
  const plans = await prisma.subscriptionTier.findMany();
  console.log(plans);
}
main().catch(console.error);
