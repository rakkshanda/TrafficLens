import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatTime, formatNumber } from '../data/mockData';

const THREAT_COLORS = {
  critical: 'bg-critical-muted text-critical',
  high: 'bg-high-muted text-high',
  medium: 'bg-medium-muted text-medium',
  low: 'bg-low-muted text-low',
};

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0);
}

export default function HostTable({ hosts }) {
  const [sortField, setSortField] = useState('attempts');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'attempts' ? 'desc' : 'asc');
    }
  };

  const sortedHosts = useMemo(() => {
    return [...hosts].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'ip_address') {
        aVal = ipToNumber(aVal);
        bVal = ipToNumber(bVal);
      } else if (sortField === 'first_seen' || sortField === 'last_seen') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (typeof aVal !== 'number') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [hosts, sortField, sortDir]);

  const columns = [
    { key: 'ip_address', label: 'Source IP' },
    { key: 'country', label: 'Origin' },
    { key: 'attack_type', label: 'Attack Type' },
    { key: 'threat_level', label: 'Threat' },
    { key: 'attempts', label: 'Attempts' },
    { key: 'first_seen', label: 'First Seen' },
    { key: 'last_seen', label: 'Last Seen' },
  ];

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 flex flex-col shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Threat Inventory
        </h2>
        <span className="text-[10px] font-mono text-text-tertiary">
          {hosts.length} hosts
        </span>
      </div>

      {hosts.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-text-tertiary text-sm">
          No threats detected yet
        </div>
      ) : (
        <div className="overflow-auto max-h-[420px]">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-bg-card z-10">
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary cursor-pointer hover:text-text-secondary transition-colors whitespace-nowrap select-none"
                  >
                    {col.label}
                    {sortField === col.key && (
                      sortDir === 'asc'
                        ? <ChevronUp className="w-3 h-3 inline ml-0.5" />
                        : <ChevronDown className="w-3 h-3 inline ml-0.5" />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHosts.map((host, i) => (
                <tr
                  key={host.ip_address}
                  className="border-t border-border-subtle hover:bg-bg-card-hover transition-colors"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <td className="px-3 py-2 font-mono text-xs text-accent whitespace-nowrap">
                    {host.ip_address}
                  </td>
                  <td className="px-3 py-2 text-xs text-text-secondary whitespace-nowrap">
                    {host.country}
                  </td>
                  <td className="px-3 py-2 text-xs text-text-secondary whitespace-nowrap">
                    {host.attack_type}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${THREAT_COLORS[host.threat_level] || ''}`}>
                      {host.threat_level}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-text-primary whitespace-nowrap">
                    {formatNumber(host.attempts)}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-text-tertiary whitespace-nowrap">
                    {formatTime(host.first_seen)}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-text-tertiary whitespace-nowrap">
                    {formatTime(host.last_seen)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
