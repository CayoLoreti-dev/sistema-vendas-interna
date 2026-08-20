const { Router } = require('express')
const {
  criarPedido,
  criarPedidoAdmin,
  listarPedidos,
  buscarPedido,
  pagarPedido,
  meuSaldo,
  saldoUsuario,
} = require('../controllers/pedido.controller')
const { authMiddleware, vendedorOuAdmin } = require('../middlewares/auth.middleware')

const router = Router()

router.post('/', authMiddleware, criarPedido)
router.post('/admin', authMiddleware, vendedorOuAdmin, criarPedidoAdmin)
router.get('/', authMiddleware, listarPedidos)
router.get('/meu-saldo', authMiddleware, meuSaldo)
router.get('/saldo/:usuarioId', authMiddleware, vendedorOuAdmin, saldoUsuario)
router.get('/:id', authMiddleware, buscarPedido)
router.patch('/:id/pagar', authMiddleware, vendedorOuAdmin, pagarPedido)

module.exports = router
