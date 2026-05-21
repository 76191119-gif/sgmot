import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, CheckCircle2, ClipboardList, AlertTriangle, Calendar,
  TrendingUp, BarChart3, FileText, Loader,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { api } from '@/api/localClient';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import AccessDenied from '@/components/shared/AccessDenied';
import StatCard from '@/components/shared/StatCard';
import { typeLabels, categoryLabels, planLabels, getInitials } from '@/lib/utils';

const PRESETS = [
  { id: '7d',   label: 'Últimos 7 días',  group: 'day' },
  { id: '30d',  label: 'Últimos 30 días', group: 'day' },
  { id: 'mes',  label: 'Este mes',        group: 'day' },
  { id: 'año',  label: 'Este año',        group: 'month' },
  { id: '12m',  label: 'Últimos 12 meses',group: 'month' },
  { id: 'all',  label: 'Por año (todo)',  group: 'year' },
  { id: 'custom', label: 'Personalizado', group: 'day' },
];

function presetRange(id) {
  const now = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const today = fmt(now);
  switch (id) {
    case '7d': {
      const d = new Date(); d.setDate(d.getDate() - 6);
      return { from: fmt(d), to: today, group: 'day' };
    }
    case '30d': {
      const d = new Date(); d.setDate(d.getDate() - 29);
      return { from: fmt(d), to: today, group: 'day' };
    }
    case 'mes': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: fmt(d), to: today, group: 'day' };
    }
    case 'año': {
      const d = new Date(now.getFullYear(), 0, 1);
      return { from: fmt(d), to: today, group: 'month' };
    }
    case '12m': {
      const d = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      return { from: fmt(d), to: today, group: 'month' };
    }
    case 'all':
      return { from: '', to: '', group: 'year' };
    default:
      return { from: '', to: '', group: 'day' };
  }
}

const COLORS = ['#00FF41', '#00FFFF', '#FFC857', '#FF4444', '#8b5cf6', '#39FF14'];
const INPUT = "px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring";

