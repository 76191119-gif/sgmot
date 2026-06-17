import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DAYS_ES = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

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
    <div className="cyber-surface rounded-xl border border-[#19E35A]/25 p-5">
      <h3 className="font-semibold mb-4 text-matrix-text">Ordenes - ultimos 7 dias</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(25,227,90,0.14)" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#A7C7B2' }} axisLine={{ stroke: '#19E35A' }} tickLine={{ stroke: '#19E35A' }} />
            <YAxis tick={{ fontSize: 12, fill: '#A7C7B2' }} allowDecimals={false} axisLine={{ stroke: '#19E35A' }} tickLine={{ stroke: '#19E35A' }} />
            <Tooltip
              cursor={{ fill: 'rgba(57,255,20,0.06)' }}
              contentStyle={{ background: '#07111D', border: '1px solid #19E35A', borderRadius: 8, fontSize: 12, color: '#EAFEF0', boxShadow: '0 0 22px rgba(57,255,20,0.14)' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#A7C7B2' }} />
            <Bar dataKey="Total" fill="#00E5FF" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Completadas" fill="#39FF14" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
