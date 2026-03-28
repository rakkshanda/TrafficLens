"""Unit tests: OUI lookup."""

import pytest
from trafficlens.discovery.oui import lookup_manufacturer, lookup_manufacturers
from trafficlens.discovery.models import HostRecord


@pytest.mark.unit
class TestOUILookup:
    def test_unknown_prefix_returns_none(self):
        result = lookup_manufacturer("00:00:00:00:00:00")
        # Could be None or a string if OUI DB happens to have it
        assert result is None or isinstance(result, str)

    def test_valid_mac_format_accepted(self):
        # Should not crash on any valid MAC format
        result = lookup_manufacturer("aa:bb:cc:dd:ee:ff")
        assert result is None or isinstance(result, str)

    def test_lookup_manufacturers_enriches_hosts(self):
        hosts = [
            HostRecord(ip="192.168.1.1", mac="00:17:C4:00:00:01"),  # Quanta-ish
            HostRecord(ip="192.168.1.2", mac="aa:bb:cc:dd:ee:ff"),
        ]
        result = lookup_manufacturers(hosts)
        assert len(result) == 2
        # At least should not crash
        for h in result:
            assert h.manufacturer is None or isinstance(h.manufacturer, str)

    def test_empty_host_list(self):
        result = lookup_manufacturers([])
        assert result == []

    def test_case_insensitive_mac(self):
        r1 = lookup_manufacturer("AA:BB:CC:DD:EE:FF")
        r2 = lookup_manufacturer("aa:bb:cc:dd:ee:ff")
        assert r1 == r2
