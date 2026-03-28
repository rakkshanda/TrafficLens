"""Root conftest: global fixtures, markers, and CLI helpers."""

import os
import pytest


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line("markers", "smoke: Quick health-check tests")
    config.addinivalue_line("markers", "unit: Isolated unit tests")
    config.addinivalue_line("markers", "integration: Cross-module integration tests")
    config.addinivalue_line("markers", "negative: Edge case and error handling tests")
    config.addinivalue_line("markers", "failure_isolation: Graceful degradation tests")
    config.addinivalue_line("markers", "requires_root: Tests needing root privileges")
    config.addinivalue_line("markers", "slow: Tests that take >5 seconds")


def pytest_collection_modifyitems(config, items):
    """Auto-skip requires_root tests when not running as root."""
    if os.geteuid() == 0:
        return

    skip_root = pytest.mark.skip(reason="Requires root privileges (run with sudo)")
    for item in items:
        if "requires_root" in item.keywords:
            item.add_marker(skip_root)


@pytest.fixture
def tmp_output_dir(tmp_path):
    """Provide a temporary directory for report output."""
    return tmp_path


@pytest.fixture
def mock_interface_list(monkeypatch):
    """Patch psutil to return fake network interfaces."""
    import collections

    FakeAddr = collections.namedtuple("FakeAddr", ["family", "address", "netmask", "broadcast", "ptp"])
    FakeStat = collections.namedtuple("FakeStat", ["isup", "duplex", "speed", "mtu", "flags"])

    class FakeFamily:
        name = "AF_INET"

    fake_addrs = {
        "eth0": [FakeAddr(family=FakeFamily(), address="192.168.1.100", netmask="255.255.255.0", broadcast="192.168.1.255", ptp=None)],
        "wlan0": [FakeAddr(family=FakeFamily(), address="192.168.1.101", netmask="255.255.255.0", broadcast="192.168.1.255", ptp=None)],
        "lo": [FakeAddr(family=FakeFamily(), address="127.0.0.1", netmask="255.0.0.0", broadcast=None, ptp=None)],
    }
    fake_stats = {
        "eth0": FakeStat(isup=True, duplex=2, speed=1000, mtu=1500, flags="up"),
        "wlan0": FakeStat(isup=True, duplex=0, speed=0, mtu=1500, flags="up"),
        "lo": FakeStat(isup=True, duplex=0, speed=0, mtu=65536, flags="up"),
    }

    import psutil
    monkeypatch.setattr(psutil, "net_if_addrs", lambda: fake_addrs)
    monkeypatch.setattr(psutil, "net_if_stats", lambda: fake_stats)

    return fake_addrs
