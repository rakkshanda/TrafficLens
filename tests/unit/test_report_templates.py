"""Unit tests: report template rendering."""

import pytest
from tests.fixtures.sessions import make_traffic_summary
from trafficlens.analysis.models import TrafficSummary, ScanMetadata, HostTraffic


@pytest.mark.unit
class TestReportTemplates:
    def test_html_renders_all_host_ips(self, tmp_path):
        from trafficlens.reporting.html import generate_html_report
        summary = make_traffic_summary()
        path = str(tmp_path / "report.html")
        generate_html_report(summary, path)
        with open(path) as f:
            content = f.read()
        for ip in summary.hosts:
            assert ip in content

    def test_markdown_renders_table_headers(self, tmp_path):
        from trafficlens.reporting.markdown import generate_markdown_report
        summary = make_traffic_summary()
        path = str(tmp_path / "report.md")
        generate_markdown_report(summary, path)
        with open(path) as f:
            content = f.read()
        assert "| IP |" in content
        assert "| MAC |" in content

    def test_template_handles_zero_traffic_host(self, tmp_path):
        from trafficlens.reporting.html import generate_html_report
        summary = make_traffic_summary()
        # Add a host with no traffic
        from trafficlens.discovery.models import HostRecord
        summary.hosts["10.0.0.99"] = HostRecord(ip="10.0.0.99", mac="ff:ff:ff:ff:ff:ff")
        path = str(tmp_path / "report.html")
        generate_html_report(summary, path)  # should not crash

    def test_template_handles_null_hostname(self, tmp_path):
        from trafficlens.reporting.markdown import generate_markdown_report
        summary = make_traffic_summary()
        # Ensure at least one host has no hostname
        for h in summary.hosts.values():
            h.hostname = None
            break
        path = str(tmp_path / "report.md")
        generate_markdown_report(summary, path)
        with open(path) as f:
            content = f.read()
        assert "-" in content  # null rendered as dash

    def test_template_handles_null_manufacturer(self, tmp_path):
        from trafficlens.reporting.html import generate_html_report
        summary = make_traffic_summary()
        for h in summary.hosts.values():
            h.manufacturer = None
            break
        path = str(tmp_path / "report.html")
        generate_html_report(summary, path)  # should not crash

    def test_empty_summary_renders(self, tmp_path):
        from trafficlens.reporting.markdown import generate_markdown_report
        summary = TrafficSummary(scan_metadata=ScanMetadata())
        path = str(tmp_path / "report.md")
        generate_markdown_report(summary, path)
        with open(path) as f:
            content = f.read()
        assert "No hosts discovered" in content
