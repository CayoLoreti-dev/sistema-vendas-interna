const { Router } = require('express')
const { fechamento, fechamentoCsv } = require('../controllers/relatorio.controller')
const { authMiddleware, vendedorOuAdmin } = require('../middlewares/auth.middleware')

const router = Router()

router.get('/fechamento', authMiddleware, vendedorOuAdmin, fechamento)
router.get('/fechamento.csv', authMiddleware, vendedorOuAdmin, fechamentoCsv)

module.exports = router
