"""Integration tests: pcap replay through the full pipeline."""

import pytest
from scapy.all import wrpcap, rdpcap

from trafficlens.capture.sniffer import PacketCapture
from trafficlens.analysis.aggregator import TrafficAggregator
from trafficlens.analysis.models import ScanMetadata
from trafficlens.reporting.markdown import generate_markdown_report
from trafficlens.reporting.html import generate_html_report
from tests.fixtures.packets import (
    make_mixed_packet_list,
    make_dns_query,
    make_dns_response,
)


@pytest.mark.integration
class TestPcapReplayPipeline:
    def test_full_pipeline_with_mixed_traffic(self, tmp_path):
        """Mixed traffic pcap -> analysis -> report: entire pipeline succeeds."""
        # Write pcap
        packets = make_mixed_packet_list()
        pcap_path = str(tmp_path / "mixed.pcap")
        wrpcap(pcap_path, packets)

        # Read and process
        read_packets = rdpcap(pcap_path)
        agg = TrafficAggregator()
        capture = PacketCapture.__new__(PacketCapture)
        capture.malformed_count = 0

        for pkt in read_packets:
            raw = capture._extract_packet(pkt)
            if raw is not None:
                agg.ingest(raw)

        summary = agg.finalize(ScanMetadata(interface="test", subnet="192.168.1.0/24"))

        # Generate report
        md_path = str(tmp_path / "report.md")
        generate_markdown_report(summary, md_path)
        with open(md_path) as f:
            assert len(f.read()) > 100

    def test_dns_only_pcap(self, tmp_path):
        """DNS-only pcap -> analysis shows only DNS protocol."""
        packets = [make_dns_query(offset=i) for i in range(5)]
        packets += [make_dns_response(offset=i + 0.5) for i in range(5)]
        pcap_path = str(tmp_path / "dns.pcap")
        wrpcap(pcap_path, packets)

        read_packets = rdpcap(pcap_path)
        agg = TrafficAggregator()
        capture = PacketCapture.__new__(PacketCapture)
        capture.malformed_count = 0

        for pkt in read_packets:
            raw = capture._extract_packet(pkt)
            if raw is not None:
                agg.ingest(raw)

        summary = agg.finalize(ScanMetadata())
        assert "DNS" in summary.protocol_distribution

    def test_empty_pcap(self, tmp_path):
        """Empty pcap -> analysis produces zero-host session, report renders."""
        pcap_path = str(tmp_path / "empty.pcap")
        wrpcap(pcap_path, [])

        read_packets = rdpcap(pcap_path)
        agg = TrafficAggregator()
        summary = agg.finalize(ScanMetadata())

        assert len(summary.hosts) == 0
        md_path = str(tmp_path / "report.md")
        generate_markdown_report(summary, md_path)
        with open(md_path) as f:
            content = f.read()
        assert "No hosts discovered" in content

    def test_report_html_from_pcap(self, tmp_path):
        """Full pcap -> HTML report generation."""
        packets = make_mixed_packet_list()
        pcap_path = str(tmp_path / "mixed.pcap")
        wrpcap(pcap_path, packets)

        read_packets = rdpcap(pcap_path)
        agg = TrafficAggregator()
        capture = PacketCapture.__new__(PacketCapture)
        capture.malformed_count = 0

        for pkt in read_packets:
            raw = capture._extract_packet(pkt)
            if raw is not None:
                agg.ingest(raw)

        summary = agg.finalize(ScanMetadata(interface="test", subnet="192.168.1.0/24"))
        html_path = str(tmp_path / "report.html")
        generate_html_report(summary, html_path)
        with open(html_path) as f:
            content = f.read()
        assert "<html" in content
        assert "192.168.1.100" in content
