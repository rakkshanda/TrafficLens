"""Failure isolation tests: missing OUI database."""

import pytest
from unittest.mock import patch
from trafficlens.discovery.models import HostRecord


@pytest.mark.failure_isolation
class TestMissingOUIDB:
    def test_missing_oui_returns_none(self):
        """OUI loader failure -> returns None, no crash."""
        import trafficlens.discovery.oui as oui_mod
        old_parser = oui_mod._parser
        old_attempted = oui_mod._load_attempted

        try:
            oui_mod._parser = None
            oui_mod._load_attempted = False
            # Make the `import manuf` inside _get_parser() fail
            with patch.dict("sys.modules", {"manuf": None}):
                result = oui_mod.lookup_manufacturer("aa:bb:cc:00:00:01")
                assert result is None
        finally:
            oui_mod._parser = old_parser
            oui_mod._load_attempted = old_attempted

    def test_discovery_continues_without_oui(self):
        """Discovery with failed OUI -> hosts have IP/MAC but manufacturer is None."""
        hosts = [HostRecord(ip="192.168.1.1", mac="aa:bb:cc:00:00:01")]

        import trafficlens.discovery.oui as oui_mod
        old_parser = oui_mod._parser
        old_attempted = oui_mod._load_attempted

        try:
            oui_mod._parser = None
            oui_mod._load_attempted = True  # Pretend load was attempted and failed

            result = oui_mod.lookup_manufacturers(hosts)
            assert len(result) == 1
            assert result[0].ip == "192.168.1.1"
            assert result[0].mac == "aa:bb:cc:00:00:01"
            # manufacturer should be None since parser is None
            assert result[0].manufacturer is None
        finally:
            oui_mod._parser = old_parser
            oui_mod._load_attempted = old_attempted

    def test_warning_logged_for_missing_oui(self, caplog):
        """Warning log is emitted about missing OUI."""
        import logging
        import trafficlens.discovery.oui as oui_mod
        old_parser = oui_mod._parser
        old_attempted = oui_mod._load_attempted

        try:
            oui_mod._parser = None
            oui_mod._load_attempted = True

            hosts = [HostRecord(ip="192.168.1.1", mac="aa:bb:cc:00:00:01")]
            with caplog.at_level(logging.WARNING, logger="trafficlens.discovery.oui"):
                oui_mod.lookup_manufacturers(hosts)
            assert any("not available" in r.message.lower() or "oui" in r.message.lower()
                       for r in caplog.records)
        finally:
            oui_mod._parser = old_parser
            oui_mod._load_attempted = old_attempted
