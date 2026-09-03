const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Nao autorizado' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        papel: true,
        status: true,
      },
    })

    if (!usuario) {
      return res.status(401).json({ mensagem: 'Nao autorizado' })
    }

    if (usuario.status === 'PENDENTE') {
      return res.status(403).json({ mensagem: 'Conta aguardando aprovacao' })
    }

    if (usuario.status === 'BLOQUEADO') {
      return res.status(403).json({ mensagem: 'Conta bloqueada' })
    }

    req.usuario = {
      id: usuario.id,
      papel: usuario.papel,
      status: usuario.status,
    }
    return next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ mensagem: 'Nao autorizado' })
    }

    console.error('Erro ao validar usuario autenticado:', error)
    return res.status(401).json({ mensagem: 'Nao autorizado' })
  }
}

function adminOnly(req, res, next) {
  if (req.usuario?.papel !== 'ADMIN') {
    return res.status(403).json({ mensagem: 'Acesso negado' })
  }

  return next()
}

function vendedorOuAdmin(req, res, next) {
  if (!['ADMIN', 'VENDEDOR'].includes(req.usuario?.papel)) {
    return res.status(403).json({ mensagem: 'Acesso negado' })
  }

  return next()
}

module.exports = {
  authMiddleware,
  adminOnly,
  vendedorOuAdmin,
}
