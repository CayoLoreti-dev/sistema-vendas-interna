function logInfo(evento, dados = {}) {
  console.log(JSON.stringify({
    level: 'info',
    evento,
    timestamp: new Date().toISOString(),
    ...dados,
  }))
}

function logError(evento, error, dados = {}) {
  console.error(JSON.stringify({
    level: 'error',
    evento,
    timestamp: new Date().toISOString(),
    mensagem: error?.message || String(error),
    stack: error?.stack,
    ...dados,
  }))
}

module.exports = {
  logError,
  logInfo,
}
