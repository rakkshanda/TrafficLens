"""Smoke tests: OUI database loading."""

import pytest


@pytest.mark.smoke
class TestOUILoading:
    def test_oui_module_imports(self):
        from trafficlens.discovery.oui import lookup_manufacturer
        assert callable(lookup_manufacturer)

    def test_oui_lookup_returns_string_or_none(self):
        from trafficlens.discovery.oui import lookup_manufacturer
        result = lookup_manufacturer("00:00:00:00:00:00")
        assert result is None or isinstance(result, str)

    def test_oui_known_prefix(self):
        from trafficlens.discovery.oui import lookup_manufacturer
        # Apple's OUI prefix
        result = lookup_manufacturer("AC:DE:48:00:00:00")
        # manuf may or may not have this exact prefix, but should not crash
        assert result is None or isinstance(result, str)
