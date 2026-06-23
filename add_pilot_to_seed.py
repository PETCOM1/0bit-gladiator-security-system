import re

path = 'packages/database/prisma/seed.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the position before the final console.log and after the last upsert
pilot_upsert = '''
  // 5. Create Pilot plan
  await prisma.subscriptionTier.upsert({
    where: { name: 'Pilot' },
    update: {},
    create: {
      name: 'Pilot',
      price: 0,
      maxUsers: 10,
      maxSites: 1,
      features: { trial: true, description: 'Pilot plan for testing' },
    },
  });
  console.log('✅ Pilot plan created (free trial plan)');
'''

# Insert before the line with console.log("🎉 Seeding complete!");
content = content.replace(
    '  console.log("🎉 Seeding complete!");',
    pilot_upsert + '\n  console.log("🎉 Seeding complete!");'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('✅ Seed file updated with Pilot plan.')
