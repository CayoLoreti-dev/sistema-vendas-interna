require('dotenv').config()

const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth.routes')
const usuarioRoutes = require('./routes/usuario.routes')
const produtoRoutes = require('./routes/produto.routes')

const app = express()
const port = process.env.PORT || 3000

app.use(cors({ origin: process.env.CORS_ORIGIN }))
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/usuarios', usuarioRoutes)
app.use('/produtos', produtoRoutes)

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
})
