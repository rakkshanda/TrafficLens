import { useState } from 'react';
import { FlaskConical, Radio } from 'lucide-react';
import Controls from '../components/Controls';
import HostTable from '../components/HostTable';
import TrafficFeed from '../components/TrafficFeed';
import TopTalkers from '../components/TopTalkers';
import ConnectionGraph from '../components/ConnectionGraph';
import useTrafficData from '../hooks/useTrafficData';

function DashboardPanels({ isMonitoring, selectedInterface, setSelectedInterface, duration, setDuration, interfaces, hosts, threatEvents, topAttackers, startMonitor, stopMonitor }) {
  return (
    <>
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
    </>
  );
}

function LivePlaceholder() {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-12 text-center">
      <Radio className="w-12 h-12 text-accent mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-text-primary mb-2">
        Live Mode
      </h3>
      <p className="text-text-secondary max-w-md mx-auto mb-6">
        This tab connects to the TrafficLens backend for real-time intrusion
        detection data from your system. Configure your backend endpoint below
        to start receiving live threat data.
      </p>

      <div className="max-w-sm mx-auto flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-left">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Backend URL
          </label>
          <input
            type="text"
            placeholder="http://localhost:8080"
            className="bg-bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent placeholder:text-text-secondary/50"
          />
        </div>
        <div className="flex flex-col gap-1 text-left">
          <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            API Key (optional)
          </label>
          <input
            type="password"
            placeholder="your-api-key"
            className="bg-bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-mono focus:outline-none focus:border-accent placeholder:text-text-secondary/50"
          />
        </div>
        <button
          disabled
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-accent/50 text-white/70 cursor-not-allowed"
        >
          <Radio className="w-4 h-4" />
          Connect (Backend not configured)
        </button>
      </div>

      <p className="mt-8 text-xs text-text-secondary">
        Your teammate will implement the Python backend. Once running, enter the
        URL above and this tab will show live threat data using the same panels
        as the Test tab.
      </p>
    </div>
  );
}

const TABS = [
  { id: 'test', label: 'Test', icon: FlaskConical },
  { id: 'live', label: 'Live', icon: Radio },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('test');

  const testData = useTrafficData();

  return (
    <div>
      <main className="max-w-[1440px] mx-auto p-6 flex flex-col gap-6">
        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-bg-card rounded-xl border border-border p-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-input'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-text-secondary pr-3">
            {activeTab === 'test'
              ? 'Simulated data for testing'
              : 'Real-time backend connection'}
          </span>
        </div>

        {/* Tab content */}
        {activeTab === 'test' ? (
          <DashboardPanels {...testData} />
        ) : (
          <LivePlaceholder />
        )}
      </main>

      <footer className="text-center py-4 text-xs text-text-secondary border-t border-border">
        TrafficLens v0.1 &mdash; Intrusion Detection
      </footer>
    </div>
  );
}
