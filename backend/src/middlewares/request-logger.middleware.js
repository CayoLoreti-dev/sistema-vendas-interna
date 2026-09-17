const crypto = require('crypto')
const { logInfo } = require('../lib/logger')

function requestLogger(req, res, next) {
  const inicio = process.hrtime.bigint()
  const requestId = req.headers['x-request-id'] || crypto.randomUUID()

  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)

  res.on('finish', () => {
    const duracaoMs = Number(process.hrtime.bigint() - inicio) / 1_000_000

    logInfo('http_request', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(duracaoMs.toFixed(2)),
      usuarioId: req.usuario?.id || null,
      papel: req.usuario?.papel || null,
      ip: req.ip,
    })
  })

  return next()
}

module.exports = {
  requestLogger,
}
