require('dotenv').config()

const path = require('path')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const authRoutes = require('./routes/auth.routes')
const usuarioRoutes = require('./routes/usuario.routes')
const produtoRoutes = require('./routes/produto.routes')
const pedidoRoutes = require('./routes/pedido.routes')
const pushRoutes = require('./routes/push.routes')
const configRoutes = require('./routes/config.routes')

const app = express()
const port = process.env.PORT || 3000
const frontendDist = path.join(__dirname, '../../frontend/dist')

app.set('trust proxy', Number(process.env.TRUST_PROXY || 1))
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN }))
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/usuarios', usuarioRoutes)
app.use('/produtos', produtoRoutes)
app.use('/pedidos', pedidoRoutes)
app.use('/push/config', configRoutes)
app.use('/push', pushRoutes)
app.use('/config', configRoutes)

app.use(express.static(frontendDist))
app.use((req, res, next) => {
  const isApiRequest = ['/auth', '/usuarios', '/produtos', '/pedidos', '/push', '/config']
    .some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))

  if (req.method !== 'GET' || isApiRequest) {
    return next()
  }

  return res.sendFile(path.join(frontendDist, 'index.html'))
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
})
