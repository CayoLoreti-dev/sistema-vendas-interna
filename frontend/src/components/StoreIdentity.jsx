function StoreIdentity({ config, compact = false }) {
  const nomeLoja = config?.nomeLoja || 'VendeMais'
  const imagemUrl = config?.imagemUrl
  const inicial = nomeLoja.trim().charAt(0).toUpperCase() || 'V'

  return (
    <div className={compact ? 'store-identity compact' : 'store-identity'}>
      <div className="store-photo" aria-hidden="true">
        {imagemUrl ? <img src={imagemUrl} alt="" /> : <span>{inicial}</span>}
      </div>
      <div>
        <p className="eyebrow brand-name">{nomeLoja}</p>
        {!compact && <span>Sistema de vendas</span>}
      </div>
    </div>
  )
}

export default StoreIdentity
