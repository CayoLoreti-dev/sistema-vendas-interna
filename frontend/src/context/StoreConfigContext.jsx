import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

const StoreConfigContext = createContext(null)

const defaultConfig = {
  nomeLoja: 'VendeMais',
  imagemUrl: '',
}

export function StoreConfigProvider({ children }) {
  const [config, setConfig] = useState(defaultConfig)
  const [carregandoConfig, setCarregandoConfig] = useState(true)

  async function carregarConfig() {
    setCarregandoConfig(true)

    try {
      const dados = await api.get('/config')
      setConfig({
        nomeLoja: dados.nomeLoja || defaultConfig.nomeLoja,
        imagemUrl: dados.imagemUrl || '',
      })
    } catch {
      setConfig(defaultConfig)
    } finally {
      setCarregandoConfig(false)
    }
  }

  async function salvarConfig(payload) {
    const dados = await api.put('/config', payload)
    setConfig({
      nomeLoja: dados.nomeLoja || defaultConfig.nomeLoja,
      imagemUrl: dados.imagemUrl || '',
    })
    return dados
  }

  useEffect(() => {
    carregarConfig()
  }, [])

  useEffect(() => {
    document.title = config.nomeLoja || defaultConfig.nomeLoja
  }, [config.nomeLoja])

  const value = useMemo(() => ({
    config,
    carregandoConfig,
    carregarConfig,
    salvarConfig,
  }), [config, carregandoConfig])

  return (
    <StoreConfigContext.Provider value={value}>
      {children}
    </StoreConfigContext.Provider>
  )
}

export function useStoreConfig() {
  const context = useContext(StoreConfigContext)

  if (!context) {
    throw new Error('useStoreConfig deve ser usado dentro de StoreConfigProvider')
  }

  return context
}
