import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import FuncionarioLayout from './layouts/FuncionarioLayout'
import CatalogoPage from './pages/CatalogoPage'
import DashboardPage from './pages/DashboardPage'
import FaturasPage from './pages/FaturasPage'
import FuncionariosPage from './pages/FuncionariosPage'
import Login from './pages/Login'
import MeuSaldoPage from './pages/MeuSaldoPage'
import PedidosPage from './pages/PedidosPage'
import ProdutosPage from './pages/ProdutosPage'
import './App.css'

function HomeRedirect() {
  const { usuario } = useAuth()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return (
    <Navigate
      to={usuario.papel === 'ADMIN' ? '/admin' : '/funcionario'}
      replace
    />
  )
}

function ProtectedRoute({ papel, children }) {
  const { usuario } = useAuth()

  if (!usuario || usuario.papel !== papel) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
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
  )
}

export default App
