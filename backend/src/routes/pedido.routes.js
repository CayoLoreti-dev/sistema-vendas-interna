const { Router } = require('express')
const {
  criarPedido,
  listarPedidos,
  buscarPedido,
  pagarPedido,
  meuSaldo,
  saldoUsuario,
} = require('../controllers/pedido.controller')
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware')

const router = Router()

router.post('/', authMiddleware, criarPedido)
router.get('/', authMiddleware, listarPedidos)
router.get('/meu-saldo', authMiddleware, meuSaldo)
router.get('/saldo/:usuarioId', authMiddleware, adminOnly, saldoUsuario)
router.get('/:id', authMiddleware, buscarPedido)
router.patch('/:id/pagar', authMiddleware, adminOnly, pagarPedido)

module.exports = router
