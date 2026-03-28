import Controls from '../components/Controls';
import HostTable from '../components/HostTable';
import TrafficFeed from '../components/TrafficFeed';
import TopTalkers from '../components/TopTalkers';
import ConnectionGraph from '../components/ConnectionGraph';
import ScanSelector from '../components/ScanSelector';
import useSupabaseData from '../hooks/useSupabaseData';

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

export default function DashboardPage() {
  const liveData = useSupabaseData();

  return (
    <div>
      <main className="max-w-[1440px] mx-auto p-6 flex flex-col gap-6">
        {/* Status bar */}
        <div className="flex items-center bg-bg-card rounded-xl border border-border p-1.5 px-4">
          <span className="text-sm font-medium text-text-primary">Live Data</span>
          <span className="ml-auto text-xs text-text-secondary pr-1">
            {liveData.isConnected
              ? liveData.selectedScanId
                ? `Viewing scan on ${liveData.selectedInterface || 'unknown'}`
                : 'Select a scan below'
              : 'Connect to Supabase backend'}
          </span>
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

      <footer className="text-center py-4 text-xs text-text-secondary border-t border-border">
        TrafficLens v0.1 &mdash; Intrusion Detection
      </footer>
    </div>
  );
}
