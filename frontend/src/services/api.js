const API_URL = import.meta.env.VITE_API_URL
const AUTH_STORAGE_KEY = 'sistema-vendas:auth'

function apiOrigin() {
  try {
    return new URL(API_URL, window.location.origin).origin
  } catch {
    return window.location.origin
  }
}

function assetUrl(path) {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) {
    return path
  }

  return `${apiOrigin()}${path.startsWith('/') ? path : `/${path}`}`
}

function getStoredToken() {
  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!storedAuth) {
    return null
  }

  try {
    return JSON.parse(storedAuth).token || null
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function clearSessionAndRedirect() {
  localStorage.removeItem(AUTH_STORAGE_KEY)

  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function request(path, options = {}) {
  const token = getStoredToken()
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearSessionAndRedirect()
    throw new Error('Sessao expirada')
  }

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.mensagem || 'Erro na requisicao')
  }

  return data
}

async function download(path, filename) {
  const token = getStoredToken()
  const headers = new Headers()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers,
  })

  if (response.status === 401) {
    clearSessionAndRedirect()
    throw new Error('Sessao expirada')
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.mensagem || 'Erro no download')
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  put: (path, body) => request(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  patch: (path, body) => request(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  delete: (path) => request(path, {
    method: 'DELETE',
  }),
  download,
}

export { AUTH_STORAGE_KEY, assetUrl }
