import { Map } from 'lucide-react';

export default function ConnectionGraph() {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3">
        Attack Origin Map
      </h2>
      <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
        <Map className="w-10 h-10 text-text-secondary mb-3" />
        <p className="text-sm text-text-secondary">
          Geographic attack origin visualization
        </p>
        <p className="text-xs text-text-secondary mt-1">Coming soon</p>
      </div>
    </div>
  );
}
