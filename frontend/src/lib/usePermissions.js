import { useAuth } from '@/lib/AuthContext';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || 'cliente';

  return {
    role,
    isAdmin:    role === 'admin',
    isTecnico:  role === 'tecnico',
    isCliente:  role === 'cliente',

    canViewDashboard:    role === 'admin' || role === 'tecnico',
    canViewClients:      role === 'admin',
    canViewTechnicians:  role === 'admin',
    canViewWorkOrders:   true,
    canViewIncidents:    true,
    canViewReports:      role === 'admin',
    canManageUsers:      role === 'admin',
    canViewAuditLogs:    role === 'admin',
    canViewProfile:      true,
    canViewNotifications:true,

    canCreate: role === 'admin',
    canEdit:   role === 'admin' || role === 'tecnico',
    canDelete: role === 'admin',
    canChangeOrderStatus: role === 'admin' || role === 'tecnico',
  };
}
