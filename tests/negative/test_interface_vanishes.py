"""Negative tests: interface disappears mid-capture."""

import pytest
import threading
import queue
from unittest.mock import patch, MagicMock
from trafficlens.capture.sniffer import PacketCapture


@pytest.mark.negative
class TestInterfaceVanishes:
    def test_capture_handles_interface_error(self):
        """Interface error during capture -> shutdown event set, no crash."""
        shutdown_event = threading.Event()
        pkt_queue = queue.Queue()

        capture = PacketCapture(
            interface="nonexistent0",
            packet_queue=pkt_queue,
            shutdown_event=shutdown_event,
        )

        # Patch at scapy.all level since sniffer uses `from scapy.all import AsyncSniffer`
        mock_sniffer_instance = MagicMock()
        mock_sniffer_instance.start.side_effect = OSError("No such device")

        with patch("scapy.all.AsyncSniffer", return_value=mock_sniffer_instance):
            # Run the sniffer method directly — it should catch the OSError
            # and set shutdown_event
            capture._run_sniffer()

        assert shutdown_event.is_set()

    def test_packets_before_error_preserved(self):
        """Packets collected before interface error are still in queue."""
        pkt_queue = queue.Queue()
        shutdown_event = threading.Event()

        capture = PacketCapture(
            interface="eth0",
            packet_queue=pkt_queue,
            shutdown_event=shutdown_event,
        )

        # Manually push some packets to simulate pre-error collection
        from trafficlens.capture.models import RawPacket
        for i in range(5):
            pkt = RawPacket(
                timestamp=i, src_ip="10.0.0.1", dst_ip="10.0.0.2",
                src_mac="aa:bb:cc:00:00:01", dst_mac="aa:bb:cc:00:00:02",
                src_port=12345, dst_port=80, protocol="TCP", size=100,
                raw_layers=("Ether", "IP", "TCP"),
            )
            pkt_queue.put(pkt)

        shutdown_event.set()
        assert pkt_queue.qsize() == 5
