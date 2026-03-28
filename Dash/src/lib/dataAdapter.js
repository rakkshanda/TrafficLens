/**
 * Data adapter layer.
 * Transforms Supabase data + threat indicators into the exact shapes
 * that HostTable, TrafficFeed, and TopTalkers components expect.
 */

import { isRFC1918, formatBytes } from './threatAnalyzer';

function classifyIP(ip, hostsMap) {
  const host = hostsMap[ip];
  if (host && host.is_gateway) return 'Gateway';
  if (isRFC1918(ip)) return 'LAN';
  if (ip && ip.startsWith('127.')) return 'Local';
  return 'Ext';
}

/**
 * Adapt Supabase hosts + threat indicators → HostTable props shape.
 * Expected: { ip_address, country, attack_type, threat_level, attempts, blocked, first_seen, last_seen }
 */
export function adaptHosts(supabaseHosts, threatIndicators) {
  const indicatorMap = {};
  for (const ind of threatIndicators) {
    indicatorMap[ind.ip_address] = ind;
  }

  const hostsMap = {};
  for (const h of supabaseHosts) {
    hostsMap[h.ip_address] = h;
  }

  return supabaseHosts.map((h) => {
    const indicator = indicatorMap[h.ip_address];
    return {
      ip_address: h.ip_address,
      country: classifyIP(h.ip_address, hostsMap),
      attack_type: indicator ? indicator.attack_type : 'Normal Traffic',
      threat_level: indicator ? indicator.threat_level : 'low',
      attempts: indicator ? indicator.attempts : 0,
      blocked: false,
      first_seen: h.first_seen || null,
      last_seen: h.last_seen || null,
    };
  });
}

/**
 * Adapt connections + threat indicators → TrafficFeed events shape.
 * Expected: { id, timestamp, source_ip, country, target_port, attack_type, threat_level, status, summary }
 */
export function adaptEvents(connections, threatIndicators, scanMeta) {
  const indicatorMap = {};
  for (const ind of threatIndicators) {
    indicatorMap[ind.ip_address] = ind;
  }

  const hostsMap = {};
  if (scanMeta && scanMeta._hostsMap) {
    Object.assign(hostsMap, scanMeta._hostsMap);
  }

  // Distribute timestamps across scan duration
  const startMs = scanMeta && scanMeta.started_at
    ? new Date(scanMeta.started_at).getTime()
    : Date.now() - 60000;
  const endMs = scanMeta && scanMeta.ended_at
    ? new Date(scanMeta.ended_at).getTime()
    : startMs + (scanMeta ? (scanMeta.duration_seconds || 60) * 1000 : 60000);
  const spanMs = Math.max(endMs - startMs, 1000);

  // Sort connections by byte_count desc, then distribute timestamps
  const sorted = [...connections].sort((a, b) => (b.byte_count || 0) - (a.byte_count || 0));

  return sorted.slice(0, 500).map((conn, idx) => {
    const indicator = indicatorMap[conn.source_ip];
    const threatLevel = indicator ? indicator.threat_level : 'low';
    const attackType = indicator ? indicator.attack_type : 'Normal Traffic';

    let status;
    if (threatLevel === 'critical') status = 'blocked';
    else if (threatLevel === 'high' || threatLevel === 'medium') status = 'detected';
    else status = 'flagged';

    // Distribute event timestamps across scan window
    const fraction = sorted.length > 1 ? idx / (sorted.length - 1) : 0;
    const ts = new Date(startMs + fraction * spanMs).toISOString();

    const proto = conn.protocol || 'Unknown';
    const bytes = formatBytes(conn.byte_count || 0);
    const pkts = conn.packet_count || 0;
    const summary = `${proto} connection, ${bytes} transferred, ${pkts} packets`;

    return {
      id: conn.id || `conn-${idx}`,
      timestamp: ts,
      source_ip: conn.source_ip,
      country: classifyIP(conn.source_ip, hostsMap),
      target_port: conn.destination_port || 0,
      attack_type: attackType,
      threat_level: threatLevel,
      status,
      summary,
    };
  });
}

/**
 * Adapt threat indicators → TopTalkers shape.
 * Expected: { ip_address, country, attack_type, threat_level, attempts }
 */
export function adaptTopAttackers(threatIndicators, hostsMap = {}) {
  return threatIndicators
    .filter((ind) => ind.threat_level !== 'low')
    .sort((a, b) => {
      const diff = b.attempts - a.attempts;
      if (diff !== 0) return diff;
      return (a.ip_address || '').localeCompare(b.ip_address || '');
    })
    .slice(0, 8)
    .map((ind) => ({
      ip_address: ind.ip_address,
      country: classifyIP(ind.ip_address, hostsMap),
      attack_type: ind.attack_type,
      threat_level: ind.threat_level,
      attempts: ind.attempts,
    }));
}
