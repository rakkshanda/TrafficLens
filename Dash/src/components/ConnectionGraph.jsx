import { Network } from 'lucide-react';

export default function ConnectionGraph() {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Network Topology
        </h2>
        <span className="text-[10px] font-mono text-text-tertiary px-2 py-0.5 rounded bg-bg-input">
          Coming soon
        </span>
      </div>
      <div className="flex flex-col items-center justify-center h-40 border border-dashed border-border rounded-lg bg-bg-primary/30">
        <Network className="w-8 h-8 text-text-tertiary mb-2" />
        <p className="text-xs text-text-tertiary">
          Geographic attack origin visualization
        </p>
      </div>
    </div>
  );
}
