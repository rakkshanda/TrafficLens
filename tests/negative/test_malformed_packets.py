"""Negative tests: malformed packet handling."""

import pytest
from trafficlens.capture.sniffer import PacketCapture
from trafficlens.analysis.aggregator import TrafficAggregator
from trafficlens.analysis.models import ScanMetadata
from tests.fixtures.packets import (
    make_truncated_packet,
    make_corrupt_packet,
    make_https_packet,
    make_dns_query,
)


@pytest.mark.negative
class TestMalformedPackets:
    def _make_capture(self):
        capture = PacketCapture.__new__(PacketCapture)
        capture.malformed_count = 0
        return capture

    def test_truncated_packet_no_crash(self):
        """Truncated IP header -> no crash, returns a RawPacket or None."""
        capture = self._make_capture()
        pkt = make_truncated_packet()
        raw = capture._extract_packet(pkt)
        # Should either return a packet or None, not crash
        assert raw is None or raw.protocol is not None

    def test_corrupt_packet_no_crash(self):
        """Corrupt raw bytes -> packet is handled gracefully."""
        capture = self._make_capture()
        pkt = make_corrupt_packet()
        raw = capture._extract_packet(pkt)
        # Should return None or a best-effort parse
        assert raw is None or isinstance(raw.size, int)

    def test_mixed_valid_invalid_processed(self):
        """Mixed valid + invalid packets -> valid packets still processed."""
        capture = self._make_capture()
        agg = TrafficAggregator()

        packets = [
            make_https_packet(offset=0),
            make_truncated_packet(offset=1),
            make_dns_query(offset=2),
            make_corrupt_packet(offset=3),
            make_https_packet(offset=4),
        ]

        for pkt in packets:
            raw = capture._extract_packet(pkt)
            if raw is not None:
                agg.ingest(raw)

        # At least the valid packets should be processed
        assert agg.packet_count >= 3  # 2 HTTPS + 1 DNS minimum

    def test_no_ether_layer_handled(self):
        """Packet with no Ether layer -> handled gracefully."""
        from scapy.all import IP, TCP
        capture = self._make_capture()
        pkt = IP(src="1.2.3.4", dst="5.6.7.8") / TCP(dport=80)
        pkt.time = 1000.0
        raw = capture._extract_packet(pkt)
        # Should work - IP packets without Ether are valid
        assert raw is not None
        assert raw.src_ip == "1.2.3.4"
