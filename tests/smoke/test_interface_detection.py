"""Smoke tests: network interface detection."""

import pytest


@pytest.mark.smoke
class TestInterfaceDetection:
    def test_get_interfaces_returns_list(self, mock_interface_list):
        from trafficlens.cli import _get_interfaces
        interfaces = _get_interfaces()
        assert isinstance(interfaces, list)

    def test_get_interfaces_excludes_loopback(self, mock_interface_list):
        from trafficlens.cli import _get_interfaces
        interfaces = _get_interfaces()
        names = [i["name"] for i in interfaces]
        assert "lo" not in names

    def test_get_interfaces_includes_real_interfaces(self, mock_interface_list):
        from trafficlens.cli import _get_interfaces
        interfaces = _get_interfaces()
        names = [i["name"] for i in interfaces]
        assert "eth0" in names
        assert "wlan0" in names

    def test_auto_detect_interface(self, mock_interface_list):
        from trafficlens.cli import _auto_detect_interface
        result = _auto_detect_interface()
        assert result is not None
        assert result in ("eth0", "wlan0")
