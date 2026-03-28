"""Smoke tests: report rendering with synthetic data."""

import pytest
from tests.fixtures.sessions import make_traffic_summary


@pytest.mark.smoke
class TestReportRendering:
    def test_markdown_report_renders(self, tmp_output_dir):
        from trafficlens.reporting.markdown import generate_markdown_report
        summary = make_traffic_summary()
        path = str(tmp_output_dir / "report.md")
        generate_markdown_report(summary, path)
        with open(path) as f:
            content = f.read()
        assert len(content) > 100
        assert "TrafficLens" in content

    def test_markdown_contains_host_table(self, tmp_output_dir):
        from trafficlens.reporting.markdown import generate_markdown_report
        summary = make_traffic_summary()
        path = str(tmp_output_dir / "report.md")
        generate_markdown_report(summary, path)
        with open(path) as f:
            content = f.read()
        assert "Host Inventory" in content
        assert "192.168.1.100" in content

    def test_html_report_renders(self, tmp_output_dir):
        from trafficlens.reporting.html import generate_html_report
        summary = make_traffic_summary()
        path = str(tmp_output_dir / "report.html")
        generate_html_report(summary, path)
        with open(path) as f:
            content = f.read()
        assert "<html" in content
        assert "TrafficLens" in content

    def test_html_contains_host_count(self, tmp_output_dir):
        from trafficlens.reporting.html import generate_html_report
        summary = make_traffic_summary()
        path = str(tmp_output_dir / "report.html")
        generate_html_report(summary, path)
        with open(path) as f:
            content = f.read()
        # Should contain host IPs
        assert "192.168.1.100" in content
