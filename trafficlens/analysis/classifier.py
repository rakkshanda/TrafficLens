"""Protocol classifier mapping ports to human-readable protocol labels."""

import logging
from typing import Optional

from trafficlens.capture.models import RawPacket
from trafficlens.config import WELL_KNOWN_PORTS

logger = logging.getLogger("trafficlens.analysis.classifier")


def classify_protocol(packet: RawPacket) -> str:
    """Classify a packet into a human-readable protocol label.

    Classification priority:
    1. Non-IP protocols (ARP, ICMP) identified by protocol field
    2. Well-known destination port
    3. Well-known source port (for response packets)
    4. Fallback to "TCP/{port}" or "UDP/{port}"
    """
    # Non-IP protocols
    if packet.protocol == "ARP":
        return "ARP"
    if packet.protocol == "ICMP":
        return "ICMP"
    if packet.protocol not in ("TCP", "UDP"):
        return packet.protocol

    transport = packet.protocol

    # Check destination port first
    if packet.dst_port is not None:
        key = (packet.dst_port, transport)
        if key in WELL_KNOWN_PORTS:
            return WELL_KNOWN_PORTS[key]

    # Check source port (response packets)
    if packet.src_port is not None:
        key = (packet.src_port, transport)
        if key in WELL_KNOWN_PORTS:
            return WELL_KNOWN_PORTS[key]

    # Fallback
    port = packet.dst_port or packet.src_port
    if port is not None:
        return f"{transport}/{port}"

    return transport
