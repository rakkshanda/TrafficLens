import { useState, useEffect, useRef } from 'react';

const THREAT_COLORS = {
  critical: { bg: 'bg-critical-muted', text: 'text-critical' },
  high: { bg: 'bg-high-muted', text: 'text-high' },
  medium: { bg: 'bg-medium-muted', text: 'text-medium' },
  low: { bg: 'bg-low-muted', text: 'text-low' },
};

const STATUS_ICONS = { blocked: '\u2718', detected: '\u26A0', flagged: '\u2691' };

const FEED_EVENTS = [
  { ip: '45.227.253.109', port: 22, type: 'Brute Force', level: 'critical', status: 'blocked', summary: 'Failed SSH login (root)' },
  { ip: '103.45.67.201', port: 443, type: 'Port Scan', level: 'high', status: 'detected', summary: 'SYN scan ports 1-1024' },
  { ip: '185.220.101.34', port: 8080, type: 'Exploit', level: 'critical', status: 'blocked', summary: 'Log4Shell payload in header' },
  { ip: '91.240.118.72', port: 80, type: 'SQL Injection', level: 'high', status: 'blocked', summary: "GET /login?u=' OR 1=1--" },
  { ip: '14.161.32.88', port: 3389, type: 'RDP Scan', level: 'medium', status: 'detected', summary: 'TCP connect on port 3389' },
  { ip: '211.59.14.107', port: 53, type: 'DDoS', level: 'critical', status: 'blocked', summary: 'UDP flood 5000 pps' },
  { ip: '78.153.140.29', port: 80, type: 'XSS Probe', level: 'medium', status: 'flagged', summary: '<script>alert(1)</script>' },
  { ip: '197.234.240.51', port: 22, type: 'Credential Stuff', level: 'high', status: 'blocked', summary: 'Automated login attempt' },
  { ip: '5.188.62.18', port: 445, type: 'SMB Exploit', level: 'critical', status: 'blocked', summary: 'EternalBlue probe' },
  { ip: '62.102.148.69', port: 25, type: 'Spam Relay', level: 'low', status: 'flagged', summary: 'SMTP relay attempt' },
  { ip: '175.45.176.0', port: 8443, type: 'Brute Force', level: 'high', status: 'blocked', summary: 'HTTP basic auth attack' },
  { ip: '194.26.29.40', port: 3306, type: 'SQL Injection', level: 'critical', status: 'blocked', summary: 'UNION SELECT payload' },
];

function timeStr() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function HeroFeed() {
  const [events, setEvents] = useState([]);
  const containerRef = useRef(null);
  const idRef = useRef(0);

  useEffect(() => {
    // Seed with a few events
    const seed = FEED_EVENTS.slice(0, 5).map((e) => ({
      ...e,
      id: ++idRef.current,
      time: timeStr(),
    }));
    setEvents(seed);

    const interval = setInterval(() => {
      const template = FEED_EVENTS[Math.floor(Math.random() * FEED_EVENTS.length)];
      const newEvent = {
        ...template,
        id: ++idRef.current,
        time: timeStr(),
      };
      setEvents((prev) => [...prev.slice(-11), newEvent]);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="relative rounded-xl border border-border bg-bg-card/80 backdrop-blur-sm overflow-hidden shadow-[var(--shadow-elevated)]">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-bg-primary/50">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-critical/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-medium/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-low/80" />
        </div>
        <span className="text-[11px] font-mono text-text-secondary ml-2">trafficlens --monitor</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-low animate-pulse-dot" />
          <span className="text-[10px] font-mono text-low">LIVE</span>
        </span>
      </div>

      {/* Feed */}
      <div ref={containerRef} className="h-[320px] overflow-hidden font-mono text-[11px] leading-relaxed p-3 space-y-0.5">
        {events.map((event, i) => {
          const colors = THREAT_COLORS[event.level] || THREAT_COLORS.low;
          const isNew = i === events.length - 1;
          return (
            <div
              key={event.id}
              className={`flex items-center gap-2 py-1 px-1.5 rounded ${isNew ? 'animate-slide-in bg-bg-card-hover/50' : ''}`}
            >
              <span className="text-text-tertiary shrink-0 w-[60px]">{event.time}</span>
              <span className={`shrink-0 w-3.5 text-center ${event.status === 'blocked' ? 'text-critical' : event.status === 'detected' ? 'text-medium' : 'text-accent'}`}>
                {STATUS_ICONS[event.status]}
              </span>
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                {event.level}
              </span>
              <span className="text-text-primary shrink-0">{event.ip}</span>
              <span className="text-text-tertiary shrink-0">:{event.port}</span>
              <span className="text-text-secondary truncate ml-auto">{event.summary}</span>
            </div>
          );
        })}
      </div>

      {/* Subtle scanline effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div className="w-full h-8 bg-accent" style={{ animation: 'scanline 4s linear infinite' }} />
      </div>
    </div>
  );
}
