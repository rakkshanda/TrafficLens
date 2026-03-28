import { useState, useEffect } from 'react';
import Header from './components/Header';
import Controls from './components/Controls';
import HostTable from './components/HostTable';
import TrafficFeed from './components/TrafficFeed';
import TopTalkers from './components/TopTalkers';
import ConnectionGraph from './components/ConnectionGraph';
import useTrafficData from './hooks/useTrafficData';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('trafficlens-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('trafficlens-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const {
    isMonitoring,
    selectedInterface,
    setSelectedInterface,
    duration,
    setDuration,
    interfaces,
    hosts,
    threatEvents,
    topAttackers,
    startMonitor,
    stopMonitor,
  } = useTrafficData();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      <Header isMonitoring={isMonitoring} darkMode={darkMode} onToggleTheme={() => setDarkMode((d) => !d)} />

      <main className="max-w-[1440px] mx-auto p-6 flex flex-col gap-6">
        <Controls
          isMonitoring={isMonitoring}
          selectedInterface={selectedInterface}
          duration={duration}
          interfaces={interfaces}
          onStartMonitor={startMonitor}
          onStopMonitor={stopMonitor}
          onInterfaceChange={setSelectedInterface}
          onDurationChange={setDuration}
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <HostTable hosts={hosts} />
          </div>
          <div className="lg:col-span-2">
            <TrafficFeed events={threatEvents} />
          </div>
        </div>

        <TopTalkers talkers={topAttackers} />

        <ConnectionGraph />
      </main>

      <footer className="text-center py-4 text-xs text-text-secondary border-t border-border">
        TrafficLens v0.1 &mdash; Intrusion Detection &mdash; Mock Data
      </footer>
    </div>
  );
}
