import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createSupabaseClient, getDefaultClient, hasDefaultCredentials } from '../lib/supabaseClient';
import { analyzeThreats } from '../lib/threatAnalyzer';
import { adaptHosts, adaptEvents, adaptTopAttackers } from '../lib/dataAdapter';

export default function useSupabaseData() {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState(null);
  const [rawData, setRawData] = useState({ hosts: [], connections: [], protocolSummary: [] });
  const [selectedScan, setSelectedScan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchedScanRef = useRef(null);

  // Auto-connect if env vars present
  useEffect(() => {
    if (hasDefaultCredentials() && !client) {
      const defaultClient = getDefaultClient();
      if (defaultClient) {
        setClient(defaultClient);
        setIsConnected(true);
      }
    }
  }, [client]);

  // Fetch scan list when connected
  useEffect(() => {
    if (!client || !isConnected) return;

    async function fetchScans() {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: err } = await client
          .from('scans')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(50);

        if (err) throw new Error(err.message);
        setScans(data || []);
      } catch (e) {
        setError(`Failed to fetch scans: ${e.message}`);
        setScans([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchScans();
  }, [client, isConnected]);

  // Fetch scan detail when a scan is selected
  useEffect(() => {
    if (!client || !selectedScanId || fetchedScanRef.current === selectedScanId) return;
    fetchedScanRef.current = selectedScanId;

    const scan = scans.find((s) => s.id === selectedScanId);
    setSelectedScan(scan || null);

    async function fetchScanData() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch hosts and connections in parallel
        const [hostsRes, connRes] = await Promise.all([
          client.from('hosts').select('*').eq('scan_id', selectedScanId),
          client.from('connections').select('*').eq('scan_id', selectedScanId),
        ]);

        if (hostsRes.error) throw new Error(hostsRes.error.message);
        if (connRes.error) throw new Error(connRes.error.message);

        const hosts = hostsRes.data || [];
        const connections = connRes.data || [];

        // Fetch protocol_summary using host IDs
        let protocolSummary = [];
        const hostIds = hosts.map((h) => h.id).filter(Boolean);
        if (hostIds.length > 0) {
          const { data: protoData, error: protoErr } = await client
            .from('protocol_summary')
            .select('*')
            .in('host_id', hostIds);

          if (!protoErr) protocolSummary = protoData || [];
        }

        setRawData({ hosts, connections, protocolSummary });
      } catch (e) {
        setError(`Failed to load scan data: ${e.message}`);
        setRawData({ hosts: [], connections: [], protocolSummary: [] });
      } finally {
        setIsLoading(false);
      }
    }

    fetchScanData();
  }, [client, selectedScanId, scans]);

  // Analyze threats and adapt data
  const threatIndicators = useMemo(
    () => analyzeThreats(rawData.hosts, rawData.connections),
    [rawData]
  );

  const hostsMap = useMemo(() => {
    const map = {};
    for (const h of rawData.hosts) {
      map[h.ip_address] = h;
    }
    return map;
  }, [rawData.hosts]);

  const hosts = useMemo(
    () => adaptHosts(rawData.hosts, threatIndicators),
    [rawData.hosts, threatIndicators]
  );

  const threatEvents = useMemo(
    () =>
      adaptEvents(rawData.connections, threatIndicators, {
        ...selectedScan,
        _hostsMap: hostsMap,
      }),
    [rawData.connections, threatIndicators, selectedScan, hostsMap]
  );

  const topAttackers = useMemo(
    () => adaptTopAttackers(threatIndicators, hostsMap),
    [threatIndicators, hostsMap]
  );

  const connect = useCallback(
    (url, key) => {
      try {
        const newClient = createSupabaseClient(url, key);
        setClient(newClient);
        setIsConnected(true);
        setError(null);
        setSelectedScanId(null);
        fetchedScanRef.current = null;
        setRawData({ hosts: [], connections: [], protocolSummary: [] });
      } catch (e) {
        setError(`Connection failed: ${e.message}`);
      }
    },
    []
  );

  const disconnect = useCallback(() => {
    setClient(null);
    setIsConnected(false);
    setScans([]);
    setSelectedScanId(null);
    setSelectedScan(null);
    fetchedScanRef.current = null;
    setRawData({ hosts: [], connections: [], protocolSummary: [] });
    setError(null);
  }, []);

  const refreshScans = useCallback(async () => {
    if (!client) return;
    setIsLoading(true);
    try {
      const { data, error: err } = await client
        .from('scans')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (err) throw new Error(err.message);
      setScans(data || []);
    } catch (e) {
      setError(`Refresh failed: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // Return shape matching useTrafficData for DashboardPanels compatibility
  return {
    // DashboardPanels-compatible props
    isMonitoring: isConnected && !!selectedScanId,
    selectedInterface: selectedScan ? selectedScan.interface_name : '',
    setSelectedInterface: () => {},
    duration: selectedScan ? selectedScan.duration_seconds : 0,
    setDuration: () => {},
    interfaces: selectedScan ? [selectedScan.interface_name] : [],
    hosts,
    threatEvents,
    topAttackers,
    startMonitor: () => {},
    stopMonitor: () => setSelectedScanId(null),

    // Live-specific extras
    scans,
    selectedScanId,
    setSelectedScanId: (id) => {
      fetchedScanRef.current = null;
      setSelectedScanId(id);
    },
    selectedScan,
    isConnected,
    connect,
    disconnect,
    refreshScans,
    isLoading,
    error,
  };
}
