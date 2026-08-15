const { Router } = require('express')
const { vapidPublicKey, subscribe } = require('../controllers/push.controller')
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware')

const router = Router()

router.get('/vapid-public-key', vapidPublicKey)
router.post('/subscribe', authMiddleware, adminOnly, subscribe)

module.exports = router
