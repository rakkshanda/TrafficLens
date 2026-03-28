"""Unit tests: traffic aggregation."""

import pytest
from trafficlens.capture.models import RawPacket
from trafficlens.analysis.aggregator import TrafficAggregator
from trafficlens.analysis.models import ScanMetadata


def _pkt(src_ip="192.168.1.100", dst_ip="93.184.216.34", src_port=54321,
         dst_port=443, protocol="TCP", size=500, ts=0):
    return RawPacket(
        timestamp=ts, src_ip=src_ip, dst_ip=dst_ip,
        src_mac="aa:bb:cc:00:00:01", dst_mac="aa:bb:cc:00:00:02",
        src_port=src_port, dst_port=dst_port,
        protocol=protocol, size=size, raw_layers=("Ether", "IP", "TCP"),
    )


@pytest.mark.unit
class TestTrafficAggregation:
    def test_total_bytes_summed(self):
        agg = TrafficAggregator()
        agg.ingest(_pkt(size=100))
        agg.ingest(_pkt(size=200))
        agg.ingest(_pkt(size=300))
        assert agg.total_bytes == 600

    def test_packet_count(self):
        agg = TrafficAggregator()
        for _ in range(5):
            agg.ingest(_pkt())
        assert agg.packet_count == 5

    def test_per_host_bytes_correct(self):
        agg = TrafficAggregator()
        agg.ingest(_pkt(src_ip="10.0.0.1", dst_ip="10.0.0.2", size=100))
        agg.ingest(_pkt(src_ip="10.0.0.2", dst_ip="10.0.0.1", size=200))
        summary = agg.finalize(ScanMetadata())
        # 10.0.0.1 sent 100, received 200
        assert summary.per_host_traffic["10.0.0.1"].bytes_sent == 100
        assert summary.per_host_traffic["10.0.0.1"].bytes_received == 200
        # 10.0.0.2 sent 200, received 100
        assert summary.per_host_traffic["10.0.0.2"].bytes_sent == 200
        assert summary.per_host_traffic["10.0.0.2"].bytes_received == 100

    def test_protocol_distribution(self):
        agg = TrafficAggregator()
        agg.ingest(_pkt(dst_port=443, size=100))  # HTTPS
        agg.ingest(_pkt(dst_port=443, size=200))  # HTTPS
        agg.ingest(_pkt(dst_port=53, protocol="UDP", size=50))  # DNS
        summary = agg.finalize(ScanMetadata())
        assert summary.protocol_distribution["HTTPS"] == 300
        assert summary.protocol_distribution["DNS"] == 50

    def test_connection_tracking(self):
        agg = TrafficAggregator()
        agg.ingest(_pkt(src_ip="10.0.0.1", dst_ip="10.0.0.2", dst_port=443, size=100))
        agg.ingest(_pkt(src_ip="10.0.0.1", dst_ip="10.0.0.2", dst_port=443, size=200))
        summary = agg.finalize(ScanMetadata())
        # Should be one connection record (same src/dst/port)
        conns = [c for c in summary.connections if c.src_ip == "10.0.0.1" and c.dst_port == 443]
        assert len(conns) == 1
        assert conns[0].byte_count == 300
        assert conns[0].packet_count == 2

    def test_single_packet(self):
        agg = TrafficAggregator()
        agg.ingest(_pkt(size=42))
        summary = agg.finalize(ScanMetadata())
        assert summary.scan_metadata.total_packets == 0  # metadata from external
        assert agg.packet_count == 1
        assert agg.total_bytes == 42

    def test_zero_payload_counted(self):
        agg = TrafficAggregator()
        agg.ingest(_pkt(size=0))
        assert agg.packet_count == 1
        assert agg.total_bytes == 0

    def test_auto_discover_hosts(self):
        agg = TrafficAggregator()
        agg.ingest(_pkt(src_ip="10.0.0.99", dst_ip="10.0.0.100"))
        summary = agg.finalize(ScanMetadata())
        assert "10.0.0.99" in summary.hosts
        assert "10.0.0.100" in summary.hosts

    def test_snapshot_returns_summary(self):
        agg = TrafficAggregator()
        agg.ingest(_pkt(size=100))
        snapshot = agg.snapshot()
        assert len(snapshot.protocol_distribution) > 0
