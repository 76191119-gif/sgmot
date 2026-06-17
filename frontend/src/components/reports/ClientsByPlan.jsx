import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { planLabels } from '@/lib/utils';

const COLORS = ['#6D8B78', '#00E5FF', '#1E90FF', '#39FF14', '#A6FF00'];

export default function ClientsByPlan({ clients = [] }) {
  const counts = clients.reduce((acc, c) => { acc[c.plan] = (acc[c.plan] || 0) + 1; return acc; }, {});
  const data = Object.entries(counts).map(([k, v]) => ({ name: planLabels[k] || k, value: v }));

  return (
    <div className="cyber-surface rounded-xl border border-[#19E35A]/25 p-5">
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
              <Tooltip contentStyle={{ background: '#07111D', border: '1px solid #19E35A', borderRadius: 8, color: '#EAFEF0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#A7C7B2' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
