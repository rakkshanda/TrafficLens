"""ARP scanning for host discovery on the local subnet."""

import logging
import time
from typing import List

from trafficlens.discovery.models import HostRecord

logger = logging.getLogger("trafficlens.discovery.arp_scanner")


def arp_scan(interface: str, subnet: str, timeout: int = 3) -> List[HostRecord]:
    """Perform an ARP scan on the given subnet via the specified interface.

    Returns a list of HostRecord objects for each responding host.
    """
    from scapy.all import ARP, Ether, srp, conf, get_if_hwaddr

    logger.info("Starting ARP scan on %s (%s)", interface, subnet)

    # Get our own MAC for is_local detection
    try:
        local_mac = get_if_hwaddr(interface)
    except Exception:
        local_mac = None

    # Build and send ARP request
    arp_request = Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(pdst=subnet)

    # Suppress scapy output
    old_verb = conf.verb
    conf.verb = 0
    try:
        answered, _ = srp(arp_request, iface=interface, timeout=timeout, retry=0)
    except PermissionError:
        logger.error("Permission denied for ARP scan. Need root or CAP_NET_RAW.")
        raise
    except Exception as e:
        logger.warning("ARP scan failed: %s", e)
        return []
    finally:
        conf.verb = old_verb

    hosts = []
    now = time.time()
    for sent, received in answered:
        host = HostRecord(
            ip=received.psrc,
            mac=received.hwsrc.lower(),
            first_seen=now,
            last_seen=now,
            is_local=(received.hwsrc.lower() == local_mac.lower() if local_mac else False),
        )
        hosts.append(host)

    logger.info("ARP scan complete: %d hosts found", len(hosts))

    # Try to detect gateway
    _mark_gateway(hosts)

    return hosts


def _mark_gateway(hosts: List[HostRecord]) -> None:
    """Mark the default gateway in the host list."""
    try:
        from scapy.all import conf as scapy_conf
        gw_ip = scapy_conf.route.route("0.0.0.0")[2]
        for host in hosts:
            if host.ip == gw_ip:
                host.is_gateway = True
                break
    except Exception:
        pass
