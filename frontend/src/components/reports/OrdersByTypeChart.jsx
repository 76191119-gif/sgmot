import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { typeLabels } from '@/lib/utils';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export default function OrdersByTypeChart({ orders = [] }) {
  const counts = orders.reduce((acc, o) => {
    acc[o.type] = (acc[o.type] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([k, v]) => ({ name: typeLabels[k] || k, value: v }));

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-2">Órdenes por Tipo</h3>
        <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold mb-4">Órdenes por Tipo</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
