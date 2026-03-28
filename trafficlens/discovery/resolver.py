"""Hostname resolution for discovered hosts."""

import logging
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List

from trafficlens.config import DNS_TIMEOUT
from trafficlens.discovery.models import HostRecord

logger = logging.getLogger("trafficlens.discovery.resolver")


def _resolve_single(ip: str, timeout: float = DNS_TIMEOUT) -> str | None:
    """Resolve a single IP to a hostname. Returns None on failure."""
    old_timeout = socket.getdefaulttimeout()
    try:
        socket.setdefaulttimeout(timeout)
        hostname, _, _ = socket.gethostbyaddr(ip)
        return hostname
    except (socket.herror, socket.gaierror, socket.timeout, OSError):
        return None
    finally:
        socket.setdefaulttimeout(old_timeout)


def resolve_hostnames(
    hosts: List[HostRecord],
    timeout: float = DNS_TIMEOUT,
    max_workers: int = 10,
) -> List[HostRecord]:
    """Resolve hostnames for a list of hosts using concurrent DNS lookups.

    Modifies hosts in-place and returns the same list.
    """
    if not hosts:
        return hosts

    logger.info("Resolving hostnames for %d hosts...", len(hosts))

    with ThreadPoolExecutor(max_workers=min(max_workers, len(hosts))) as executor:
        future_to_host = {
            executor.submit(_resolve_single, host.ip, timeout): host
            for host in hosts
        }

        for future in as_completed(future_to_host):
            host = future_to_host[future]
            try:
                hostname = future.result()
                if hostname:
                    host.hostname = hostname
                    logger.debug("Resolved %s -> %s", host.ip, hostname)
            except Exception as e:
                logger.debug("DNS resolution failed for %s: %s", host.ip, e)

    resolved_count = sum(1 for h in hosts if h.hostname is not None)
    logger.info("Resolved %d/%d hostnames", resolved_count, len(hosts))
    return hosts
