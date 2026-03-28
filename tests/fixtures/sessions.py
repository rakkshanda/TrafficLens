"""Factory for full TrafficSummary test data."""

import time

from trafficlens.analysis.models import (
    ConnectionRecord,
    HostTraffic,
    ScanMetadata,
    TrafficSummary,
)
from trafficlens.discovery.models import HostRecord
from tests.fixtures.hosts import make_host_inventory, BASE_TIME


def make_scan_metadata(**overrides) -> ScanMetadata:
    """Create a ScanMetadata with sensible defaults."""
    defaults = {
        "start_time": BASE_TIME,
        "end_time": BASE_TIME + 60,
        "duration_seconds": 60,
        "interface": "wlan0",
        "subnet": "192.168.1.0/24",
        "total_packets": 500,
        "total_bytes": 65536,
        "malformed_packets": 0,
    }
    defaults.update(overrides)
    return ScanMetadata(**defaults)


def make_traffic_summary(**overrides) -> TrafficSummary:
    """Create a complete TrafficSummary with synthetic but valid data."""
    hosts_list = make_host_inventory(5)
    hosts_dict = {h.ip: h for h in hosts_list}

    per_host_traffic = {}
    for i, h in enumerate(hosts_list):
        per_host_traffic[h.ip] = HostTraffic(
            bytes_sent=1000 * (i + 1),
            bytes_received=2000 * (i + 1),
            protocols={"HTTPS": 2000 * (i + 1), "DNS": 500 * (i + 1)},
            connection_count=3 + i,
        )

    connections = [
        ConnectionRecord(
            src_ip="192.168.1.100",
            dst_ip="192.168.1.101",
            dst_port=443,
            protocol_label="HTTPS",
            byte_count=25000,
            packet_count=100,
        ),
        ConnectionRecord(
            src_ip="192.168.1.100",
            dst_ip="192.168.1.1",
            dst_port=53,
            protocol_label="DNS",
            byte_count=5000,
            packet_count=50,
        ),
        ConnectionRecord(
            src_ip="192.168.1.102",
            dst_ip="192.168.1.100",
            dst_port=22,
            protocol_label="SSH",
            byte_count=15000,
            packet_count=75,
        ),
    ]

    top_by_bytes = sorted(
        [(ip, ht.bytes_sent + ht.bytes_received) for ip, ht in per_host_traffic.items()],
        key=lambda x: -x[1],
    )
    top_by_conns = sorted(
        [(ip, ht.connection_count) for ip, ht in per_host_traffic.items()],
        key=lambda x: -x[1],
    )

    defaults = {
        "scan_metadata": make_scan_metadata(),
        "hosts": hosts_dict,
        "connections": connections,
        "per_host_traffic": per_host_traffic,
        "top_talkers_by_bytes": top_by_bytes,
        "top_talkers_by_connections": top_by_conns,
        "protocol_distribution": {"HTTPS": 40000, "DNS": 15000, "SSH": 10000},
    }
    defaults.update(overrides)
    return TrafficSummary(**defaults)
