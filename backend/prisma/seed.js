const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const telefone = '21980100657'
  const senha = await bcrypt.hash('0501', 10)

  await prisma.usuario.upsert({
    where: {
      telefone,
    },
    update: {
      nome: 'Admin Master',
      senha,
      papel: 'ADMIN',
    },
    create: {
      nome: 'Admin Master',
      telefone,
      senha,
      papel: 'ADMIN',
    },
  })

  console.log('Admin Master criado/atualizado com sucesso!')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
