"""Factory functions for HostRecord test data."""

import time

from trafficlens.discovery.models import HostRecord


BASE_TIME = 1711612800.0


def make_host_record(**overrides) -> HostRecord:
    """Create a HostRecord with sensible defaults, overridable."""
    defaults = {
        "ip": "192.168.1.100",
        "mac": "aa:bb:cc:00:00:01",
        "hostname": "test-host.local",
        "manufacturer": "TestVendor Inc.",
        "first_seen": BASE_TIME,
        "last_seen": BASE_TIME + 30,
        "is_gateway": False,
        "is_local": False,
    }
    defaults.update(overrides)
    return HostRecord(**defaults)


def make_host_inventory(n: int = 5) -> list:
    """Create a list of n host records with incrementing IPs."""
    hosts = []
    for i in range(n):
        host = make_host_record(
            ip=f"192.168.1.{100 + i}",
            mac=f"aa:bb:cc:00:00:{(i + 1):02x}",
            hostname=f"host-{i}.local" if i % 2 == 0 else None,
            manufacturer=f"Vendor{i}" if i % 3 != 0 else None,
            is_gateway=(i == 0),
            first_seen=BASE_TIME + i,
            last_seen=BASE_TIME + 30 + i,
        )
        hosts.append(host)
    return hosts
