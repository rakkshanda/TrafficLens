"""OUI (Organizationally Unique Identifier) manufacturer lookup."""

import logging
from typing import List, Optional

from trafficlens.discovery.models import HostRecord

logger = logging.getLogger("trafficlens.discovery.oui")

_parser = None
_load_attempted = False


def _get_parser():
    """Lazily load the manuf parser. Returns None if manuf is unavailable."""
    global _parser, _load_attempted
    if _load_attempted:
        return _parser

    _load_attempted = True
    try:
        import manuf
        _parser = manuf.MacParser()
        logger.debug("OUI database loaded successfully")
    except Exception as e:
        logger.warning("Failed to load OUI database: %s. Manufacturer lookup disabled.", e)
        _parser = None

    return _parser


def lookup_manufacturer(mac: str) -> Optional[str]:
    """Look up the manufacturer for a MAC address.

    Returns the manufacturer name or None if not found or OUI DB unavailable.
    """
    parser = _get_parser()
    if parser is None:
        return None

    try:
        result = parser.get_manuf(mac)
        return result if result else None
    except Exception:
        return None


def lookup_manufacturers(hosts: List[HostRecord]) -> List[HostRecord]:
    """Enrich a list of hosts with manufacturer information.

    Modifies hosts in-place and returns the same list.
    """
    parser = _get_parser()
    if parser is None:
        logger.warning("OUI database not available. Skipping manufacturer lookup.")
        return hosts

    for host in hosts:
        manufacturer = lookup_manufacturer(host.mac)
        if manufacturer:
            host.manufacturer = manufacturer

    enriched = sum(1 for h in hosts if h.manufacturer is not None)
    logger.info("OUI lookup: %d/%d hosts matched to manufacturers", enriched, len(hosts))
    return hosts
