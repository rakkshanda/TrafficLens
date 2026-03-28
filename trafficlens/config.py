"""Logging setup and shared configuration for TrafficLens."""

import logging
import sys


DEFAULT_INTERFACE = None  # auto-detect
DEFAULT_DURATION = 60
DEFAULT_OUTPUT = "./trafficlens_report"
QUEUE_MAX_SIZE = 10000
DASHBOARD_REFRESH_HZ = 4
ARP_TIMEOUT = 3
DNS_TIMEOUT = 1.0
UPLOAD_TIMEOUT = 5
UPLOAD_RETRIES = 1

# Protocol classification: (port, transport) -> label
WELL_KNOWN_PORTS = {
    (80, "TCP"): "HTTP",
    (443, "TCP"): "HTTPS",
    (53, "UDP"): "DNS",
    (53, "TCP"): "DNS",
    (22, "TCP"): "SSH",
    (445, "TCP"): "SMB",
    (139, "TCP"): "SMB",
    (5353, "UDP"): "mDNS",
    (67, "UDP"): "DHCP",
    (68, "UDP"): "DHCP",
    (123, "UDP"): "NTP",
    (1900, "UDP"): "SSDP",
    (5355, "UDP"): "LLMNR",
    (137, "UDP"): "NetBIOS",
    (138, "UDP"): "NetBIOS",
    (3389, "TCP"): "RDP",
    (21, "TCP"): "FTP",
    (25, "TCP"): "SMTP",
    (110, "TCP"): "POP3",
    (143, "TCP"): "IMAP",
    (993, "TCP"): "IMAPS",
    (995, "TCP"): "POP3S",
    (8080, "TCP"): "HTTP-ALT",
    (8443, "TCP"): "HTTPS-ALT",
}

# Interfaces to exclude from auto-detection
VIRTUAL_INTERFACE_PREFIXES = ("lo", "docker", "br-", "veth", "virbr", "vbox", "vmnet")


def setup_logging(verbose: bool = False, quiet: bool = False) -> None:
    """Configure structured logging for TrafficLens."""
    if quiet:
        level = logging.WARNING
    elif verbose:
        level = logging.DEBUG
    else:
        level = logging.INFO

    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    )

    root_logger = logging.getLogger("trafficlens")
    root_logger.setLevel(level)
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
