import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { categoryLabels } from '@/lib/utils';

export default function IncidentsByCategoryChart({ incidents = [] }) {
  const counts = incidents.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([k, v]) => ({ name: categoryLabels[k] || k, value: v }));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold mb-4">Incidencias por Categoría</h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="hsl(217 91% 50%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
