"""Top talkers computation: ranking hosts by traffic volume and connection count."""

import logging
from typing import Dict, List, Tuple

from trafficlens.analysis.models import HostTraffic

logger = logging.getLogger("trafficlens.analysis.top_talkers")


def rank_by_bytes(
    per_host_traffic: Dict[str, HostTraffic],
    limit: int = 20,
) -> List[Tuple[str, int]]:
    """Rank hosts by total bytes (sent + received), descending.

    Returns a list of (ip, total_bytes) tuples.
    """
    ranked = [
        (ip, ht.bytes_sent + ht.bytes_received)
        for ip, ht in per_host_traffic.items()
    ]
    # Sort by bytes descending, then by IP for deterministic tie-breaking
    ranked.sort(key=lambda x: (-x[1], x[0]))
    return ranked[:limit]


def rank_by_connections(
    per_host_traffic: Dict[str, HostTraffic],
    limit: int = 20,
) -> List[Tuple[str, int]]:
    """Rank hosts by connection count, descending.

    Returns a list of (ip, connection_count) tuples.
    """
    ranked = [
        (ip, ht.connection_count)
        for ip, ht in per_host_traffic.items()
    ]
    ranked.sort(key=lambda x: (-x[1], x[0]))
    return ranked[:limit]
