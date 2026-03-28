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
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ConnectionForm({ onConnect, isLoading, error }) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (url.trim() && key.trim()) onConnect(url.trim(), key.trim());
  }

  return (
    <div className="bg-bg-card rounded-xl border border-border p-10 text-center shadow-[var(--shadow-card)]">
      <div className="w-12 h-12 rounded-xl bg-accent-muted flex items-center justify-center mx-auto mb-4">
        <Radio className="w-6 h-6 text-accent" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-1.5">Connect to Backend</h3>
      <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
        Enter your Supabase credentials to load real scan data with threat analysis.
      </p>

      <form onSubmit={handleSubmit} className="max-w-sm mx-auto flex flex-col gap-3">
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Supabase URL</label>
          <input
            type="text"
            placeholder="https://your-project.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent transition-colors placeholder:text-text-tertiary"
          />
        </div>
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Anon Key</label>
          <input
            type="password"
            placeholder="your-anon-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="bg-bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent transition-colors placeholder:text-text-tertiary"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-critical text-xs text-left">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!url.trim() || !key.trim() || isLoading}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all btn-press ${
            url.trim() && key.trim() && !isLoading
              ? 'bg-accent text-text-inverse hover:bg-accent-hover cursor-pointer'
              : 'bg-accent/30 text-text-primary/50 cursor-not-allowed'
          }`}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
          {isLoading ? 'Connecting...' : 'Connect'}
        </button>
      </form>

      <p className="mt-6 text-[10px] text-text-tertiary">
        Set <code className="font-mono text-accent">VITE_SUPABASE_URL</code> and{' '}
        <code className="font-mono text-accent">VITE_SUPABASE_ANON_KEY</code> in{' '}
        <code className="font-mono">.env</code> to auto-connect.
      </p>
    </div>
  );
}

function ScanList({ scans, selectedScanId, onSelect, onRefresh, onDisconnect, isLoading }) {
  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">Scan History</h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-input transition-colors cursor-pointer btn-press"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-critical/80 hover:text-critical hover:bg-critical-muted transition-colors cursor-pointer btn-press"
          >
            <LogOut className="w-3 h-3" />
            Disconnect
          </button>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="p-8 text-center text-text-tertiary text-sm">
          {isLoading ? 'Loading scans...' : 'No scans found. Run a scan with --upload to see data.'}
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Date</th>
                <th className="text-left px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Interface</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Duration</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Hosts</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Packets</th>
                <th className="text-right px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Bytes</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr
                  key={scan.id}
                  onClick={() => onSelect(scan.id)}
                  className={`cursor-pointer transition-colors border-t border-border-subtle ${
                    selectedScanId === scan.id
                      ? 'bg-accent-muted text-text-primary'
                      : 'hover:bg-bg-card-hover text-text-secondary'
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-[11px]">{formatTime(scan.started_at)}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px]">{scan.interface_name || '-'}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[11px]">{scan.duration_seconds || 0}s</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[11px]">{scan.host_count || 0}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[11px]">{(scan.total_packets || 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-[11px]">{formatBytes(scan.total_bytes_captured)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ScanSelector({ scans, selectedScanId, onSelectScan, isConnected, onConnect, onDisconnect, onRefresh, isLoading, error }) {
  if (!isConnected) {
    return <ConnectionForm onConnect={onConnect} isLoading={isLoading} error={error} />;
  }
  return <ScanList scans={scans} selectedScanId={selectedScanId} onSelect={onSelectScan} onRefresh={onRefresh} onDisconnect={onDisconnect} isLoading={isLoading} />;
}
