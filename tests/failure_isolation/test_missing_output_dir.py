"""Failure isolation tests: missing output directory."""

import pytest
from trafficlens.reporting.markdown import generate_markdown_report
from trafficlens.reporting.html import generate_html_report
from tests.fixtures.sessions import make_traffic_summary


@pytest.mark.failure_isolation
class TestMissingOutputDir:
    def test_markdown_to_nonexistent_dir_raises(self):
        """Report to nonexistent directory raises FileNotFoundError."""
        summary = make_traffic_summary()
        with pytest.raises(FileNotFoundError):
            generate_markdown_report(summary, "/nonexistent/path/report.md")

    def test_html_to_nonexistent_dir_raises(self):
        """HTML report to nonexistent directory raises FileNotFoundError."""
        summary = make_traffic_summary()
        with pytest.raises(FileNotFoundError):
            generate_html_report(summary, "/nonexistent/path/report.html")

    def test_valid_dir_works(self, tmp_path):
        """Report to valid directory succeeds."""
        summary = make_traffic_summary()
        path = str(tmp_path / "report.md")
        generate_markdown_report(summary, path)
        assert (tmp_path / "report.md").exists()
