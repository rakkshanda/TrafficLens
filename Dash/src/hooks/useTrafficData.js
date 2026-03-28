import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MOCK_INTERFACES,
  MOCK_HOSTS,
  MOCK_TOP_ATTACKERS,
  generateThreatEvent,
} from '../data/mockData';

const MAX_EVENTS = 500;

export default function useTrafficData() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState(MOCK_INTERFACES[0]);
  const [duration, setDuration] = useState(60);
  const [hosts, setHosts] = useState([]);
  const [threatEvents, setThreatEvents] = useState([]);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const stopMonitor = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const startMonitor = useCallback(() => {
    setHosts([...MOCK_HOSTS]);
    setThreatEvents([]);
    setIsMonitoring(true);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      setThreatEvents((prev) => {
        const newEvent = generateThreatEvent();
        const updated = [...prev, newEvent];
        return updated.length > MAX_EVENTS
          ? updated.slice(updated.length - MAX_EVENTS)
          : updated;
      });
    }, 600 + Math.random() * 900);
  }, []);

  // Auto-stop when duration is reached
  useEffect(() => {
    if (!isMonitoring) return;

    const checkDuration = setInterval(() => {
      if (startTimeRef.current && Date.now() - startTimeRef.current >= duration * 1000) {
        stopMonitor();
      }
    }, 1000);

    return () => clearInterval(checkDuration);
  }, [isMonitoring, duration, stopMonitor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const topAttackers = useMemo(() => {
    if (threatEvents.length === 0) return MOCK_TOP_ATTACKERS;

    const byHost = {};
    for (const event of threatEvents) {
      const key = event.source_ip;
      if (!byHost[key]) {
        byHost[key] = {
          ip_address: key,
          country: event.country,
          attack_type: event.attack_type,
          threat_level: event.threat_level,
          attempts: 0,
        };
      }
      byHost[key].attempts += 1;
    }

    return Object.values(byHost)
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 8);
  }, [threatEvents]);

  return {
    isMonitoring,
    selectedInterface,
    setSelectedInterface,
    duration,
    setDuration,
    interfaces: MOCK_INTERFACES,
    hosts,
    threatEvents,
    topAttackers,
    startMonitor,
    stopMonitor,
  };
}
