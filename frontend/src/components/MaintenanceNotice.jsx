const maintenanceEnabled = import.meta.env.VITE_MAINTENANCE_NOTICE === 'true'

function MaintenanceNotice() {
  if (!maintenanceEnabled) {
    return null
  }

  return (
    <div className="maintenance-notice" role="status">
      <strong>Sistema em manutenÃ§Ã£o</strong>
      <span>Estamos fazendo ajustes agora. VocÃª pode enfrentar lentidÃ£o ou dificuldade de acesso por alguns minutos.</span>
    </div>
  )
}

export default MaintenanceNotice
