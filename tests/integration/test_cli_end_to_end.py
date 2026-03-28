"""Integration tests: CLI end-to-end with mocked capture."""

import pytest
from unittest.mock import patch, MagicMock
from typer.testing import CliRunner
from trafficlens.cli import app

runner = CliRunner()


@pytest.mark.integration
class TestCLIEndToEnd:
    def test_cli_with_no_permissions_shows_error(self, monkeypatch):
        """CLI without root shows permission error."""
        monkeypatch.setattr("os.geteuid", lambda: 1000)
        with patch("trafficlens.capture.permissions.socket.socket") as mock_sock:
            mock_sock.side_effect = PermissionError("no raw socket")
            result = runner.invoke(app, ["-d", "5", "-i", "eth0"])
            assert result.exit_code != 0

    def test_cli_version(self):
        """CLI --version works."""
        result = runner.invoke(app, ["--version"])
        assert result.exit_code == 0
        assert "0.1.0" in result.output

    def test_cli_interfaces_subcommand(self, mock_interface_list):
        """CLI interfaces subcommand lists interfaces."""
        result = runner.invoke(app, ["interfaces"])
        assert result.exit_code == 0
        assert "eth0" in result.output