export default function Reports() {
  const perms = usePermissions();
  const [preset, setPreset] = useState('30d');
  const [customRange, setCustomRange] = useState({ from: '', to: '', group: 'day' });

  const range = preset === 'custom' ? customRange : presetRange(preset);
  const params = { from: range.from || undefined, to: range.to || undefined, group: range.group };

  const summary  = useQuery({ queryKey: ['rep-summary', params],  queryFn: () => api.reports.summary(params),  enabled: perms.canViewReports });
  const ordTime  = useQuery({ queryKey: ['rep-ordtl', params],    queryFn: () => api.reports.ordersTimeline(params),    enabled: perms.canViewReports });
  const incTime  = useQuery({ queryKey: ['rep-inctl', params],    queryFn: () => api.reports.incidentsTimeline(params), enabled: perms.canViewReports });
  const ordType  = useQuery({ queryKey: ['rep-otype', params],    queryFn: () => api.reports.ordersByType(params),      enabled: perms.canViewReports });
  const incCat   = useQuery({ queryKey: ['rep-icat',  params],    queryFn: () => api.reports.incidentsByCategory(params),enabled: perms.canViewReports });
  const techPerf = useQuery({ queryKey: ['rep-tech',  params],    queryFn: () => api.reports.technicianPerformance(params), enabled: perms.canViewReports });
  const cliPlan  = useQuery({ queryKey: ['rep-cli'],              queryFn: () => api.reports.clientsByPlan(),           enabled: perms.canViewReports });

  if (!perms.canViewReports) return <AccessDenied />;

  const s = summary.data || {};
  const orders = s.orders || {};
  const incidents = s.incidents || {};
  const completionRate = orders.total ? Math.round((orders.completed / orders.total) * 100) : 0;

  const groupLabel = { day: 'día', month: 'mes', year: 'año' }[range.group] || 'período';

  return (
    <div>
      <PageHeader
        title="Reportes y Estadísticas"
        subtitle="Análisis temporal del desempeño operativo"
      />

      {/* Filtros temporales */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium">
          <Calendar className="w-4 h-4 text-primary" /> Período de análisis
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-3 py-1.5 text-xs rounded-md border transition ${
                preset === p.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:bg-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
            <div>
              <label className="block text-[11px] font-medium mb-1">Desde</label>
              <input type="date" className={`${INPUT} w-full`} value={customRange.from} onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">Hasta</label>
              <input type="date" className={`${INPUT} w-full`} value={customRange.to} onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">Agrupar por</label>
              <select className={`${INPUT} w-full`} value={customRange.group} onChange={(e) => setCustomRange((r) => ({ ...r, group: e.target.value }))}>
                <option value="day">Día</option>
                <option value="month">Mes</option>
                <option value="year">Año</option>
              </select>
            </div>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground mt-3">
          Mostrando datos {range.from && range.to ? `del ${range.from} al ${range.to}` : 'históricos completos'}, agrupados por {groupLabel}.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard label="Total Órdenes"      value={orders.total || 0}     icon={ClipboardList} color="primary" />
        <StatCard label="Completadas"        value={orders.completed || 0} icon={CheckCircle2}  color="green"   subtitle={`${completionRate}% de cumplimiento`} />
        <StatCard label="En Proceso"         value={orders.in_progress || 0} icon={Loader}      color="blue" />
        <StatCard label="Incidencias"        value={incidents.total || 0}  icon={AlertTriangle} color="red"     subtitle={`${incidents.resolved || 0} resueltas`} />
      </div>

      {/* Tendencia temporal - LINE CHART */}
      <div className="bg-card border border-border rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Tendencia temporal</h3>
            <p className="text-xs text-muted-foreground">Órdenes e incidencias por {groupLabel}</p>
          </div>
        </div>
        <TimelineChart ordersData={ordTime.data || []} incidentsData={incTime.data || []} />
      </div>

      {/* Gráficas de distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Órdenes por tipo */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Órdenes por Tipo</h3>
          <PieDist data={(ordType.data || []).map((d) => ({ name: typeLabels[d.type] || d.type, value: Number(d.value) }))} />
        </div>

        {/* Incidencias por categoría */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Incidencias por Categoría</h3>
          <BarDist data={(incCat.data || []).map((d) => ({ name: categoryLabels[d.category] || d.category, value: Number(d.value) }))} />
        </div>

        {/* Clientes por plan */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Clientes por Plan</h3>
          <PieDist data={(cliPlan.data || []).map((d) => ({ name: planLabels[d.plan] || d.plan, value: Number(d.value) }))} />
        </div>

        {/* Rendimiento técnicos */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Rendimiento de Técnicos</h3>
          <TechnicianList data={techPerf.data || []} />
        </div>
      </div>
    </div>
  );
}

function TimelineChart({ ordersData, incidentsData }) {
  // Unir datos por period
  const periods = useMemo(() => {
    const map = new Map();
    ordersData.forEach((d) => map.set(d.period, { period: d.period, orders: Number(d.total) }));
    incidentsData.forEach((d) => {
      const cur = map.get(d.period) || { period: d.period, orders: 0 };
      cur.incidents = Number(d.total);
      map.set(d.period, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
  }, [ordersData, incidentsData]);

  if (periods.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-10">Sin datos en el período seleccionado</p>;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={periods}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #00FF41', borderRadius: 8, fontSize: 12, color: '#CCFFCC' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="orders"     name="Órdenes"     stroke="#00FF41" strokeWidth={2.5} dot={{ r: 3, fill: '#00FF41' }} />
          <Line type="monotone" dataKey="incidents"  name="Incidencias" stroke="#FF4444" strokeWidth={2.5} dot={{ r: 3, fill: '#FF4444' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieDist({ data }) {
  if (!data.length) return <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #00FF41', borderRadius: 8, fontSize: 12, color: '#CCFFCC' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarDist({ data }) {
  if (!data.length) return <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
          <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #00FF41', borderRadius: 8, fontSize: 12, color: '#CCFFCC' }} />
          <Bar dataKey="value" fill="#00FF41" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TechnicianList({ data }) {
  if (!data.length) return <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>;
  return (
    <ul className="divide-y divide-border">
      {data.map((t) => (
        <li key={t.id} className="py-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(t.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{t.full_name}</p>
            <p className="text-xs text-muted-foreground">Total: {t.total || 0} órdenes</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              ✓ {t.completed || 0}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
              ⏰ {t.pending || 0}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
