import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import { formatTime } from '../data/mockData';

const THREAT_COLORS = {
  critical: 'bg-critical-muted text-critical',
  high: 'bg-high-muted text-high',
  medium: 'bg-medium-muted text-medium',
  low: 'bg-low-muted text-low',
};

const STATUS_ICONS = { blocked: '\u2718', detected: '\u26A0', flagged: '\u2691' };
const STATUS_COLORS = { blocked: 'text-critical', detected: 'text-medium', flagged: 'text-accent' };

export default function TrafficFeed({ events }) {
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }, []);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 flex flex-col relative shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Intrusion Feed
        </h2>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-low animate-pulse-dot" />
          <span className="text-[10px] font-mono text-text-tertiary">{events.length} events</span>
        </span>
      </div>

      {events.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-text-tertiary text-sm">
          <span className="animate-pulse-dot">Waiting for activity...</span>
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-auto max-h-[420px] font-mono text-[11px] space-y-px"
        >
          {events.map((event) => {
            const colors = THREAT_COLORS[event.threat_level] || THREAT_COLORS.low;
            return (
              <div
                key={event.id}
                className="flex items-center gap-1.5 py-1.5 px-2 rounded hover:bg-bg-card-hover transition-colors"
              >
                <span className="text-text-tertiary shrink-0 w-[60px]">
                  {formatTime(event.timestamp)}
                </span>
                <span className={`shrink-0 w-3.5 text-center ${STATUS_COLORS[event.status] || 'text-text-tertiary'}`} title={event.status}>
                  {STATUS_ICONS[event.status] || '?'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider shrink-0 w-[52px] text-center ${colors}`}>
                  {event.threat_level}
                </span>
                <span className="text-accent shrink-0 text-[11px]">{event.source_ip}</span>
                <span className="text-text-tertiary shrink-0">:{event.target_port}</span>
                <span className="text-text-secondary truncate ml-auto text-[10px]" title={event.summary}>
                  {event.summary}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {!autoScroll && events.length > 0 && (
        <button
          onClick={() => {
            setAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-6 right-6 flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-text-inverse text-[10px] font-semibold rounded-full shadow-[var(--shadow-elevated)] transition-all btn-press cursor-pointer"
        >
          <ArrowDown className="w-3 h-3" />
          Latest
        </button>
      )}
    </div>
  );
}
