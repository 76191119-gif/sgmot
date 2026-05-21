import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider, QueryClient, useQuery } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ToastProvider } from '@/lib/ToastContext';
import { api } from '@/api/localClient';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Technicians from './pages/Technicians';
import WorkOrders from './pages/WorkOrders';
import Incidents from './pages/Incidents';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Profile from './pages/Profile';
import AuditLogs from './pages/AuditLogs';
import Login from './pages/Login';
import Register from './pages/Register';
import CompleteProfile from './pages/CompleteProfile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <img src="/logo.png" alt="SGMOT" className="w-16 h-16 mx-auto mb-4 rounded-full animate-glow-pulse" />
        <div className="w-8 h-8 border-4 border-matrix-primary/20 border-t-matrix-primary rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}

/**
 * ProtectedRoute + ProfileGuard:
 * - Si no hay user → /login
 * - Si user es cliente y no tiene ficha de cliente → /complete-profile
 */
function ProtectedRoute({ children }) {
  const { user, isLoadingAuth } = useAuth();
  const location = useLocation();

  // Para clientes verificamos su ficha
  const needsCheck = !!user && user.role === 'cliente';
  const { data: myClient, isLoading: loadingClient } = useQuery({
    queryKey: ['me-client', user?.id],
    queryFn: api.auth.myClient,
    enabled: needsCheck,
    retry: 0,
  });

  if (isLoadingAuth || (needsCheck && loadingClient)) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  // Cliente sin ficha → forzar completar perfil (excepto si ya está en esa ruta)
  if (needsCheck && !myClient && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }
  // Cliente con ficha intentando ir a complete-profile → enviarlo al dashboard
  if (needsCheck && myClient && location.pathname === '/complete-profile') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AuthenticatedApp() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protegida sin layout (cliente Google completando datos) */}
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        }
      />

      {/* Protegidas con layout completo */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/technicians" element={<Technicians />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
        </ToastProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
