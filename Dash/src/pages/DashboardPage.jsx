import { Shield } from 'lucide-react';
import Controls from '../components/Controls';
import HostTable from '../components/HostTable';
import TrafficFeed from '../components/TrafficFeed';
import TopTalkers from '../components/TopTalkers';
import ConnectionGraph from '../components/ConnectionGraph';
import ScanSelector from '../components/ScanSelector';
import useSupabaseData from '../hooks/useSupabaseData';

function DashboardPanels({ isMonitoring, selectedInterface, setSelectedInterface, duration, setDuration, interfaces, hosts, threatEvents, topAttackers, startMonitor, stopMonitor }) {
  return (
    <div className="animate-fade-in flex flex-col gap-5">
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <HostTable hosts={hosts} />
        </div>
        <div className="lg:col-span-2">
          <TrafficFeed events={threatEvents} />
        </div>
      </div>

      <TopTalkers talkers={topAttackers} />
      <ConnectionGraph />
    </div>
  );
}

export default function DashboardPage() {
  const liveData = useSupabaseData();

  return (
    <div>
      <main className="max-w-[1440px] mx-auto p-6 flex flex-col gap-5">
        {/* Status bar */}
        <div className="flex items-center bg-bg-card rounded-xl border border-border p-3 px-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-text-primary">Dashboard</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {liveData.isConnected && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-low animate-pulse-dot" />
                <span className="text-[10px] font-mono text-low">CONNECTED</span>
              </span>
            )}
            <span className="text-xs text-text-tertiary">
              {liveData.isConnected
                ? liveData.selectedScanId
                  ? `Viewing scan on ${liveData.selectedInterface || 'unknown'}`
                  : 'Select a scan'
                : 'Connect to backend'}
            </span>
          </div>
        </div>

        <ScanSelector
          scans={liveData.scans}
          selectedScanId={liveData.selectedScanId}
          onSelectScan={liveData.setSelectedScanId}
          isConnected={liveData.isConnected}
          onConnect={liveData.connect}
          onDisconnect={liveData.disconnect}
          onRefresh={liveData.refreshScans}
          isLoading={liveData.isLoading}
          error={liveData.error}
        />

        {liveData.isConnected && liveData.selectedScanId && (
          <DashboardPanels {...liveData} />
        )}
      </main>

      <footer className="text-center py-4 text-[10px] text-text-tertiary border-t border-border mt-6">
        TrafficLens v0.1 &mdash; Intrusion Detection
      </footer>
    </div>
  );
}
