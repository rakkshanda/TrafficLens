"""Unit tests: top talkers ranking."""

import pytest
from trafficlens.analysis.top_talkers import rank_by_bytes, rank_by_connections
from trafficlens.analysis.models import HostTraffic


@pytest.mark.unit
class TestTopTalkers:
    def test_sort_by_bytes_descending(self):
        data = {
            "10.0.0.1": HostTraffic(bytes_sent=100, bytes_received=200),
            "10.0.0.2": HostTraffic(bytes_sent=500, bytes_received=500),
            "10.0.0.3": HostTraffic(bytes_sent=50, bytes_received=50),
        }
        result = rank_by_bytes(data)
        assert result[0] == ("10.0.0.2", 1000)
        assert result[1] == ("10.0.0.1", 300)
        assert result[2] == ("10.0.0.3", 100)

    def test_sort_by_connections_descending(self):
        data = {
            "10.0.0.1": HostTraffic(connection_count=5),
            "10.0.0.2": HostTraffic(connection_count=20),
            "10.0.0.3": HostTraffic(connection_count=10),
        }
        result = rank_by_connections(data)
        assert result[0] == ("10.0.0.2", 20)
        assert result[1] == ("10.0.0.3", 10)
        assert result[2] == ("10.0.0.1", 5)

    def test_top_n_limit(self):
        data = {f"10.0.0.{i}": HostTraffic(bytes_sent=i * 100) for i in range(1, 11)}
        result = rank_by_bytes(data, limit=3)
        assert len(result) == 3

    def test_tie_breaking_by_ip(self):
        data = {
            "10.0.0.2": HostTraffic(bytes_sent=500, bytes_received=0),
            "10.0.0.1": HostTraffic(bytes_sent=500, bytes_received=0),
        }
        result = rank_by_bytes(data)
        # Same bytes, should be sorted by IP (ascending) for tie-breaking
        assert result[0][0] == "10.0.0.1"
        assert result[1][0] == "10.0.0.2"

    def test_single_host(self):
        data = {"10.0.0.1": HostTraffic(bytes_sent=999, bytes_received=1)}
        result = rank_by_bytes(data)
        assert result == [("10.0.0.1", 1000)]

    def test_empty_data(self):
        result = rank_by_bytes({})
        assert result == []

    def test_connections_empty_data(self):
        result = rank_by_connections({})
        assert result == []
