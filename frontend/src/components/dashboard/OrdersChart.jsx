import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DAYS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function buildLast7Days(orders) {
  const today = new Date();
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayName = DAYS_ES[d.getDay()];
    const created = orders.filter((o) => (o.created_date || '').slice(0, 10) === key).length;
    const completed = orders.filter((o) =>
      o.status === 'completado' && (o.completed_date || '').slice(0, 10) === key
    ).length;
    data.push({ day: dayName, Total: created, Completadas: completed });
  }
  return data;
}

export default function OrdersChart({ orders = [] }) {
  const data = buildLast7Days(orders);
  return (
    <div className="bg-black/60 border border-matrix-primary/20 rounded-xl p-5">
      <h3 className="font-semibold mb-4 text-matrix-text">Órdenes — últimos 7 días</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,255,65,0.1)" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#4a7c59' }} />
            <YAxis tick={{ fontSize: 12, fill: '#4a7c59' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#0a0a0a', border: '1px solid #00FF41', borderRadius: 8, fontSize: 12, color: '#CCFFCC' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Total" fill="#00FFFF" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Completadas" fill="#00FF41" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
