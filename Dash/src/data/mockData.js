export const MOCK_INTERFACES = ['en0', 'eth0', 'wlan0'];

const THREAT_LEVELS = ['critical', 'high', 'medium', 'low'];
const ATTACK_TYPES = ['Brute Force', 'Port Scan', 'DDoS', 'SQL Injection', 'XSS Probe', 'Directory Traversal', 'Credential Stuffing', 'Exploit Attempt'];
const COUNTRIES = ['CN', 'RU', 'US', 'BR', 'IN', 'KR', 'DE', 'NG', 'IR', 'UA'];

export const MOCK_HOSTS = [
  {
    ip_address: '45.227.253.109',
    country: 'BR',
    attack_type: 'Brute Force',
    threat_level: 'critical',
    attempts: 1847,
    blocked: true,
    first_seen: '2026-03-28T08:12:00Z',
    last_seen: '2026-03-28T10:15:32Z',
  },
  {
    ip_address: '103.45.67.201',
    country: 'CN',
    attack_type: 'Port Scan',
    threat_level: 'high',
    attempts: 934,
    blocked: true,
    first_seen: '2026-03-28T09:01:05Z',
    last_seen: '2026-03-28T10:14:58Z',
  },
  {
    ip_address: '185.220.101.34',
    country: 'DE',
    attack_type: 'Exploit Attempt',
    threat_level: 'critical',
    attempts: 612,
    blocked: true,
    first_seen: '2026-03-28T07:45:33Z',
    last_seen: '2026-03-28T10:15:01Z',
  },
  {
    ip_address: '91.240.118.72',
    country: 'RU',
    attack_type: 'Credential Stuffing',
    threat_level: 'high',
    attempts: 489,
    blocked: true,
    first_seen: '2026-03-28T09:22:10Z',
    last_seen: '2026-03-28T10:12:44Z',
  },
  {
    ip_address: '14.161.32.88',
    country: 'IN',
    attack_type: 'SQL Injection',
    threat_level: 'critical',
    attempts: 356,
    blocked: true,
    first_seen: '2026-03-28T08:55:22Z',
    last_seen: '2026-03-28T10:15:10Z',
  },
  {
    ip_address: '211.59.14.107',
    country: 'KR',
    attack_type: 'DDoS',
    threat_level: 'high',
    attempts: 278,
    blocked: true,
    first_seen: '2026-03-28T09:33:05Z',
    last_seen: '2026-03-28T10:15:28Z',
  },
  {
    ip_address: '78.153.140.29',
    country: 'IR',
    attack_type: 'XSS Probe',
    threat_level: 'medium',
    attempts: 145,
    blocked: true,
    first_seen: '2026-03-28T09:48:15Z',
    last_seen: '2026-03-28T10:10:22Z',
  },
  {
    ip_address: '197.234.240.51',
    country: 'NG',
    attack_type: 'Directory Traversal',
    threat_level: 'medium',
    attempts: 89,
    blocked: true,
    first_seen: '2026-03-28T10:02:40Z',
    last_seen: '2026-03-28T10:14:55Z',
  },
];

const ATTACK_SUMMARIES = {
  'Brute Force': [
    'Failed SSH login attempt (root)',
    'Failed SSH login attempt (admin)',
    'Failed RDP authentication',
    'Repeated FTP login failures',
    'HTTP basic auth brute force',
  ],
  'Port Scan': [
    'SYN scan on ports 1-1024',
    'UDP scan on port 161 (SNMP)',
    'TCP connect scan on port 3389',
    'SYN scan on port 443',
    'Stealth scan on port 8080',
  ],
  'DDoS': [
    'SYN flood detected (5000 pps)',
    'UDP flood on port 53',
    'HTTP GET flood on /',
    'ICMP flood detected',
    'Slowloris connection attempt',
  ],
  'SQL Injection': [
    "GET /login?user=' OR 1=1--",
    "POST /api/users UNION SELECT",
    "GET /search?q='; DROP TABLE--",
    "POST /login with SQLi payload",
    "GET /products?id=1 AND 1=1",
  ],
  'XSS Probe': [
    'GET /search?q=<script>alert(1)</script>',
    'POST /comment with embedded <svg onload>',
    'GET /profile?name=<img onerror=...>',
    'Reflected XSS attempt on /feedback',
  ],
  'Directory Traversal': [
    'GET /../../etc/passwd',
    'GET /static/../../../etc/shadow',
    'GET /files?path=../../../root/.ssh',
    'GET /download?file=../../../../etc/hosts',
  ],
  'Credential Stuffing': [
    'Automated login with leaked credentials',
    'Bulk POST /api/auth from credential list',
    'Rotating user agents on /login',
    'Sequential email/password pairs tested',
  ],
  'Exploit Attempt': [
    'CVE-2024-3094 (xz backdoor probe)',
    'Log4Shell payload in User-Agent',
    'Apache Struts RCE attempt',
    'Spring4Shell exploit probe',
    'Shellshock payload in HTTP header',
  ],
};

const STATUSES = ['blocked', 'detected', 'flagged'];
const TARGET_PORTS = [22, 80, 443, 3306, 5432, 8080, 3389, 21, 25, 8443];

let eventIdCounter = 0;

export function generateThreatEvent() {
  const host = MOCK_HOSTS[Math.floor(Math.random() * MOCK_HOSTS.length)];
  const summaries = ATTACK_SUMMARIES[host.attack_type];
  const summary = summaries[Math.floor(Math.random() * summaries.length)];
  const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
  const target_port = TARGET_PORTS[Math.floor(Math.random() * TARGET_PORTS.length)];

  eventIdCounter += 1;

  return {
    id: `evt-${eventIdCounter}`,
    timestamp: new Date().toISOString(),
    source_ip: host.ip_address,
    country: host.country,
    target_port,
    attack_type: host.attack_type,
    threat_level: host.threat_level,
    status,
    summary,
  };
}

export const MOCK_THREAT_EVENTS = Array.from({ length: 50 }, () => {
  const event = generateThreatEvent();
  const offsetMs = Math.floor(Math.random() * 900000);
  event.timestamp = new Date(
    new Date('2026-03-28T10:00:00Z').getTime() + offsetMs
  ).toISOString();
  return event;
}).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

export const MOCK_TOP_ATTACKERS = MOCK_HOSTS
  .map((h) => ({
    ip_address: h.ip_address,
    country: h.country,
    attack_type: h.attack_type,
    threat_level: h.threat_level,
    attempts: h.attempts,
  }))
  .sort((a, b) => b.attempts - a.attempts);

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

export function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour12: false });
}

export function formatNumber(n) {
  return n.toLocaleString();
}
