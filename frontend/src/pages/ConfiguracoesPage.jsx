import { useEffect, useState } from 'react'
import StoreIdentity from '../components/StoreIdentity'
import { useStoreConfig } from '../context/StoreConfigContext'

const LIMITE_IMAGEM_MB = 1

function ConfiguracoesPage() {
  const { config, salvarConfig } = useStoreConfig()
  const [form, setForm] = useState(config)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    setForm(config)
  }, [config])

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }))
  }

  function carregarArquivo(event) {
    const arquivo = event.target.files?.[0]

    if (!arquivo) {
      return
    }

    if (!arquivo.type.startsWith('image/')) {
      setErro('Escolha um arquivo de imagem.')
      return
    }

    if (arquivo.size > LIMITE_IMAGEM_MB * 1024 * 1024) {
      setErro(`A imagem precisa ter no máximo ${LIMITE_IMAGEM_MB} MB.`)
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      atualizarCampo('imagemUrl', reader.result)
      setErro('')
      setMensagem('')
    }

    reader.onerror = () => {
      setErro('Não foi possível carregar essa imagem.')
    }

    reader.readAsDataURL(arquivo)
  }

  async function salvar(event) {
    event.preventDefault()
    setErro('')
    setMensagem('')
    setSalvando(true)

    try {
      await salvarConfig(form)
      setMensagem('Configurações salvas com sucesso.')
    } catch (error) {
      setErro(error.message || 'Não foi possível salvar as configurações.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Configurações</p>
        <h1>Aparência da loja</h1>
      </div>

      <form className="form-panel" onSubmit={salvar}>
        <h2>Identidade visual</h2>

        <div className="settings-preview">
          <StoreIdentity config={form} />
        </div>

        <div className="form-grid">
          <label>
            Nome da loja
            <input
              maxLength={40}
              onChange={(event) => atualizarCampo('nomeLoja', event.target.value)}
              required
              type="text"
              value={form.nomeLoja || ''}
            />
          </label>

          <label>
            URL da foto
            <input
              onChange={(event) => atualizarCampo('imagemUrl', event.target.value)}
              placeholder="https://..."
              type="url"
              value={form.imagemUrl?.startsWith('data:') ? '' : form.imagemUrl || ''}
            />
          </label>

          <label>
            Enviar foto
            <input
              accept="image/png,image/jpeg,image/webp"
              onChange={carregarArquivo}
              type="file"
            />
          </label>
        </div>

        <div className="actions">
          {form.imagemUrl && (
            <button
              className="secondary-button"
              onClick={() => atualizarCampo('imagemUrl', '')}
              type="button"
            >
              Remover foto
            </button>
          )}

          <button disabled={salvando} type="submit">
            {salvando ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </form>

      {erro && <p className="error">{erro}</p>}
      {mensagem && <p className="success">{mensagem}</p>}

      <section className="page-panel">
        <h2>Ideia para promoções</h2>
        <p className="muted">
          O melhor caminho é adicionar preço promocional por produto, com data de início e fim.
          No catálogo, o cliente veria o preço antigo riscado e o preço promocional em destaque.
          No pedido, o sistema salvaria o preço usado no momento da compra, como já faz hoje.
        </p>
      </section>
    </section>
  )
}

export default ConfiguracoesPage
