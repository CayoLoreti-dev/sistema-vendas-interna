const { Router } = require('express')
const {
  cadastrarFuncionario,
  criarUsuario,
  listarUsuarios,
} = require('../controllers/usuario.controller')
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware')

const router = Router()

router.post('/cadastro', cadastrarFuncionario)
router.get('/', authMiddleware, adminOnly, listarUsuarios)
router.post('/', authMiddleware, adminOnly, criarUsuario)

module.exports = router
