const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Limpando banco...')

  await prisma.$transaction([
    prisma.itemPedido.deleteMany(),
    prisma.pushSubscription.deleteMany(),
    prisma.pedido.deleteMany(),
    prisma.produto.deleteMany(),
    prisma.usuario.deleteMany(),
  ])

  const senha = await bcrypt.hash('123456', 10)

  await prisma.usuario.create({
    data: {
      nome: 'Admin Master',
      telefone: '00000000000',
      senha,
      papel: 'ADMIN',
    },
  })

  console.log('Admin Master criado com sucesso!')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
