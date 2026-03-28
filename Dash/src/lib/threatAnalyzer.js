/**
 * Client-side threat detection engine.
 * Derives IDS-style threat indicators from raw TrafficLens scan data.
 */

const SEVERITY_ORDER = { critical: 3, high: 2, medium: 1, low: 0 };

function isRFC1918(ip) {
  if (!ip) return false;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// --- Rule: Port Scan Detection ---
function detectPortScans(connections) {
  const portsBySource = {};
  for (const conn of connections) {
    const src = conn.source_ip;
    if (!portsBySource[src]) portsBySource[src] = new Set();
    if (conn.destination_port) portsBySource[src].add(conn.destination_port);
  }

  const indicators = [];
  for (const [ip, ports] of Object.entries(portsBySource)) {
    const count = ports.size;
    let level = null;
    if (count >= 20) level = 'critical';
    else if (count >= 10) level = 'high';
    else if (count >= 5) level = 'medium';
    if (level) {
      indicators.push({
        ip_address: ip,
        attack_type: 'Port Scan',
        threat_level: level,
        attempts: count,
        summary: `Scanned ${count} unique ports`,
      });
    }
  }
  return indicators;
}

// --- Rule: SSH Brute Force ---
function detectSSHBruteForce(connections) {
  const packetsBySource = {};
  for (const conn of connections) {
    if (conn.destination_port === 22 || (conn.protocol && conn.protocol.toUpperCase() === 'SSH')) {
      const src = conn.source_ip;
      packetsBySource[src] = (packetsBySource[src] || 0) + (conn.packet_count || 0);
    }
  }

  const indicators = [];
  for (const [ip, packets] of Object.entries(packetsBySource)) {
    let level = null;
    if (packets >= 500) level = 'critical';
    else if (packets >= 200) level = 'high';
    else if (packets >= 50) level = 'medium';
    if (level) {
      indicators.push({
        ip_address: ip,
        attack_type: 'Brute Force (SSH)',
        threat_level: level,
        attempts: packets,
        summary: `SSH traffic: ${packets} packets`,
      });
    }
  }
  return indicators;
}

// --- Rule: RDP Scan ---
function detectRDPScan(connections) {
  const packetsBySource = {};
  for (const conn of connections) {
    if (conn.destination_port === 3389 || (conn.protocol && conn.protocol.toUpperCase() === 'RDP')) {
      const src = conn.source_ip;
      packetsBySource[src] = (packetsBySource[src] || 0) + (conn.packet_count || 0);
    }
  }

  const indicators = [];
  for (const [ip, packets] of Object.entries(packetsBySource)) {
    let level = null;
    if (packets >= 100) level = 'critical';
    else if (packets >= 50) level = 'high';
    else if (packets >= 20) level = 'medium';
    if (level) {
      indicators.push({
        ip_address: ip,
        attack_type: 'RDP Scan',
        threat_level: level,
        attempts: packets,
        summary: `RDP traffic: ${packets} packets`,
      });
    }
  }
  return indicators;
}

// --- Rule: SMB Lateral Movement ---
function detectSMBLateral(connections) {
  const targetsBySource = {};
  for (const conn of connections) {
    if (conn.destination_port === 445 || conn.destination_port === 139) {
      const src = conn.source_ip;
      if (isRFC1918(src)) {
        if (!targetsBySource[src]) targetsBySource[src] = new Set();
        if (isRFC1918(conn.destination_ip)) {
          targetsBySource[src].add(conn.destination_ip);
        }
      }
    }
  }

  const indicators = [];
  for (const [ip, targets] of Object.entries(targetsBySource)) {
    const count = targets.size;
    let level = null;
    if (count >= 5) level = 'high';
    else if (count >= 2) level = 'medium';
    if (level) {
      indicators.push({
        ip_address: ip,
        attack_type: 'Lateral Movement (SMB)',
        threat_level: level,
        attempts: count,
        summary: `SMB connections to ${count} internal hosts`,
      });
    }
  }
  return indicators;
}

// --- Rule: High Volume Anomaly ---
function detectHighVolume(hosts) {
  if (hosts.length < 2) return [];

  const totals = hosts.map((h) => ({
    ip: h.ip_address,
    total: (h.bytes_sent || 0) + (h.bytes_received || 0),
  }));

  const med = median(totals.map((t) => t.total));
  if (med < 1000) return []; // too little traffic to detect anomalies

  const indicators = [];
  for (const { ip, total } of totals) {
    const ratio = total / med;
    let level = null;
    if (ratio > 10) level = 'critical';
    else if (ratio > 5) level = 'high';
    else if (ratio > 3) level = 'medium';
    if (level) {
      indicators.push({
        ip_address: ip,
        attack_type: 'High Volume Traffic',
        threat_level: level,
        attempts: total,
        summary: `Transferred ${formatBytes(total)} (${ratio.toFixed(1)}x above median)`,
      });
    }
  }
  return indicators;
}

// --- Rule: DNS Anomaly ---
function detectDNSAnomaly(connections) {
  const bytesBySource = {};
  for (const conn of connections) {
    if (conn.destination_port === 53 || (conn.protocol && conn.protocol.toUpperCase() === 'DNS')) {
      const src = conn.source_ip;
      bytesBySource[src] = (bytesBySource[src] || 0) + (conn.byte_count || 0);
    }
  }

  const indicators = [];
  for (const [ip, bytes] of Object.entries(bytesBySource)) {
    let level = null;
    if (bytes > 2 * 1024 * 1024) level = 'high';
    else if (bytes > 500 * 1024) level = 'medium';
    if (level) {
      indicators.push({
        ip_address: ip,
        attack_type: 'DNS Anomaly',
        threat_level: level,
        attempts: bytes,
        summary: `DNS traffic: ${formatBytes(bytes)} from single source`,
      });
    }
  }
  return indicators;
}

// --- Main Analyzer ---

export function analyzeThreats(hosts, connections) {
  const allIndicators = [
    ...detectPortScans(connections),
    ...detectSSHBruteForce(connections),
    ...detectRDPScan(connections),
    ...detectSMBLateral(connections),
    ...detectHighVolume(hosts),
    ...detectDNSAnomaly(connections),
  ];

  // Merge by IP — keep highest severity, collect all indicators
  const byIP = {};
  for (const ind of allIndicators) {
    const existing = byIP[ind.ip_address];
    if (!existing) {
      byIP[ind.ip_address] = { ...ind, indicators: [ind] };
    } else {
      existing.indicators.push(ind);
      if (SEVERITY_ORDER[ind.threat_level] > SEVERITY_ORDER[existing.threat_level]) {
        existing.attack_type = ind.attack_type;
        existing.threat_level = ind.threat_level;
        existing.attempts = ind.attempts;
        existing.summary = ind.summary;
      }
    }
  }

  // Add unflagged hosts as "Normal Traffic" / "low"
  const allIPs = new Set(hosts.map((h) => h.ip_address));
  for (const conn of connections) {
    if (conn.source_ip) allIPs.add(conn.source_ip);
    if (conn.destination_ip) allIPs.add(conn.destination_ip);
  }

  for (const ip of allIPs) {
    if (!byIP[ip]) {
      byIP[ip] = {
        ip_address: ip,
        attack_type: 'Normal Traffic',
        threat_level: 'low',
        attempts: 0,
        summary: 'No suspicious activity detected',
        indicators: [],
      };
    }
  }

  // Derive status from threat_level
  const result = Object.values(byIP).map((ind) => ({
    ...ind,
    status:
      ind.threat_level === 'critical'
        ? 'blocked'
        : ind.threat_level === 'high' || ind.threat_level === 'medium'
          ? 'detected'
          : 'flagged',
  }));

  return result.sort(
    (a, b) => (SEVERITY_ORDER[b.threat_level] || 0) - (SEVERITY_ORDER[a.threat_level] || 0)
  );
}

export { isRFC1918, formatBytes };
