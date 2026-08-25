const { Router } = require('express')
const {
  listarProdutos,
  criarProduto,
  atualizarProduto,
  atualizarPromocao,
  deletarProduto,
} = require('../controllers/produto.controller')
const { authMiddleware, vendedorOuAdmin } = require('../middlewares/auth.middleware')

const router = Router()

router.get('/', authMiddleware, listarProdutos)
router.post('/', authMiddleware, vendedorOuAdmin, criarProduto)
router.patch('/:id/promocao', authMiddleware, vendedorOuAdmin, atualizarPromocao)
router.put('/:id', authMiddleware, vendedorOuAdmin, atualizarProduto)
router.delete('/:id', authMiddleware, vendedorOuAdmin, deletarProduto)

module.exports = router
