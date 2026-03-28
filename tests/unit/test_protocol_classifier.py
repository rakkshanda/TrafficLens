"""Unit tests: protocol classifier."""

import pytest
from trafficlens.capture.models import RawPacket
from trafficlens.analysis.classifier import classify_protocol


def _make_raw(protocol="TCP", src_port=54321, dst_port=80):
    return RawPacket(
        timestamp=0, src_ip="1.2.3.4", dst_ip="5.6.7.8",
        src_mac="aa:bb:cc:00:00:01", dst_mac="aa:bb:cc:00:00:02",
        src_port=src_port, dst_port=dst_port,
        protocol=protocol, size=100, raw_layers=("Ether", "IP", "TCP"),
    )


@pytest.mark.unit
class TestProtocolClassifier:
    def test_dns_udp(self):
        pkt = _make_raw(protocol="UDP", dst_port=53)
        assert classify_protocol(pkt) == "DNS"

    def test_http(self):
        pkt = _make_raw(protocol="TCP", dst_port=80)
        assert classify_protocol(pkt) == "HTTP"

    def test_https(self):
        pkt = _make_raw(protocol="TCP", dst_port=443)
        assert classify_protocol(pkt) == "HTTPS"

    def test_ssh(self):
        pkt = _make_raw(protocol="TCP", dst_port=22)
        assert classify_protocol(pkt) == "SSH"

    def test_smb(self):
        pkt = _make_raw(protocol="TCP", dst_port=445)
        assert classify_protocol(pkt) == "SMB"

    def test_mdns(self):
        pkt = _make_raw(protocol="UDP", dst_port=5353)
        assert classify_protocol(pkt) == "mDNS"

    def test_dhcp_67(self):
        pkt = _make_raw(protocol="UDP", dst_port=67)
        assert classify_protocol(pkt) == "DHCP"

    def test_ntp(self):
        pkt = _make_raw(protocol="UDP", dst_port=123)
        assert classify_protocol(pkt) == "NTP"

    def test_arp(self):
        pkt = RawPacket(
            timestamp=0, src_ip="1.2.3.4", dst_ip="5.6.7.8",
            src_mac="aa:bb:cc:00:00:01", dst_mac="ff:ff:ff:ff:ff:ff",
            src_port=None, dst_port=None,
            protocol="ARP", size=42, raw_layers=("Ether", "ARP"),
        )
        assert classify_protocol(pkt) == "ARP"

    def test_icmp(self):
        pkt = RawPacket(
            timestamp=0, src_ip="1.2.3.4", dst_ip="5.6.7.8",
            src_mac="aa:bb:cc:00:00:01", dst_mac="aa:bb:cc:00:00:02",
            src_port=None, dst_port=None,
            protocol="ICMP", size=64, raw_layers=("Ether", "IP", "ICMP"),
        )
        assert classify_protocol(pkt) == "ICMP"

    def test_unknown_port_fallback(self):
        pkt = _make_raw(protocol="TCP", dst_port=9999)
        result = classify_protocol(pkt)
        assert result == "TCP/9999"

    def test_response_packet_src_port(self):
        """Response packets have the well-known port as source."""
        pkt = _make_raw(protocol="TCP", src_port=443, dst_port=54321)
        assert classify_protocol(pkt) == "HTTPS"
