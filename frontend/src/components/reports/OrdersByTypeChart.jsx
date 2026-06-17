import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { typeLabels } from '@/lib/utils';

const COLORS = ['#39FF14', '#00E5FF', '#FFD83D', '#FF4D57', '#1E90FF', '#A6FF00'];

export default function OrdersByTypeChart({ orders = [] }) {
  const counts = orders.reduce((acc, o) => {
    acc[o.type] = (acc[o.type] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([k, v]) => ({ name: typeLabels[k] || k, value: v }));

  if (data.length === 0) {
    return (
      <div className="cyber-surface rounded-xl border border-[#19E35A]/25 p-5">
        <h3 className="font-semibold mb-2">Órdenes por Tipo</h3>
        <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>
      </div>
    );
  }

  return (
    <div className="cyber-surface rounded-xl border border-[#19E35A]/25 p-5">
      <h3 className="font-semibold mb-4">Órdenes por Tipo</h3>
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
    </div>
  );
}
