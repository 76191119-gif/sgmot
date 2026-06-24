import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Loader,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/api/localClient';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import AccessDenied from '@/components/shared/AccessDenied';
import StatCard from '@/components/shared/StatCard';
import { categoryLabels, getInitials, planLabels, typeLabels } from '@/lib/utils';

const HIGHCHARTS_SRC = 'https://code.highcharts.com/highcharts.js';
const PRESETS = [
  { id: '7d', label: 'Ultimos 7 dias' },
  { id: '30d', label: 'Ultimos 30 dias' },
  { id: '12m', label: 'Ultimos 12 meses' },
  { id: 'custom', label: 'Personalizado' },
];
const COLORS = ['#39FF14', '#00E5FF', '#FFD83D', '#FF4D57', '#1E90FF', '#00E5FF'];
const INPUT = 'px-3 py-2 text-sm border border-matrix-primary/30 rounded-md bg-black/55 text-matrix-text focus:outline-none focus:border-matrix-primary transition';
const CARD = 'cyber-surface rounded-xl border border-[#19E35A] p-5';

let highchartsPromise;

function loadHighcharts() {
  if (window.Highcharts) return Promise.resolve(window.Highcharts);
  if (highchartsPromise) return highchartsPromise;

  highchartsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${HIGHCHARTS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Highcharts), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = HIGHCHARTS_SRC;
    script.async = true;
    script.onload = () => resolve(window.Highcharts);
    script.onerror = () => reject(new Error('No se pudo cargar Highcharts'));
    document.head.appendChild(script);
  });

  return highchartsPromise;
}

function presetRange(id) {
  const now = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const today = fmt(now);
  switch (id) {
    case '7d': {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return { from: fmt(d), to: today, group: 'day' };
    }
    case '30d': {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      return { from: fmt(d), to: today, group: 'day' };
    }
    case '12m': {
      const d = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      return { from: fmt(d), to: today, group: 'month' };
    }
    default:
      return { from: '', to: '', group: 'day' };
  }
}

function shortPeriod(period) {
  if (!period) return '';
  const parts = String(period).split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  if (parts.length === 2) return `${parts[1]}/${parts[0].slice(2)}`;
  return String(period);
}

