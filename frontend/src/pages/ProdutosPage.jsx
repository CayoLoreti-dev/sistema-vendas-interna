import { useEffect, useState } from 'react'
import { api } from '../services/api'

const produtoInicial = {
  nome: '',
  categoria: '',
  preco: '',
  estoqueAtual: '',
}

const promocaoInicial = {
  produto: null,
  precoPromocional: '',
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function ProdutosPage() {
  const [produtos, setProdutos] = useState([])
  const [form, setForm] = useState(produtoInicial)
  const [promocao, setPromocao] = useState(promocaoInicial)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvandoPromocao, setSalvandoPromocao] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function carregarProdutos() {
    setErro('')
    setCarregando(true)

    try {
      const dados = await api.get('/produtos')
      setProdutos(dados)
    } catch {
      setErro('Não foi possível carregar os produtos.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }))
  }

  function limparFormulario() {
    setForm(produtoInicial)
    setProdutoEditando(null)
  }

  function editarProduto(produto) {
    setProdutoEditando(produto)
    setForm({
      nome: produto.nome,
      categoria: produto.categoria || '',
      preco: produto.preco,
      estoqueAtual: String(produto.estoqueAtual),
    })
  }

  function abrirPromocao(produto) {
    setPromocao({
      produto,
      precoPromocional: produto.precoPromocional || '',
    })
    setErro('')
    setMensagem('')
  }

  async function salvarProduto(event) {
    event.preventDefault()
    setErro('')
    setMensagem('')
    setSalvando(true)

    const payload = {
      nome: form.nome,
      categoria: form.categoria || null,
      preco: form.preco,
      estoqueAtual: Number(form.estoqueAtual),
    }

    try {
      if (produtoEditando) {
        await api.put(`/produtos/${produtoEditando.id}`, payload)
        setMensagem('Produto atualizado com sucesso.')
      } else {
        await api.post('/produtos', payload)
        setMensagem('Produto cadastrado com sucesso.')
      }

      limparFormulario()
      await carregarProdutos()
    } catch {
      setErro('Não foi possível salvar o produto.')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarPromocao(event) {
    event.preventDefault()
    setErro('')
    setMensagem('')
    setSalvandoPromocao(true)

    try {
      await api.patch(`/produtos/${promocao.produto.id}/promocao`, {
        promocaoAtiva: true,
        precoPromocional: promocao.precoPromocional,
      })
      setPromocao(promocaoInicial)
      setMensagem('Promoção ativada com sucesso.')
      await carregarProdutos()
    } catch (error) {
      setErro(error.message || 'Não foi possível ativar a promoção.')
    } finally {
      setSalvandoPromocao(false)
    }
  }

  async function removerPromocao(produto) {
    const confirmou = window.confirm(`Remover a promoção de "${produto.nome}"?`)

    if (!confirmou) {
      return
    }

    setErro('')
    setMensagem('')

    try {
      await api.patch(`/produtos/${produto.id}/promocao`, {
        promocaoAtiva: false,
        precoPromocional: null,
      })
      setMensagem('Promoção removida com sucesso.')
      await carregarProdutos()
    } catch {
      setErro('Não foi possível remover a promoção.')
    }
  }

  async function excluirProduto(produto) {
    const confirmou = window.confirm(`Excluir o produto "${produto.nome}"?`)

    if (!confirmou) {
      return
    }

    setErro('')
    setMensagem('')

    try {
      await api.delete(`/produtos/${produto.id}`)
      setMensagem('Produto excluído com sucesso.')
      await carregarProdutos()
    } catch {
      setErro('Não foi possível excluir o produto.')
    }
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Produtos</p>
        <h1>Produtos</h1>
      </div>

      <form className="form-panel" onSubmit={salvarProduto}>
        <h2>{produtoEditando ? 'Editar produto' : 'Novo produto'}</h2>

        <div className="form-grid">
          <label>
            Nome
            <input
              onChange={(event) => atualizarCampo('nome', event.target.value)}
              required
              type="text"
              value={form.nome}
            />
          </label>

          <label>
            Categoria
            <input
              onChange={(event) => atualizarCampo('categoria', event.target.value)}
              type="text"
              value={form.categoria}
            />
          </label>

          <label>
            Preço
            <input
              className="valor-mono"
              min="0"
              onChange={(event) => atualizarCampo('preco', event.target.value)}
              required
              step="0.01"
              type="number"
              value={form.preco}
            />
          </label>

          <label>
            Estoque inicial
            <input
              className="valor-mono"
              min="0"
              onChange={(event) => atualizarCampo('estoqueAtual', event.target.value)}
              required
              step="1"
              type="number"
              value={form.estoqueAtual}
            />
          </label>
        </div>

        <div className="actions">
          <button disabled={salvando} type="submit">
            {salvando ? 'Salvando...' : 'Salvar produto'}
          </button>
          {produtoEditando && (
            <button className="secondary-button" type="button" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {erro && <p className="error">{erro}</p>}
      {mensagem && <p className="success">{mensagem}</p>}

      <div className="table-panel">
        {carregando ? (
          <p>Carregando produtos...</p>
        ) : produtos.length === 0 ? (
          <p>Nenhum produto cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Promoção</th>
                <th>Estoque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td>{produto.nome}</td>
                  <td>{produto.categoria || '-'}</td>
                  <td className="valor-mono">
                    {produto.promocaoAtiva && produto.precoPromocional ? (
                      <span className="price-stack">
                        <s>{moeda.format(Number(produto.preco))}</s>
                        <strong>{moeda.format(Number(produto.precoPromocional))}</strong>
                      </span>
                    ) : moeda.format(Number(produto.preco))}
                  </td>
                  <td>
                    {produto.promocaoAtiva ? (
                      <span className="promo-badge">Em promoção</span>
                    ) : (
                      <span className="muted">Sem promoção</span>
                    )}
                  </td>
                  <td className="valor-mono">{produto.estoqueAtual}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => editarProduto(produto)}>Editar</button>
                      <button className="secondary-button" type="button" onClick={() => abrirPromocao(produto)}>
                        {produto.promocaoAtiva ? 'Alterar promoção' : 'Criar promoção'}
                      </button>
                      {produto.promocaoAtiva && (
                        <button className="secondary-button" type="button" onClick={() => removerPromocao(produto)}>
                          Tirar promoção
                        </button>
                      )}
                      <button className="danger-button" type="button" onClick={() => excluirProduto(produto)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {promocao.produto && (
        <div className="checkout-backdrop" role="presentation">
          <form className="checkout-panel" onSubmit={salvarPromocao}>
            <div className="section-title">
              <h2>Promoção</h2>
              <button
                className="secondary-button"
                disabled={salvandoPromocao}
                onClick={() => setPromocao(promocaoInicial)}
                type="button"
              >
                Fechar
              </button>
            </div>

            <p className="muted">
              Produto: <strong>{promocao.produto.nome}</strong>
            </p>

            <label>
              Preço promocional
              <input
                className="valor-mono"
                max={promocao.produto.preco}
                min="0.01"
                onChange={(event) => setPromocao((atual) => ({
                  ...atual,
                  precoPromocional: event.target.value,
                }))}
                required
                step="0.01"
                type="number"
                value={promocao.precoPromocional}
              />
            </label>

            <button disabled={salvandoPromocao} type="submit">
              {salvandoPromocao ? 'Salvando...' : 'Ativar promoção'}
            </button>
          </form>
        </div>
      )}
    </section>
  )
}

export default ProdutosPage
