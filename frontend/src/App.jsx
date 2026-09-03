import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { StoreConfigProvider } from './context/StoreConfigContext'
import { ThemeProvider } from './context/ThemeContext'
import MaintenanceNotice from './components/MaintenanceNotice'
import PwaUpdatePrompt from './components/PwaUpdatePrompt'
import AdminLayout from './layouts/AdminLayout'
import FuncionarioLayout from './layouts/FuncionarioLayout'
import AlterarSenhaPage from './pages/AlterarSenhaPage'
import AuditoriaPage from './pages/AuditoriaPage'
import CatalogoPage from './pages/CatalogoPage'
import Cadastro from './pages/Cadastro'
import ConfiguracoesPage from './pages/ConfiguracoesPage'
import DashboardPage from './pages/DashboardPage'
import EstoqueInternoPage from './pages/EstoqueInternoPage'
import FaturasPage from './pages/FaturasPage'
import FuncionariosPage from './pages/FuncionariosPage'
import Login from './pages/Login'
import MeuSaldoPage from './pages/MeuSaldoPage'
import PedidosPage from './pages/PedidosPage'
import ProdutosPage from './pages/ProdutosPage'
import './App.css'

function HomeRedirect() {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return null
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return (
    <Navigate
      to={usuario.papel === 'ADMIN' ? '/admin' : usuario.papel === 'VENDEDOR' ? '/vendedor' : '/funcionario'}
      replace
    />
  )
}

function ProtectedRoute({ papeis, papel, children }) {
  const { usuario, carregando } = useAuth()
  const papeisPermitidos = papeis || [papel]

  if (carregando) {
    return null
  }

  if (!usuario || !papeisPermitidos.includes(usuario.papel)) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreConfigProvider>
          <BrowserRouter>
            <MaintenanceNotice />
            <PwaUpdatePrompt />
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route
                path="/admin"
                element={(
                  <ProtectedRoute papel="ADMIN">
                    <AdminLayout />
                  </ProtectedRoute>
                )}
              >
                <Route index element={<DashboardPage />} />
                <Route path="produtos" element={<ProdutosPage />} />
                <Route path="estoque" element={<EstoqueInternoPage />} />
                <Route path="funcionarios" element={<FuncionariosPage />} />
                <Route path="pedidos" element={<PedidosPage />} />
                <Route path="faturas" element={<FaturasPage />} />
                <Route path="configuracoes" element={<ConfiguracoesPage />} />
                <Route path="auditoria" element={<AuditoriaPage />} />
                <Route path="senha" element={<AlterarSenhaPage />} />
              </Route>
              <Route
                path="/vendedor"
                element={(
                  <ProtectedRoute papel="VENDEDOR">
                    <AdminLayout />
                  </ProtectedRoute>
                )}
              >
                <Route index element={<DashboardPage />} />
                <Route path="produtos" element={<ProdutosPage />} />
                <Route path="estoque" element={<EstoqueInternoPage />} />
                <Route path="funcionarios" element={<FuncionariosPage />} />
                <Route path="pedidos" element={<PedidosPage />} />
                <Route path="faturas" element={<FaturasPage />} />
                <Route path="configuracoes" element={<ConfiguracoesPage />} />
                <Route path="senha" element={<AlterarSenhaPage />} />
              </Route>
              <Route
                path="/funcionario"
                element={(
                  <ProtectedRoute papel="FUNCIONARIO">
                    <FuncionarioLayout />
                  </ProtectedRoute>
                )}
              >
                <Route index element={<CatalogoPage />} />
                <Route path="saldo" element={<MeuSaldoPage />} />
                <Route path="senha" element={<AlterarSenhaPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </StoreConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
