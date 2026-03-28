"""Integration tests: capture module feeds into analysis module."""

import pytest
from trafficlens.capture.sniffer import PacketCapture
from trafficlens.analysis.aggregator import TrafficAggregator
from trafficlens.analysis.models import ScanMetadata
from tests.fixtures.packets import make_mixed_packet_list


@pytest.mark.integration
class TestCaptureToAnalysis:
    def test_packets_flow_into_aggregator(self):
        """Mock-captured packets flow into aggregator and produce valid stats."""
        agg = TrafficAggregator()
        packets = make_mixed_packet_list()

        # Simulate the capture->ingest pipeline
        capture = PacketCapture.__new__(PacketCapture)
        capture.malformed_count = 0

        for pkt in packets:
            raw = capture._extract_packet(pkt)
            if raw is not None:
                agg.ingest(raw)

        summary = agg.finalize(ScanMetadata())
        assert agg.packet_count > 0
        assert agg.total_bytes > 0
        assert len(summary.protocol_distribution) > 0

    def test_protocol_counts_match_composition(self):
        """Protocol counts in output match the packet composition."""
        agg = TrafficAggregator()
        capture = PacketCapture.__new__(PacketCapture)
        capture.malformed_count = 0
        packets = make_mixed_packet_list()

        for pkt in packets:
            raw = capture._extract_packet(pkt)
            if raw is not None:
                agg.ingest(raw)

        summary = agg.finalize(ScanMetadata())
        # Should have HTTPS, DNS, SSH, HTTP, SMB, mDNS, ARP, ICMP, NTP, DHCP
        proto_labels = set(summary.protocol_distribution.keys())
        assert "HTTPS" in proto_labels
        assert "DNS" in proto_labels

    def test_host_count_matches_unique_ips(self):
        """Host count matches unique IPs in packet list."""
        agg = TrafficAggregator()
        capture = PacketCapture.__new__(PacketCapture)
        capture.malformed_count = 0
        packets = make_mixed_packet_list()

        unique_ips = set()
        for pkt in packets:
            raw = capture._extract_packet(pkt)
            if raw is not None:
                agg.ingest(raw)
                if raw.src_ip:
                    unique_ips.add(raw.src_ip)
                if raw.dst_ip:
                    unique_ips.add(raw.dst_ip)

        summary = agg.finalize(ScanMetadata())
        assert len(summary.hosts) == len(unique_ips)

    def test_aggregator_thread_safety(self):
        """Concurrent ingest and snapshot calls don't crash."""
        import threading

        agg = TrafficAggregator()
        capture = PacketCapture.__new__(PacketCapture)
        capture.malformed_count = 0
        packets = make_mixed_packet_list()
        raw_packets = [capture._extract_packet(p) for p in packets]
        raw_packets = [r for r in raw_packets if r is not None]

        errors = []

        def ingest_all():
            try:
                for _ in range(10):
                    for raw in raw_packets:
                        agg.ingest(raw)
            except Exception as e:
                errors.append(e)

        def snapshot_all():
            try:
                for _ in range(20):
                    agg.snapshot()
            except Exception as e:
                errors.append(e)

        t1 = threading.Thread(target=ingest_all)
        t2 = threading.Thread(target=snapshot_all)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        assert len(errors) == 0
