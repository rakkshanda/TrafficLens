import { useState } from 'react';
import { Radio, RefreshCw, LogOut, Loader2, AlertCircle } from 'lucide-react';

function formatBytes(n) {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ConnectionForm({ onConnect, isLoading, error }) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (url.trim() && key.trim()) {
      onConnect(url.trim(), key.trim());
    }
  }

  return (
    <div className="bg-bg-card rounded-xl border border-border p-12 text-center">
      <Radio className="w-12 h-12 text-accent mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-text-primary mb-2">Live Mode</h3>
      <p className="text-text-secondary max-w-md mx-auto mb-6">
        Connect to your TrafficLens Supabase backend to view real scan data
        with threat analysis.
      </p>

      <form onSubmit={handleSubmit} className="max-w-sm mx-auto flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-left">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Supabase URL
          </label>
          <input
            type="text"
            placeholder="https://your-project.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent placeholder:text-text-secondary/50"
          />
        </div>
        <div className="flex flex-col gap-1 text-left">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Anon Key
          </label>
          <input
            type="password"
            placeholder="your-anon-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="bg-bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent placeholder:text-text-secondary/50"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!url.trim() || !key.trim() || isLoading}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            url.trim() && key.trim() && !isLoading
              ? 'bg-accent text-white hover:bg-accent-hover cursor-pointer'
              : 'bg-accent/50 text-white/70 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Radio className="w-4 h-4" />
          )}
          {isLoading ? 'Connecting...' : 'Connect'}
        </button>
      </form>

      <p className="mt-8 text-xs text-text-secondary">
        Set <code className="font-mono text-accent">VITE_SUPABASE_URL</code> and{' '}
        <code className="font-mono text-accent">VITE_SUPABASE_ANON_KEY</code> in{' '}
        <code className="font-mono">.env</code> to auto-connect.
      </p>
    </div>
  );
}

function ScanList({ scans, selectedScanId, onSelect, onRefresh, onDisconnect, isLoading }) {
  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Scan History</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-input transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect
          </button>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="p-8 text-center text-text-secondary text-sm">
          {isLoading ? 'Loading scans...' : 'No scans found. Run a TrafficLens scan with --upload to see data here.'}
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-text-secondary uppercase tracking-wider border-b border-border">
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Interface</th>
                <th className="text-right px-4 py-2">Duration</th>
                <th className="text-right px-4 py-2">Hosts</th>
                <th className="text-right px-4 py-2">Packets</th>
                <th className="text-right px-4 py-2">Bytes</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr
                  key={scan.id}
                  onClick={() => onSelect(scan.id)}
                  className={`cursor-pointer transition-colors border-b border-border/50 ${
                    selectedScanId === scan.id
                      ? 'bg-accent/10 text-text-primary'
                      : 'hover:bg-bg-input text-text-secondary'
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {formatTime(scan.started_at)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{scan.interface_name || '-'}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{scan.duration_seconds || 0}s</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">{scan.host_count || 0}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">
                    {(scan.total_packets || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs">
                    {formatBytes(scan.total_bytes_captured)}
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

export default function ScanSelector({
  scans,
  selectedScanId,
  onSelectScan,
  isConnected,
  onConnect,
  onDisconnect,
  onRefresh,
  isLoading,
  error,
}) {
  if (!isConnected) {
    return <ConnectionForm onConnect={onConnect} isLoading={isLoading} error={error} />;
  }

  return (
    <ScanList
      scans={scans}
      selectedScanId={selectedScanId}
      onSelect={onSelectScan}
      onRefresh={onRefresh}
      onDisconnect={onDisconnect}
      isLoading={isLoading}
    />
  );
}
