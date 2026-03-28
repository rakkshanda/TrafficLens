"""Negative tests: empty capture scenarios."""

import pytest
from trafficlens.analysis.aggregator import TrafficAggregator
from trafficlens.analysis.models import ScanMetadata


@pytest.mark.negative
class TestEmptyCapture:
    def test_zero_packets_empty_stats(self):
        agg = TrafficAggregator()
        summary = agg.finalize(ScanMetadata())
        assert agg.packet_count == 0
        assert len(summary.hosts) == 0
        assert len(summary.connections) == 0
        assert len(summary.protocol_distribution) == 0

    def test_zero_packets_empty_top_talkers(self):
        agg = TrafficAggregator()
        summary = agg.finalize(ScanMetadata())
        assert summary.top_talkers_by_bytes == []
        assert summary.top_talkers_by_connections == []

    def test_zero_packets_report_renders(self, tmp_path):
        from trafficlens.reporting.markdown import generate_markdown_report
        agg = TrafficAggregator()
        summary = agg.finalize(ScanMetadata())
        path = str(tmp_path / "empty.md")
        generate_markdown_report(summary, path)
        with open(path) as f:
            content = f.read()
        assert "No hosts discovered" in content
        assert "No traffic captured" in content
