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
    if (!isMonitoring) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Interface
          </label>
          <select
            value={selectedInterface}
            onChange={(e) => onInterfaceChange(e.target.value)}
            disabled={isMonitoring}
            className="bg-bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {interfaces.map((iface) => (
              <option key={iface} value={iface}>
                {iface}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Duration (sec)
          </label>
          <input
            type="number"
            min={5}
            max={300}
            step={5}
            value={duration}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            disabled={isMonitoring}
            className="bg-bg-input border border-border rounded-lg px-3 py-2 text-sm text-text-primary font-mono w-24 focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-1 ml-auto">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            &nbsp;
          </label>
          <button
            onClick={isMonitoring ? onStopMonitor : onStartMonitor}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer ${
              isMonitoring
                ? 'bg-danger hover:bg-danger/80 text-white'
                : 'bg-success hover:bg-success/80 text-white'
            }`}
          >
            {isMonitoring ? (
              <>
                <EyeOff className="w-4 h-4" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Start Monitoring
              </>
            )}
          </button>
        </div>

        {isMonitoring && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm text-text-primary">
              {formatElapsed(elapsed)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
