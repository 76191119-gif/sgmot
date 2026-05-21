import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { planLabels } from '@/lib/utils';

const COLORS = ['#64748b', '#2563eb', '#8b5cf6', '#10b981'];

export default function ClientsByPlan({ clients = [] }) {
  const counts = clients.reduce((acc, c) => { acc[c.plan] = (acc[c.plan] || 0) + 1; return acc; }, {});
  const data = Object.entries(counts).map(([k, v]) => ({ name: planLabels[k] || k, value: v }));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold mb-4">Clientes por Plan</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>
      ) : (
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
      )}
    </div>
  );
}
