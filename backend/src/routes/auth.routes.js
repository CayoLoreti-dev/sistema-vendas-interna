const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const { login } = require('../controllers/auth.controller')

const router = Router()
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  message: { mensagem: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
})

router.post('/login', loginLimiter, login)

module.exports = router
