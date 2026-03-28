"""Failure isolation tests: DNS resolution timeout."""

import pytest
import socket
from unittest.mock import patch
from trafficlens.discovery.models import HostRecord
from trafficlens.discovery.resolver import resolve_hostnames


@pytest.mark.failure_isolation
class TestDNSTimeout:
    def test_timeout_sets_hostname_none(self):
        """DNS timeout -> hostname field is None."""
        hosts = [HostRecord(ip="192.168.1.1", mac="aa:bb:cc:00:00:01")]
        with patch("trafficlens.discovery.resolver.socket.gethostbyaddr") as mock_dns:
            mock_dns.side_effect = socket.timeout("timed out")
            result = resolve_hostnames(hosts, timeout=0.1)
        assert result[0].hostname is None

    def test_pipeline_continues_after_timeout(self):
        """Pipeline continues to analysis after timeout."""
        hosts = [
            HostRecord(ip="192.168.1.1", mac="aa:bb:cc:00:00:01"),
            HostRecord(ip="192.168.1.2", mac="aa:bb:cc:00:00:02"),
        ]

        def mock_resolve(ip):
            if ip == "192.168.1.1":
                raise socket.timeout("timed out")
            return ("host2.local", [], [ip])

        with patch("trafficlens.discovery.resolver.socket.gethostbyaddr", side_effect=mock_resolve):
            result = resolve_hostnames(hosts, timeout=0.1)

        # First host timed out, second resolved
        assert result[0].hostname is None
        assert result[1].hostname == "host2.local"

    def test_timeout_does_not_block_others(self):
        """Timeout for one host doesn't block resolution of other hosts."""
        hosts = [HostRecord(ip=f"192.168.1.{i}", mac=f"aa:bb:cc:00:00:{i:02x}") for i in range(1, 4)]

        call_count = 0

        def mock_resolve(ip):
            nonlocal call_count
            call_count += 1
            if ip == "192.168.1.2":
                raise socket.timeout("timed out")
            return (f"host-{ip.split('.')[-1]}.local", [], [ip])

        with patch("trafficlens.discovery.resolver.socket.gethostbyaddr", side_effect=mock_resolve):
            result = resolve_hostnames(hosts, timeout=0.1)

        # All 3 were attempted
        assert call_count == 3
        assert result[0].hostname is not None  # 192.168.1.1 resolved
        assert result[1].hostname is None       # 192.168.1.2 timed out
        assert result[2].hostname is not None  # 192.168.1.3 resolved
