"""Data models for the analysis module."""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple


@dataclass
class ScanMetadata:
    """Metadata about a capture session."""

    start_time: float = 0.0
    end_time: float = 0.0
    duration_seconds: int = 0
    interface: str = ""
    subnet: str = ""
    total_packets: int = 0
    total_bytes: int = 0
    malformed_packets: int = 0


@dataclass
class ConnectionRecord:
    """An aggregated connection between two endpoints."""

    src_ip: str
    dst_ip: str
    dst_port: int
    protocol_label: str
    byte_count: int = 0
    packet_count: int = 0


@dataclass
class HostTraffic:
    """Aggregated traffic statistics for a single host."""

    bytes_sent: int = 0
    bytes_received: int = 0
    protocols: Dict[str, int] = field(default_factory=dict)
    connection_count: int = 0


@dataclass
class TrafficSummary:
    """Complete analysis output consumed by reporting and backend modules."""

    scan_metadata: ScanMetadata = field(default_factory=ScanMetadata)
    hosts: Dict[str, "HostRecord"] = field(default_factory=dict)
    connections: List[ConnectionRecord] = field(default_factory=list)
    per_host_traffic: Dict[str, HostTraffic] = field(default_factory=dict)
    top_talkers_by_bytes: List[Tuple[str, int]] = field(default_factory=list)
    top_talkers_by_connections: List[Tuple[str, int]] = field(default_factory=list)
    protocol_distribution: Dict[str, int] = field(default_factory=dict)


# Re-export HostRecord for convenience (avoids circular import)
from trafficlens.discovery.models import HostRecord  # noqa: E402, F811
