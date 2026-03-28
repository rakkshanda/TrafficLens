import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatNumber } from '../data/mockData';

const THREAT_COLORS_MAP = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-bg-input border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-text-primary">{data.ip_address}</p>
      <p className="text-text-secondary">{data.country} &middot; {data.attack_type}</p>
      <p className="text-text-primary mt-1">
        {formatNumber(data.attempts)} attempts
      </p>
    </div>
  );
}

export default function TopTalkers({ talkers }) {
  const chartData = talkers.slice(0, 8);

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3">
        Top Attackers
      </h2>
      {talkers.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-text-secondary text-sm">
          No threat data yet
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={formatNumber}
                  tick={{ fill: 'var(--color-chart-tick)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--color-chart-line)' }}
                  tickLine={{ stroke: 'var(--color-chart-line)' }}
                />
                <YAxis
                  type="category"
                  dataKey="ip_address"
                  width={120}
                  tick={{ fill: 'var(--color-chart-label)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--color-chart-line)' }}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(239, 68, 68, 0.08)' }}
                />
                <Bar dataKey="attempts" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={THREAT_COLORS_MAP[entry.threat_level] || '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Attacker</th>
                  <th className="px-3 py-2">Attack Type</th>
                  <th className="px-3 py-2 text-right">Attempts</th>
                </tr>
              </thead>
              <tbody>
                {talkers.map((talker, i) => (
                  <tr
                    key={talker.ip_address}
                    className="border-t border-border/50 hover:bg-bg-input/50 transition-colors"
                  >
                    <td className="px-3 py-2 text-text-secondary">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="text-text-primary font-mono">{talker.ip_address}</div>
                      <div className="text-xs text-text-secondary">
                        {talker.country}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {talker.attack_type}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-text-primary">
                      {formatNumber(talker.attempts)}
                    </td>
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
