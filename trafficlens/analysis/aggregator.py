"""Thread-safe traffic aggregator: the central state machine for TrafficLens."""

import logging
import threading
import time
from collections import defaultdict
from typing import Dict, List, Optional

from trafficlens.capture.models import RawPacket
from trafficlens.discovery.models import HostRecord
from trafficlens.analysis.classifier import classify_protocol
from trafficlens.analysis.models import (
    ConnectionRecord,
    HostTraffic,
    ScanMetadata,
    TrafficSummary,
)
from trafficlens.analysis.top_talkers import rank_by_bytes, rank_by_connections

logger = logging.getLogger("trafficlens.analysis.aggregator")


class TrafficAggregator:
    """Thread-safe stateful accumulator for network traffic data.

    The capture thread calls .ingest() per-packet while the dashboard
    thread calls .snapshot() at ~4Hz. A threading.Lock protects all state.
    """

    def __init__(self):
        self._lock = threading.Lock()

        # Host registry
        self._hosts: Dict[str, HostRecord] = {}

        # Connection tracking: (src_ip, dst_ip, dst_port) -> {bytes, packets}
        self._connections: Dict[tuple, dict] = defaultdict(
            lambda: {"bytes": 0, "packets": 0, "protocol_label": ""}
        )

        # Per-host traffic: ip -> HostTraffic
        self._host_traffic: Dict[str, HostTraffic] = defaultdict(HostTraffic)

        # Protocol distribution: label -> total bytes
        self._protocol_bytes: Dict[str, int] = defaultdict(int)

        # Counters
        self.packet_count = 0
        self.total_bytes = 0

    def register_hosts(self, hosts: List[HostRecord]) -> None:
        """Register hosts discovered via ARP scan."""
        with self._lock:
            for host in hosts:
                self._hosts[host.ip] = host

    def ingest(self, packet: RawPacket) -> None:
        """Ingest a single packet. Called from the capture thread."""
        label = classify_protocol(packet)

        with self._lock:
            self.packet_count += 1
            self.total_bytes += packet.size

            # Update protocol distribution
            self._protocol_bytes[label] += packet.size

            # Track connection (only for IP traffic with ports)
            if packet.src_ip and packet.dst_ip:
                dst_port = packet.dst_port or 0
                conn_key = (packet.src_ip, packet.dst_ip, dst_port)
                conn = self._connections[conn_key]
                conn["bytes"] += packet.size
                conn["packets"] += 1
                conn["protocol_label"] = label

                # Update per-host traffic for source
                src_traffic = self._host_traffic[packet.src_ip]
                src_traffic.bytes_sent += packet.size
                src_traffic.protocols[label] = (
                    src_traffic.protocols.get(label, 0) + packet.size
                )

                # Update per-host traffic for destination
                dst_traffic = self._host_traffic[packet.dst_ip]
                dst_traffic.bytes_received += packet.size
                dst_traffic.protocols[label] = (
                    dst_traffic.protocols.get(label, 0) + packet.size
                )

                # Track unique connections per host
                # (simplified: count unique connection keys involving this host)
                src_traffic.connection_count = sum(
                    1 for k in self._connections if k[0] == packet.src_ip
                )
                dst_traffic.connection_count = sum(
                    1 for k in self._connections if k[1] == packet.dst_ip
                )

                # Auto-discover hosts not found via ARP
                now = packet.timestamp
                for ip, mac in [
                    (packet.src_ip, packet.src_mac),
                    (packet.dst_ip, packet.dst_mac),
                ]:
                    if ip and ip not in self._hosts:
                        self._hosts[ip] = HostRecord(
                            ip=ip,
                            mac=mac or "unknown",
                            first_seen=now,
                            last_seen=now,
                        )
                    elif ip and ip in self._hosts:
                        self._hosts[ip].last_seen = now

    def snapshot(self) -> TrafficSummary:
        """Take a snapshot of current state for dashboard rendering.

        Called from the main thread at ~4Hz.
        """
        with self._lock:
            return self._build_summary(None)

    def finalize(self, metadata: Optional[ScanMetadata] = None) -> TrafficSummary:
        """Produce the final TrafficSummary after capture is complete."""
        with self._lock:
            return self._build_summary(metadata)

    def _build_summary(self, metadata: Optional[ScanMetadata]) -> TrafficSummary:
        """Build a TrafficSummary from current state. Must be called under lock."""
        if metadata is None:
            metadata = ScanMetadata()

        # Build connection records
        connections = [
            ConnectionRecord(
                src_ip=key[0],
                dst_ip=key[1],
                dst_port=key[2],
                protocol_label=val["protocol_label"],
                byte_count=val["bytes"],
                packet_count=val["packets"],
            )
            for key, val in self._connections.items()
        ]

        # Copy per-host traffic
        per_host_traffic = {}
        for ip, ht in self._host_traffic.items():
            per_host_traffic[ip] = HostTraffic(
                bytes_sent=ht.bytes_sent,
                bytes_received=ht.bytes_received,
                protocols=dict(ht.protocols),
                connection_count=ht.connection_count,
            )

        return TrafficSummary(
            scan_metadata=metadata,
            hosts=dict(self._hosts),
            connections=connections,
            per_host_traffic=per_host_traffic,
            top_talkers_by_bytes=rank_by_bytes(per_host_traffic),
            top_talkers_by_connections=rank_by_connections(per_host_traffic),
            protocol_distribution=dict(self._protocol_bytes),
        )
