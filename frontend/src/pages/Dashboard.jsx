import { usePermissions } from '@/lib/usePermissions';
import AdminPanel from './AdminPanel';
import TecnicoPanel from './TecnicoPanel';
import ClientePortal from './ClientePortal';

export default function Dashboard() {
  const { isAdmin, isTecnico } = usePermissions();
  if (isAdmin) return <AdminPanel />;
  if (isTecnico) return <TecnicoPanel />;
  return <ClientePortal />;
}
