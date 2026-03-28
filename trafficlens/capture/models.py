"""Data models for the capture module."""

from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass(frozen=True)
class RawPacket:
    """Immutable summary of a single captured packet.

    This is the canonical data unit emitted by the capture module and consumed
    by the analysis module. No payload is stored (privacy-safe, memory-efficient).
    """

    timestamp: float
    src_ip: Optional[str]
    dst_ip: Optional[str]
    src_mac: Optional[str]
    dst_mac: Optional[str]
    src_port: Optional[int]
    dst_port: Optional[int]
    protocol: str  # "TCP", "UDP", "ARP", "ICMP", etc.
    size: int  # Total packet length in bytes
    raw_layers: Tuple[str, ...]  # ("Ether", "IP", "TCP") for deeper classification
