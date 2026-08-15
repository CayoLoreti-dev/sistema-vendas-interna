import { useEffect, useState } from 'react'
import { api } from '../services/api'

const produtoInicial = {
  nome: '',
  categoria: '',
  preco: '',
  estoqueAtual: '',
}

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function ProdutosPage() {
  const [produtos, setProdutos] = useState([])
  const [form, setForm] = useState(produtoInicial)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function carregarProdutos() {
    setErro('')
    setCarregando(true)

    try {
      const dados = await api.get('/produtos')
      setProdutos(dados)
    } catch {
      setErro('Nao foi possivel carregar os produtos.')
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
      setErro('Nao foi possivel salvar o produto.')
    } finally {
      setSalvando(false)
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
      setMensagem('Produto excluido com sucesso.')
      await carregarProdutos()
    } catch {
      setErro('Nao foi possivel excluir o produto.')
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
            Preco
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
                <th>Preco</th>
                <th>Estoque</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td>{produto.nome}</td>
                  <td>{produto.categoria || '-'}</td>
                  <td className="valor-mono">{moeda.format(Number(produto.preco))}</td>
                  <td className="valor-mono">{produto.estoqueAtual}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => editarProduto(produto)}>Editar</button>
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
    </section>
  )
}

export default ProdutosPage
