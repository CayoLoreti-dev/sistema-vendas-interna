import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AdminLayout from './layouts/AdminLayout'
import FuncionarioLayout from './layouts/FuncionarioLayout'
import CatalogoPage from './pages/CatalogoPage'
import Cadastro from './pages/Cadastro'
import DashboardPage from './pages/DashboardPage'
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
      to={['ADMIN', 'VENDEDOR'].includes(usuario.papel) ? '/admin' : '/funcionario'}
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

function AdminIndex() {
  const { usuario } = useAuth()

  if (usuario?.papel === 'VENDEDOR') {
    return <Navigate to="/admin/faturas" replace />
  }

  return <DashboardPage />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route
              path="/admin"
              element={(
                <ProtectedRoute papeis={['ADMIN', 'VENDEDOR']}>
                  <AdminLayout />
                </ProtectedRoute>
              )}
            >
              <Route index element={<AdminIndex />} />
              <Route path="produtos" element={<ProdutosPage />} />
              <Route path="funcionarios" element={<FuncionariosPage />} />
              <Route path="pedidos" element={<PedidosPage />} />
              <Route path="faturas" element={<FaturasPage />} />
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
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
