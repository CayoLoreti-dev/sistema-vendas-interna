const { Router } = require('express')
const { criarUsuario, listarUsuarios } = require('../controllers/usuario.controller')
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware')

const router = Router()

router.get('/', authMiddleware, adminOnly, listarUsuarios)
router.post('/', authMiddleware, adminOnly, criarUsuario)

module.exports = router
