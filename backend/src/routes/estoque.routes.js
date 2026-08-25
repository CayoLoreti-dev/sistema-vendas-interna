const { Router } = require('express')
const {
  listarEstoque,
  adicionarEntrada,
  colocarParaVenda,
  listarHistorico,
} = require('../controllers/estoque.controller')
const { authMiddleware, vendedorOuAdmin } = require('../middlewares/auth.middleware')

const router = Router()

router.get('/', authMiddleware, vendedorOuAdmin, listarEstoque)
router.post('/entrada', authMiddleware, vendedorOuAdmin, adicionarEntrada)
router.get('/:id/historico', authMiddleware, vendedorOuAdmin, listarHistorico)
router.post('/:id/colocar-venda', authMiddleware, vendedorOuAdmin, colocarParaVenda)

module.exports = router
