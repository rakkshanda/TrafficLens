"""Data models for the discovery module."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class HostRecord:
    """A discovered host on the local network."""

    ip: str
    mac: str
    hostname: Optional[str] = None
    manufacturer: Optional[str] = None
    first_seen: float = 0.0
    last_seen: float = 0.0
    is_gateway: bool = False
    is_local: bool = False