export default function Reports() {
  const perms = usePermissions();
  const [preset, setPreset] = useState('30d');
  const [customRange, setCustomRange] = useState({ from: '', to: '', group: 'day' });

  const range = preset === 'custom' ? customRange : presetRange(preset);
  const params = { from: range.from || undefined, to: range.to || undefined, group: range.group };

  const summary = useQuery({ queryKey: ['rep-summary', params], queryFn: () => api.reports.summary(params), enabled: perms.canViewReports });
  const ordTime = useQuery({ queryKey: ['rep-ordtl', params], queryFn: () => api.reports.ordersTimeline(params), enabled: perms.canViewReports });
  const incTime = useQuery({ queryKey: ['rep-inctl', params], queryFn: () => api.reports.incidentsTimeline(params), enabled: perms.canViewReports });
  const ordType = useQuery({ queryKey: ['rep-otype', params], queryFn: () => api.reports.ordersByType(params), enabled: perms.canViewReports });
  const incCat = useQuery({ queryKey: ['rep-icat', params], queryFn: () => api.reports.incidentsByCategory(params), enabled: perms.canViewReports });
  const techPerf = useQuery({ queryKey: ['rep-tech', params], queryFn: () => api.reports.technicianPerformance(params), enabled: perms.isAdmin });
  const cliPlan = useQuery({ queryKey: ['rep-cli'], queryFn: () => api.reports.clientsByPlan(), enabled: perms.isAdmin });

  if (!perms.canViewReports) return <AccessDenied />;

  const s = summary.data || {};
  const orders = s.orders || {};
  const incidents = s.incidents || {};
  const completionRate = Number(orders.total) ? Math.round((Number(orders.completed || 0) / Number(orders.total)) * 100) : 0;
  const groupLabel = { day: 'dia', month: 'mes', year: 'ano' }[range.group] || 'periodo';

  return (
    <div className="relative">
      <PageHeader
        title={perms.isCliente ? 'Mis Reportes' : 'Reportes y Estadisticas'}
        subtitle={perms.isCliente ? 'Analisis de tus ordenes e incidencias' : 'Analisis temporal del desempeno operativo'}
      />

      <div className={`${CARD} mb-5`}>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-matrix-text">
          <Calendar className="h-4 w-4 text-matrix-primary" /> Periodo de analisis
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={`rounded-md border px-3 py-1.5 text-xs transition ${
                preset === p.id
                  ? 'border-matrix-primary bg-matrix-primary font-bold text-black'
                  : 'border-matrix-primary/25 text-matrix-muted hover:bg-matrix-primary/5 hover:text-matrix-text'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-matrix-primary/15 pt-3 sm:grid-cols-3">
            <Field label="Desde">
              <input type="date" className={`${INPUT} w-full`} value={customRange.from} onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))} />
            </Field>
            <Field label="Hasta">
              <input type="date" className={`${INPUT} w-full`} value={customRange.to} onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))} />
            </Field>
            <Field label="Agrupar por">
              <select className={`${INPUT} w-full cursor-pointer`} value={customRange.group} onChange={(e) => setCustomRange((r) => ({ ...r, group: e.target.value }))}>
                <option value="day">Dia</option>
                <option value="month">Mes</option>
                <option value="year">Ano</option>
              </select>
            </Field>
          </div>
        )}

        <p className="mt-3 text-[11px] text-matrix-muted">
          Mostrando datos {range.from && range.to ? `del ${range.from} al ${range.to}` : 'historicos completos'}, agrupados por {groupLabel}.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Ordenes" value={orders.total || 0} icon={ClipboardList} color="primary" />
        <StatCard label="Completadas" value={orders.completed || 0} icon={CheckCircle2} color="green" subtitle={`${completionRate}% de cumplimiento`} />
        <StatCard label="En Proceso" value={orders.in_progress || 0} icon={Loader} color="blue" />
        <StatCard label="Incidencias" value={incidents.total || 0} icon={AlertTriangle} color="red" subtitle={`${incidents.resolved || 0} resueltas`} />
      </div>

      <div className={`${CARD} mb-5`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-matrix-text">
              <TrendingUp className="h-4 w-4 text-matrix-primary" /> Tendencia temporal
            </h3>
            <p className="text-xs text-matrix-muted">Ordenes e incidencias por {groupLabel}</p>
          </div>
        </div>
        <TimelineChart ordersData={ordTime.data || []} incidentsData={incTime.data || []} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Ordenes por Tipo">
          <PieReport data={(ordType.data || []).map((d) => ({ name: typeLabels[d.type] || d.type, y: Number(d.value) }))} />
        </ChartCard>
        <ChartCard title="Incidencias por Categoria">
          <PieReport data={(incCat.data || []).map((d) => ({ name: categoryLabels[d.category] || d.category, y: Number(d.value) }))} />
        </ChartCard>
        {perms.isAdmin && (
          <>
            <ChartCard title="Clientes por Plan">
              <PieReport data={(cliPlan.data || []).map((d) => ({ name: planLabels[d.plan] || d.plan, y: Number(d.value) }))} />
            </ChartCard>
            <ChartCard title="Rendimiento de Tecnicos">
              <TechnicianList data={techPerf.data || []} />
            </ChartCard>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-matrix-muted">{label}</label>
      {children}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className={CARD}>
      <h3 className="mb-4 font-semibold text-matrix-text">{title}</h3>
      {children}
    </div>
  );
}

function HighchartsBox({ options, height = 340, emptyText = 'Sin datos' }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const hasData = useMemo(() => {
    const series = options?.series || [];
    return series.some((s) => Array.isArray(s.data) && s.data.some((point) => {
      if (typeof point === 'number') return point > 0;
      if (Array.isArray(point)) return Number(point[1]) > 0;
      return Number(point?.y ?? point) > 0;
    }));
  }, [options]);

  useEffect(() => {
    let cancelled = false;
    if (!ref.current || !hasData) return undefined;

    loadHighcharts().then((Highcharts) => {
      if (cancelled || !ref.current) return;
      chartRef.current?.destroy();
      chartRef.current = Highcharts.chart(ref.current, options);
    }).catch(() => {
      if (ref.current) ref.current.innerHTML = '<div style="color:#A7C7B2;text-align:center;padding:80px 0">No se pudo cargar Highcharts</div>';
    });

    return () => {
      cancelled = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [options, hasData]);

  if (!hasData) return <EmptyChart text={emptyText} height={height} />;

  return <div ref={ref} className="w-full overflow-hidden rounded-xl border border-[#19E35A] bg-[#07111D]/70 backdrop-blur-xl" style={{ height }} />;
}

function baseOptions(extra) {
  return {
    chart: {
      backgroundColor: '#07111D',
      style: { fontFamily: 'Inter, Arial, sans-serif' },
    },
    credits: { enabled: false },
    title: { text: null },
    colors: COLORS,
    legend: {
      itemStyle: { color: '#EAFEF0', fontWeight: '600' },
      itemHoverStyle: { color: '#39FF14' },
    },
    tooltip: {
      backgroundColor: '#07111D',
      borderColor: '#19E35A',
      borderRadius: 8,
      style: { color: '#EAFEF0', fontSize: '12px' },
    },
    ...extra,
  };
}

function TimelineChart({ ordersData, incidentsData }) {
  const data = useMemo(() => {
    const map = new Map();
    ordersData.forEach((d) => map.set(d.period, { period: d.period, label: shortPeriod(d.period), orders: Number(d.total), incidents: 0 }));
    incidentsData.forEach((d) => {
      const cur = map.get(d.period) || { period: d.period, label: shortPeriod(d.period), orders: 0, incidents: 0 };
      cur.incidents = Number(d.total);
      map.set(d.period, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
  }, [ordersData, incidentsData]);

  const options = useMemo(() => baseOptions({
    chart: {
      backgroundColor: '#07111D',
      type: 'column',
      spacing: [18, 18, 18, 18],
      style: { fontFamily: 'Inter, Arial, sans-serif' },
    },
    xAxis: {
      categories: data.map((d) => d.label),
      lineColor: '#19E35A',
      tickColor: '#19E35A',
      labels: { style: { color: '#A7C7B2', fontSize: '11px' } },
    },
    yAxis: {
      allowDecimals: false,
      min: 0,
      title: { text: null },
      gridLineColor: 'rgba(167,199,178,0.12)',
      labels: { style: { color: '#A7C7B2', fontSize: '11px' } },
    },
    plotOptions: {
      column: { borderRadius: 6, pointPadding: 0.14, groupPadding: 0.16, borderWidth: 0 },
      areaspline: { marker: { enabled: true, radius: 4 }, fillOpacity: 0.22, lineWidth: 3 },
      series: { animation: { duration: 450 } },
    },
    series: [
      { type: 'areaspline', name: 'Ordenes tendencia', data: data.map((d) => d.orders), color: '#39FF14', fillColor: 'rgba(57,255,20,0.14)', zIndex: 2 },
      { type: 'column', name: 'Ordenes', data: data.map((d) => d.orders), color: '#39FF14' },
      { type: 'column', name: 'Incidencias', data: data.map((d) => d.incidents), color: '#FF4D57' },
    ],
  }), [data]);

  return <HighchartsBox options={options} height={360} emptyText="Sin datos en el periodo seleccionado" />;
}

function PieReport({ data }) {
  const options = useMemo(() => baseOptions({
    chart: {
      backgroundColor: '#07111D',
      type: 'pie',
      spacing: [12, 12, 12, 12],
      style: { fontFamily: 'Inter, Arial, sans-serif' },
    },
    tooltip: { pointFormat: '<b>{point.y}</b> ({point.percentage:.0f}%)' },
    plotOptions: {
      pie: {
        innerSize: '58%',
        borderColor: '#07111D',
        borderWidth: 4,
        dataLabels: {
          enabled: true,
          distance: 18,
          style: { color: '#EAFEF0', fontSize: '11px', textOutline: 'none' },
          format: '{point.name}: {point.y}',
        },
        showInLegend: true,
      },
      series: { animation: { duration: 450 } },
    },
    series: [{ name: 'Total', data }],
  }), [data]);

  return <HighchartsBox options={options} height={300} emptyText="Sin datos" />;
}

function EmptyChart({ text, height = 220 }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-[#19E35A] bg-[#0B1A26] text-sm text-matrix-muted" style={{ minHeight: height }}>
      {text}
    </div>
  );
}

function TechnicianList({ data }) {
  if (!data.length) return <EmptyChart text="Sin datos" />;
  return (
    <ul className="divide-y divide-matrix-primary/[0.08]">
      {data.map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-matrix-primary/25 bg-matrix-primary/10 text-xs font-bold text-matrix-primary">
            {getInitials(t.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-matrix-text">{t.full_name}</p>
            <p className="text-xs text-matrix-muted">Total: {t.total || 0} ordenes</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-matrix-primary">{t.completed || 0} completadas</span>
            <span className="font-semibold text-amber-400">{t.pending || 0} pendientes</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
