const { Router } = require('express')
const {
  cadastrarFuncionario,
  criarUsuario,
  listarUsuarios,
} = require('../controllers/usuario.controller')
const { authMiddleware, vendedorOuAdmin } = require('../middlewares/auth.middleware')

const router = Router()

router.post('/cadastro', cadastrarFuncionario)
router.get('/', authMiddleware, vendedorOuAdmin, listarUsuarios)
router.post('/', authMiddleware, vendedorOuAdmin, criarUsuario)

module.exports = router
