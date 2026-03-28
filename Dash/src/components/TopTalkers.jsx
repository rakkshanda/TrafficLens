import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatNumber } from '../data/mockData';

const THREAT_BAR_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs shadow-[var(--shadow-elevated)]">
      <p className="font-semibold text-text-primary font-mono">{data.ip_address}</p>
      <p className="text-text-secondary">{data.country} &middot; {data.attack_type}</p>
      <p className="text-text-primary mt-1">{formatNumber(data.attempts)} attempts</p>
    </div>
  );
}

export default function TopTalkers({ talkers }) {
  const chartData = talkers.slice(0, 8);

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Top Attackers
        </h2>
        <span className="text-[10px] font-mono text-text-tertiary">
          {talkers.length} flagged
        </span>
      </div>

      {talkers.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-text-tertiary text-sm">
          No threat data yet
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={formatNumber}
                  tick={{ fill: 'var(--color-chart-tick)', fontSize: 10 }}
                  axisLine={{ stroke: 'var(--color-chart-line)' }}
                  tickLine={{ stroke: 'var(--color-chart-line)' }}
                />
                <YAxis
                  type="category"
                  dataKey="ip_address"
                  width={110}
                  tick={{ fill: 'var(--color-chart-label)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  axisLine={{ stroke: 'var(--color-chart-line)' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,255,0.04)' }} />
                <Bar dataKey="attempts" radius={[0, 3, 3, 0]} animationDuration={800} animationEasing="ease-out">
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={THREAT_BAR_COLORS[entry.threat_level] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">#</th>
                  <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Attacker</th>
                  <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">Type</th>
                  <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary text-right">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {talkers.map((talker, i) => (
                  <tr
                    key={talker.ip_address}
                    className="border-t border-border-subtle hover:bg-bg-card-hover transition-colors"
                  >
                    <td className="px-3 py-2 text-text-tertiary text-xs">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-accent font-mono">{talker.ip_address}</div>
                      <div className="text-[10px] text-text-tertiary">{talker.country}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-text-secondary">{talker.attack_type}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-text-primary">{formatNumber(talker.attempts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
