const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Não autorizado' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = {
      id: decoded.id,
      papel: decoded.papel,
    }
    return next()
  } catch {
    return res.status(401).json({ mensagem: 'Não autorizado' })
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
