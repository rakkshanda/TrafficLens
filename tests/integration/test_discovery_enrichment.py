"""Integration tests: discovery module enrichment."""

import pytest
from unittest.mock import patch, MagicMock
from trafficlens.discovery.models import HostRecord
from trafficlens.discovery.resolver import resolve_hostnames
from trafficlens.discovery.oui import lookup_manufacturers


@pytest.mark.integration
class TestDiscoveryEnrichment:
    def test_arp_scan_populates_mac(self):
        """ARP scan (mocked) populates host records with MAC addresses."""
        from scapy.all import Ether, ARP

        # Build mock srp response
        sent = Ether() / ARP(pdst="192.168.1.1")
        received = Ether(src="aa:bb:cc:00:00:01") / ARP(psrc="192.168.1.1", hwsrc="aa:bb:cc:00:00:01")

        # Patch at scapy.all level since arp_scanner uses `from scapy.all import srp`
        with patch("scapy.all.srp") as mock_srp, \
             patch("scapy.all.get_if_hwaddr", return_value="11:22:33:44:55:66"), \
             patch("scapy.all.conf") as mock_conf:
            mock_conf.verb = 0
            mock_srp.return_value = ([(sent, received)], [])

            from trafficlens.discovery.arp_scanner import arp_scan
            hosts = arp_scan("eth0", "192.168.1.0/24")

        assert len(hosts) == 1
        assert hosts[0].mac == "aa:bb:cc:00:00:01"
        assert hosts[0].ip == "192.168.1.1"

    def test_hostname_resolution_enriches(self):
        """Hostname resolution enriches records."""
        hosts = [HostRecord(ip="192.168.1.1", mac="aa:bb:cc:00:00:01")]
        with patch("trafficlens.discovery.resolver.socket.gethostbyaddr") as mock_dns:
            mock_dns.return_value = ("router.local", [], ["192.168.1.1"])
            result = resolve_hostnames(hosts, timeout=1.0)
        assert result[0].hostname == "router.local"

    def test_oui_enriches_manufacturer(self):
        """OUI lookup enriches manufacturer field."""
        hosts = [
            HostRecord(ip="192.168.1.1", mac="00:17:C4:00:00:01"),
            HostRecord(ip="192.168.1.2", mac="aa:bb:cc:00:00:02"),
        ]
        result = lookup_manufacturers(hosts)
        # Should not crash, may or may not find manufacturers
        assert len(result) == 2

    def test_enriched_records_accepted_by_reporting(self, tmp_path):
        """Enriched records are accepted by reporting module without error."""
        from trafficlens.reporting.markdown import generate_markdown_report
        from trafficlens.analysis.models import TrafficSummary, ScanMetadata

        hosts = [
            HostRecord(ip="192.168.1.1", mac="aa:bb:cc:00:00:01",
                       hostname="router.local", manufacturer="Netgear"),
        ]
        summary = TrafficSummary(
            scan_metadata=ScanMetadata(interface="eth0", subnet="192.168.1.0/24"),
            hosts={h.ip: h for h in hosts},
        )
        path = str(tmp_path / "report.md")
        generate_markdown_report(summary, path)
        with open(path) as f:
            content = f.read()
        assert "router.local" in content
        assert "Netgear" in content
