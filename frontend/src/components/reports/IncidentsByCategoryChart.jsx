import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { categoryLabels } from '@/lib/utils';

export default function IncidentsByCategoryChart({ incidents = [] }) {
  const counts = incidents.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([k, v]) => ({ name: categoryLabels[k] || k, value: v }));

  return (
    <div className="cyber-surface rounded-xl border border-[#19E35A]/25 p-5">
      <h3 className="font-semibold mb-4">Incidencias por Categoría</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(25,227,90,0.14)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#A7C7B2' }} allowDecimals={false} axisLine={{ stroke: '#19E35A' }} tickLine={{ stroke: '#19E35A' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#A7C7B2' }} width={110} axisLine={{ stroke: '#19E35A' }} tickLine={{ stroke: '#19E35A' }} />
              <Tooltip contentStyle={{ background: '#07111D', border: '1px solid #19E35A', borderRadius: 8, color: '#EAFEF0', fontSize: 12 }} />
              <Bar dataKey="value" fill="#00E5FF" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
