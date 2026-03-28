"""Negative tests: permission denied scenarios."""

import pytest
from unittest.mock import patch


@pytest.mark.negative
class TestPermissionDenied:
    def test_permission_check_detects_non_root(self, monkeypatch):
        """Non-root without CAP_NET_RAW -> check returns False."""
        monkeypatch.setattr("os.geteuid", lambda: 1000)
        with patch("trafficlens.capture.permissions.socket.socket") as mock_sock:
            mock_sock.side_effect = PermissionError("Operation not permitted")
            from trafficlens.capture.permissions import check_capture_permissions
            assert check_capture_permissions() is False

    def test_permission_check_passes_root(self, monkeypatch):
        """Root user -> check returns True."""
        monkeypatch.setattr("os.geteuid", lambda: 0)
        from trafficlens.capture.permissions import check_capture_permissions
        assert check_capture_permissions() is True

    def test_require_permissions_exits(self, monkeypatch):
        """require_capture_permissions exits with code 1 when not root."""
        monkeypatch.setattr("os.geteuid", lambda: 1000)
        with patch("trafficlens.capture.permissions.socket.socket") as mock_sock:
            mock_sock.side_effect = PermissionError("Operation not permitted")
            from trafficlens.capture.permissions import require_capture_permissions
            with pytest.raises(SystemExit) as exc_info:
                require_capture_permissions()
            assert exc_info.value.code == 1
