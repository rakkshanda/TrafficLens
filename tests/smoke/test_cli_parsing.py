"""Smoke tests: CLI argument parsing."""

import pytest
from typer.testing import CliRunner

from trafficlens.cli import app


runner = CliRunner()


@pytest.mark.smoke
class TestCLIParsing:
    def test_help_exits_zero(self):
        result = runner.invoke(app, ["--help"])
        assert result.exit_code == 0

    def test_help_shows_interface_option(self):
        result = runner.invoke(app, ["--help"])
        assert "--interface" in result.output

    def test_help_shows_duration_option(self):
        result = runner.invoke(app, ["--help"])
        assert "--duration" in result.output

    def test_help_shows_output_option(self):
        result = runner.invoke(app, ["--help"])
        assert "--output" in result.output

    def test_help_shows_format_option(self):
        result = runner.invoke(app, ["--help"])
        assert "--format" in result.output

    def test_version_flag(self):
        result = runner.invoke(app, ["--version"])
        assert result.exit_code == 0
        assert "TrafficLens" in result.output

    def test_interfaces_subcommand_help(self):
        result = runner.invoke(app, ["interfaces", "--help"])
        assert result.exit_code == 0
        assert "interfaces" in result.output.lower() or "List" in result.output
