import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

const LIMITE_ESTOQUE_BAIXO = 5

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function statusLabel(status) {
  return status === 'PAGO' ? 'Pago' : 'Em aberto'
}

function DashboardPage() {
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState([])
  const [totalEmAberto, setTotalEmAberto] = useState(0)
  const [quantidadeEmAberto, setQuantidadeEmAberto] = useState(0)
  const [pedidosRecentes, setPedidosRecentes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregarDashboard() {
    setErro('')
    setCarregando(true)

    try {
      const [produtos, pedidosEmAberto, todosPedidos] = await Promise.all([
        api.get('/produtos'),
        api.get('/pedidos?status=FIADO'),
        api.get('/pedidos'),
      ])

      const baixoEstoque = produtos.filter(
        (produto) => produto.estoqueAtual < LIMITE_ESTOQUE_BAIXO,
      )
      const totalFiado = pedidosEmAberto.reduce(
        (total, pedido) => total + Number(pedido.valorTotal),
        0,
      )

      setProdutosBaixoEstoque(baixoEstoque)
      setTotalEmAberto(totalFiado)
      setQuantidadeEmAberto(pedidosEmAberto.length)
      setPedidosRecentes(todosPedidos.slice(0, 5))
    } catch {
      setErro('Nao foi possivel carregar o dashboard. Tente novamente em instantes.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDashboard()
  }, [])

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Dashboard</p>
        <h1>Resumo do dia</h1>
      </div>

      {erro && <p className="error">{erro}</p>}

      {carregando ? (
        <div className="page-panel">
          <p className="muted">Carregando resumo...</p>
        </div>
      ) : (
        <>
          <div className="summary-grid">
            <section className={`summary-card ${produtosBaixoEstoque.length > 0 ? 'attention' : ''}`}>
              <span>Estoque baixo</span>
              <strong className="valor-mono">{produtosBaixoEstoque.length}</strong>
              <p>Produtos com menos de <span className="valor-mono">{LIMITE_ESTOQUE_BAIXO}</span> unidades.</p>
            </section>

            <section className="summary-card">
              <span>Total em aberto</span>
              <strong className="valor-mono">{moeda.format(totalEmAberto)}</strong>
              <p>Valor fiado ainda nao pago.</p>
            </section>

            <section className="summary-card">
              <span>Pedidos em aberto</span>
              <strong className="valor-mono">{quantidadeEmAberto}</strong>
              <p>Pedidos aguardando pagamento.</p>
            </section>
          </div>

          {produtosBaixoEstoque.length > 0 && (
            <section className="page-panel low-stock-list">
              <h2>Repor estoque</h2>
              <ul>
                {produtosBaixoEstoque.map((produto) => (
                  <li key={produto.id}>
                    <span>{produto.nome}</span>
                    <strong className="valor-mono">{produto.estoqueAtual} un.</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="page-panel recent-orders">
            <div className="section-title">
              <h2>Pedidos recentes</h2>
              <Link to="/admin/pedidos">Ver pedidos</Link>
            </div>

            {pedidosRecentes.length === 0 ? (
              <p className="muted">Nenhum pedido registrado ainda.</p>
            ) : (
              <ul>
                {pedidosRecentes.map((pedido) => (
                  <li key={pedido.id}>
                    <Link to="/admin/pedidos">
                      <span>{pedido.usuario.nome}</span>
                      <strong className="valor-mono">{moeda.format(Number(pedido.valorTotal))}</strong>
                      <em>{statusLabel(pedido.status)}</em>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  )
}

export default DashboardPage
