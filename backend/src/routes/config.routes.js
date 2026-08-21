const { Router } = require('express')
const {
  obterConfiguracoes,
  atualizarConfiguracoes,
} = require('../controllers/config.controller')
const { authMiddleware, vendedorOuAdmin } = require('../middlewares/auth.middleware')

const router = Router()

router.get('/', obterConfiguracoes)
router.put('/', authMiddleware, vendedorOuAdmin, atualizarConfiguracoes)

module.exports = router
