const { Router } = require('express')
const { vapidPublicKey, subscribe } = require('../controllers/push.controller')
const { authMiddleware, vendedorOuAdmin } = require('../middlewares/auth.middleware')

const router = Router()

router.get('/vapid-public-key', vapidPublicKey)
router.post('/subscribe', authMiddleware, vendedorOuAdmin, subscribe)

module.exports = router
