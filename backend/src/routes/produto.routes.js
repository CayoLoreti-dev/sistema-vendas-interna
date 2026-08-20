const { Router } = require('express')
const {
  listarProdutos,
  criarProduto,
  atualizarProduto,
  deletarProduto,
} = require('../controllers/produto.controller')
const { authMiddleware, vendedorOuAdmin } = require('../middlewares/auth.middleware')

const router = Router()

router.get('/', authMiddleware, listarProdutos)
router.post('/', authMiddleware, vendedorOuAdmin, criarProduto)
router.put('/:id', authMiddleware, vendedorOuAdmin, atualizarProduto)
router.delete('/:id', authMiddleware, vendedorOuAdmin, deletarProduto)

module.exports = router
