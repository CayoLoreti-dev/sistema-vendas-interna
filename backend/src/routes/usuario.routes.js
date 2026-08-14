const { Router } = require('express')
const { criarUsuario } = require('../controllers/usuario.controller')
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware')

const router = Router()

router.post('/', authMiddleware, adminOnly, criarUsuario)

module.exports = router
