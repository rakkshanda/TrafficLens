import { Shield, Sun, Moon } from 'lucide-react';

export default function Header({ isMonitoring, darkMode, onToggleTheme }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-accent" />
        <div>
          <h1 className="text-xl font-bold text-text-primary leading-tight">
            TrafficLens
          </h1>
          <p className="text-xs text-text-secondary">
            Intrusion Detection Dashboard
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isMonitoring
                ? 'bg-success animate-pulse-dot'
                : 'bg-text-secondary'
            }`}
          />
          <span className="text-sm text-text-secondary">
            {isMonitoring ? 'Monitoring' : 'Idle'}
          </span>
        </div>
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg hover:bg-bg-input transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
      </div>
    </header>
  );
}
