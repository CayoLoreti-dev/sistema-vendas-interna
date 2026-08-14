const { Router } = require('express')
const {
  listarProdutos,
  criarProduto,
  atualizarProduto,
  deletarProduto,
} = require('../controllers/produto.controller')
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware')

const router = Router()

router.get('/', authMiddleware, listarProdutos)
router.post('/', authMiddleware, adminOnly, criarProduto)
router.put('/:id', authMiddleware, adminOnly, atualizarProduto)
router.delete('/:id', authMiddleware, adminOnly, deletarProduto)

module.exports = router
