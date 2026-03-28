"""Packet capture engine wrapping scapy's AsyncSniffer."""

import logging
import queue
import threading
import time
from typing import Optional

from trafficlens.capture.models import RawPacket

logger = logging.getLogger("trafficlens.capture.sniffer")


class PacketCapture:
    """Threaded packet capture engine using scapy AsyncSniffer.

    Captures packets on a network interface and pushes RawPacket objects
    to a thread-safe queue for consumption by the analysis/dashboard.
    """

    def __init__(
        self,
        interface: str,
        packet_queue: queue.Queue,
        shutdown_event: threading.Event,
    ):
        self.interface = interface
        self.packet_queue = packet_queue
        self.shutdown_event = shutdown_event
        self._sniffer = None
        self._thread: Optional[threading.Thread] = None
        self.packet_count = 0
        self.malformed_count = 0
        self._dropped_count = 0

    def _extract_packet(self, scapy_pkt) -> Optional[RawPacket]:
        """Extract a RawPacket from a scapy Packet object.

        Returns None if the packet can't be parsed.
        """
        try:
            from scapy.all import IP, TCP, UDP, ARP, ICMP, Ether

            timestamp = float(scapy_pkt.time)
            size = len(scapy_pkt)

            # Extract layers
            raw_layers = []
            layer = scapy_pkt
            while layer:
                raw_layers.append(layer.__class__.__name__)
                layer = layer.payload if hasattr(layer, 'payload') and layer.payload and layer.payload.__class__.__name__ != "NoPayload" else None

            src_ip = dst_ip = src_mac = dst_mac = None
            src_port = dst_port = None
            protocol = "OTHER"

            # Ethernet layer
            if scapy_pkt.haslayer(Ether):
                src_mac = scapy_pkt[Ether].src
                dst_mac = scapy_pkt[Ether].dst

            # ARP
            if scapy_pkt.haslayer(ARP):
                arp = scapy_pkt[ARP]
                src_ip = arp.psrc
                dst_ip = arp.pdst
                protocol = "ARP"
                return RawPacket(
                    timestamp=timestamp, src_ip=src_ip, dst_ip=dst_ip,
                    src_mac=src_mac, dst_mac=dst_mac,
                    src_port=None, dst_port=None,
                    protocol=protocol, size=size,
                    raw_layers=tuple(raw_layers),
                )

            # IP layer
            if scapy_pkt.haslayer(IP):
                ip = scapy_pkt[IP]
                src_ip = ip.src
                dst_ip = ip.dst

                if scapy_pkt.haslayer(TCP):
                    tcp = scapy_pkt[TCP]
                    src_port = tcp.sport
                    dst_port = tcp.dport
                    protocol = "TCP"
                elif scapy_pkt.haslayer(UDP):
                    udp = scapy_pkt[UDP]
                    src_port = udp.sport
                    dst_port = udp.dport
                    protocol = "UDP"
                elif scapy_pkt.haslayer(ICMP):
                    protocol = "ICMP"
                else:
                    protocol = f"IP/{ip.proto}"

            return RawPacket(
                timestamp=timestamp, src_ip=src_ip, dst_ip=dst_ip,
                src_mac=src_mac, dst_mac=dst_mac,
                src_port=src_port, dst_port=dst_port,
                protocol=protocol, size=size,
                raw_layers=tuple(raw_layers),
            )
        except Exception as e:
            logger.debug("Failed to parse packet: %s", e)
            self.malformed_count += 1
            return None

    def _packet_callback(self, pkt):
        """Callback invoked by scapy for each captured packet."""
        raw = self._extract_packet(pkt)
        if raw is None:
            return

        self.packet_count += 1

        try:
            self.packet_queue.put_nowait(raw)
        except queue.Full:
            self._dropped_count += 1
            if self._dropped_count % 100 == 1:
                logger.warning(
                    "Packet queue full, dropped %d packets", self._dropped_count
                )

    def _run_sniffer(self):
        """Run the sniffer in a thread."""
        try:
            from scapy.all import AsyncSniffer

            self._sniffer = AsyncSniffer(
                iface=self.interface,
                prn=self._packet_callback,
                store=False,
            )
            self._sniffer.start()

            # Wait for shutdown signal
            self.shutdown_event.wait()

            # Stop sniffer
            try:
                self._sniffer.stop()
            except Exception:
                pass

        except PermissionError:
            logger.error("Permission denied for packet capture on %s", self.interface)
            self.shutdown_event.set()
        except OSError as e:
            logger.error("Interface error during capture: %s", e)
            self.shutdown_event.set()
        except Exception as e:
            logger.error("Capture thread error: %s", e)
            self.shutdown_event.set()

    def start(self):
        """Start the capture thread."""
        logger.info("Starting capture on %s", self.interface)
        self._thread = threading.Thread(target=self._run_sniffer, daemon=True)
        self._thread.start()

    def stop(self):
        """Stop the capture and wait for the thread to finish."""
        self.shutdown_event.set()

        if self._thread is not None:
            self._thread.join(timeout=5)

        if self._dropped_count > 0:
            logger.warning("Total dropped packets: %d", self._dropped_count)

        logger.info(
            "Capture stopped: %d packets captured, %d malformed, %d dropped",
            self.packet_count, self.malformed_count, self._dropped_count,
        )
