import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'

function PwaUpdatePrompt() {
  const updateServiceWorker = useRef(null)
  const [precisaAtualizar, setPrecisaAtualizar] = useState(false)
  const [prontoOffline, setProntoOffline] = useState(false)

  useEffect(() => {
    updateServiceWorker.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setPrecisaAtualizar(true)
      },
      onOfflineReady() {
        setProntoOffline(true)
        window.setTimeout(() => setProntoOffline(false), 4500)
      },
    })
  }, [])

  if (!precisaAtualizar && !prontoOffline) {
    return null
  }

  return (
    <div className="pwa-update-toast" role="status" aria-live="polite">
      {precisaAtualizar ? (
        <>
          <span>Nova versão disponível.</span>
          <button type="button" onClick={() => updateServiceWorker.current?.(true)}>
            Atualizar agora
          </button>
        </>
      ) : (
        <span>App pronto para funcionar melhor offline.</span>
      )}
    </div>
  )
}

export default PwaUpdatePrompt
