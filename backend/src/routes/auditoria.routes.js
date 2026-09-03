const { Router } = require('express')
const { listarAuditoria } = require('../controllers/auditoria.controller')
const { adminOnly, authMiddleware } = require('../middlewares/auth.middleware')

const router = Router()

router.get('/', authMiddleware, adminOnly, listarAuditoria)

module.exports = router
