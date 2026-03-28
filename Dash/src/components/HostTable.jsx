import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatTime, formatNumber } from '../data/mockData';

const THREAT_COLORS = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-green-500/20 text-green-400',
};

function ipToNumber(ip) {
  return ip
    .split('.')
    .reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0);
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
      } else if (typeof aVal === 'number') {
        // keep as number
      } else {
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

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 inline ml-1" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
    );
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 flex flex-col">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3">
        Threat Inventory
      </h2>
      {hosts.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-text-secondary text-sm">
          No threats detected yet
        </div>
      ) : (
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-bg-input z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-secondary cursor-pointer hover:text-text-primary transition-colors whitespace-nowrap select-none"
                  >
                    {col.label}
                    <SortIcon field={col.key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedHosts.map((host) => (
                <tr
                  key={host.ip_address}
                  className="border-t border-border/50 hover:bg-bg-input/50 transition-colors"
                >
                  <td className="px-3 py-2 font-mono text-accent whitespace-nowrap">
                    {host.ip_address}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {host.country}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {host.attack_type}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                        THREAT_COLORS[host.threat_level] || ''
                      }`}
                    >
                      {host.threat_level}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-text-primary whitespace-nowrap">
                    {formatNumber(host.attempts)}
                  </td>
                  <td className="px-3 py-2 font-mono text-text-secondary whitespace-nowrap">
                    {formatTime(host.first_seen)}
                  </td>
                  <td className="px-3 py-2 font-mono text-text-secondary whitespace-nowrap">
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
