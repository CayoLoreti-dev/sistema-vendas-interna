const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const totalUsuarios = await prisma.usuario.count()

  if (totalUsuarios > 0) {
    console.log('Seed ignorado: ja existe usuario cadastrado.')
    return
  }

  const senha = await bcrypt.hash('123456', 10)

  await prisma.usuario.create({
    data: {
      nome: 'Admin',
      telefone: '00000000000',
      senha,
      papel: 'ADMIN',
    },
  })

  console.log('Usuario admin de bootstrap criado.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
