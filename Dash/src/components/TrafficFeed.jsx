import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import { formatTime } from '../data/mockData';

const THREAT_COLORS = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-green-500/20 text-green-400',
};

const STATUS_ICONS = {
  blocked: '\u2718',
  detected: '\u26A0',
  flagged: '\u2691',
};

const STATUS_COLORS = {
  blocked: 'text-red-400',
  detected: 'text-amber-400',
  flagged: 'text-blue-400',
};

export default function TrafficFeed({ events }) {
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  const jumpToLatest = () => {
    setAutoScroll(true);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 flex flex-col relative">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3">
        Intrusion Attempt Feed
      </h2>
      {events.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-text-secondary text-sm">
          <span className="animate-pulse">Waiting for activity...</span>
        </div>
      ) : (
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-auto max-h-[400px] font-mono text-xs space-y-0.5"
        >
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-bg-input/50 transition-colors"
            >
              <span className="text-text-secondary shrink-0 w-[68px]">
                {formatTime(event.timestamp)}
              </span>
              <span
                className={`shrink-0 w-4 text-center ${
                  STATUS_COLORS[event.status] || 'text-gray-400'
                }`}
                title={event.status}
              >
                {STATUS_ICONS[event.status] || '?'}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 w-[58px] text-center ${
                  THREAT_COLORS[event.threat_level] || 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {event.threat_level}
              </span>
              <span className="text-text-primary shrink-0">
                {event.source_ip}
              </span>
              <span className="text-text-secondary shrink-0">:{event.target_port}</span>
              <span className="text-text-secondary truncate ml-auto" title={event.summary}>
                {event.summary}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {!autoScroll && events.length > 0 && (
        <button
          onClick={jumpToLatest}
          className="absolute bottom-8 right-8 flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-full shadow-lg transition-colors cursor-pointer"
        >
          <ArrowDown className="w-3 h-3" />
          Jump to latest
        </button>
      )}
    </div>
  );
}
