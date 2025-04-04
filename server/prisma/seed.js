const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const user = [
        {
          username: 'admin',
          password: 'password',
          role: 'admin'
        }
    ];
  await prisma.user.createMany({
    data: user
  });
  

  
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });