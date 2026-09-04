const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')

const MIME_EXTENSOES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
}

const LIMITE_BYTES = 4 * 1024 * 1024
const UPLOAD_DIR = path.join(__dirname, '../../uploads/comprovantes-pix')

async function salvarComprovantePix(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/(?:png|jpe?g|webp));base64,([a-z0-9+/=]+)$/i)

  if (!match) {
    return null
  }

  const mime = match[1].toLowerCase()
  const extensao = MIME_EXTENSOES[mime]
  const buffer = Buffer.from(match[2], 'base64')

  if (!extensao || buffer.length === 0 || buffer.length > LIMITE_BYTES) {
    return null
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  const nomeArquivo = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}.${extensao}`
  const caminhoArquivo = path.join(UPLOAD_DIR, nomeArquivo)

  await fs.writeFile(caminhoArquivo, buffer)

  return `/uploads/comprovantes-pix/${nomeArquivo}`
}

module.exports = {
  salvarComprovantePix,
}
