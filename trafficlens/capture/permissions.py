"""Permission checks and user guidance for raw packet capture."""

import logging
import os
import socket
import sys

logger = logging.getLogger("trafficlens.capture.permissions")


def check_capture_permissions() -> bool:
    """Check if the current process has permission for raw packet capture.

    Returns True if we have sufficient privileges, False otherwise.
    """
    # Root always has permission
    if os.geteuid() == 0:
        return True

    # Try to create a raw socket to test CAP_NET_RAW
    try:
        s = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.htons(0x0003))
        s.close()
        return True
    except PermissionError:
        return False
    except OSError:
        return False


def require_capture_permissions() -> None:
    """Check permissions and exit with a helpful message if insufficient."""
    if check_capture_permissions():
        return

    python_path = sys.executable
    sys.stderr.write(
        "\nError: Raw packet capture requires elevated privileges.\n\n"
        "  Run with sudo:      sudo python -m trafficlens ...\n"
        f"  Or set capability:  sudo setcap cap_net_raw+ep {python_path}\n\n"
    )
    sys.exit(1)
