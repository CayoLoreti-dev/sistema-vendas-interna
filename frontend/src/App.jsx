import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminHome from './pages/AdminHome'
import FuncionarioHome from './pages/FuncionarioHome'
import Login from './pages/Login'
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
                <AdminHome />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/funcionario"
            element={(
              <ProtectedRoute papel="FUNCIONARIO">
                <FuncionarioHome />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
