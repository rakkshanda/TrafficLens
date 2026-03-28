import { useState, useEffect } from 'react';
import { Eye, EyeOff, Clock } from 'lucide-react';

export default function Controls({
  isMonitoring,
  selectedInterface,
  duration,
  interfaces,
  onStartMonitor,
  onStopMonitor,
  onInterfaceChange,
  onDurationChange,
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isMonitoring) return;
    const startMs = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Interface</label>
          <select
            value={selectedInterface}
            onChange={(e) => onInterfaceChange(e.target.value)}
            disabled={isMonitoring}
            className="bg-bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {interfaces.map((iface) => (
              <option key={iface} value={iface}>{iface}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-widest">Duration</label>
          <input
            type="number"
            min={5} max={300} step={5}
            value={duration}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            disabled={isMonitoring}
            className="bg-bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono w-20 focus:outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        <div className="ml-auto">
          <button
            onClick={isMonitoring ? onStopMonitor : onStartMonitor}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer btn-press ${
              isMonitoring
                ? 'bg-critical hover:bg-critical/80 text-text-primary'
                : 'bg-accent hover:bg-accent-hover text-text-inverse'
            }`}
          >
            {isMonitoring ? <><EyeOff className="w-4 h-4" />Stop</> : <><Eye className="w-4 h-4" />Monitor</>}
          </button>
        </div>

        {isMonitoring && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono text-sm text-accent">{fmt(elapsed)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
