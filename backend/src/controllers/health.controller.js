const fs = require('fs/promises')
const path = require('path')
const prisma = require('../lib/prisma')

const uploadsDir = path.join(__dirname, '../../uploads')

async function health(req, res) {
  const checks = {
    api: 'ok',
    db: 'pending',
    uploads: 'pending',
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = 'ok'
  } catch {
    checks.db = 'erro'
  }

  try {
    await fs.mkdir(uploadsDir, { recursive: true })
    await fs.access(uploadsDir)
    checks.uploads = 'ok'
  } catch {
    checks.uploads = 'erro'
  }

  const ok = Object.values(checks).every((status) => status === 'ok')

  return res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'erro',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
}

module.exports = {
  health,
}
