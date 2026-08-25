import { useEffect, useState } from 'react'
import { api } from '../services/api'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function metodoLabel(metodoPagamento) {
  return metodoPagamento === 'PIX' ? 'Pix combinado' : 'Fiado'
}

function MeuSaldoPage() {
  const [saldo, setSaldo] = useState({ total: 0, pedidos: [] })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregarSaldo() {
    setErro('')
    setCarregando(true)

    try {
      const dados = await api.get('/pedidos/meu-saldo')
      setSaldo(dados)
    } catch {
      setErro('Não foi possível carregar seu saldo. Tente novamente em instantes.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarSaldo()
  }, [])

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Meu saldo</p>
        <h1>Pedidos em aberto</h1>
      </div>

      {erro && <p className="error">{erro}</p>}

      {carregando ? (
        <div className="page-panel">
          <p className="muted">Carregando seu saldo...</p>
        </div>
      ) : (
        <>
          <section className="balance-card">
            <span>Total em aberto</span>
            <strong className="valor-mono">{moeda.format(Number(saldo.total))}</strong>
          </section>

          {saldo.pedidos.length === 0 ? (
            <div className="page-panel positive-panel">
              <h2>Você está em dia!</h2>
              <p>Não tem nenhum pedido em aberto agora.</p>
            </div>
          ) : (
            <div className="orders-list">
              {saldo.pedidos.map((pedido) => (
                <article className="order-card" key={pedido.id}>
                  <div className="order-header">
                    <div>
                      <strong>{formatarData(pedido.criadoEm)}</strong>
                      <span className={`method-badge ${pedido.metodoPagamento === 'PIX' ? 'pix' : 'fiado'}`}>
                        {metodoLabel(pedido.metodoPagamento)}
                      </span>
                    </div>

                    <span className="status-badge open">Em aberto</span>
                  </div>

                  <ul className="items-list">
                    {pedido.itens.map((item) => (
                      <li key={item.id}>
                        <span className="invoice-item-main">
                          <span>{item.produto.nome}</span>
                          <small>Retirado em {formatarData(pedido.criadoEm)}</small>
                        </span>
                        <span className="invoice-item-values">
                          <strong className="valor-mono">{item.quantidade} un.</strong>
                          <span className="valor-mono">{moeda.format(Number(item.precoUnitario) * item.quantidade)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="order-footer">
                    <strong className="valor-mono">{moeda.format(Number(pedido.valorTotal))}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default MeuSaldoPage
