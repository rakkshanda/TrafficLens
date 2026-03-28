"""Live terminal dashboard using Rich Live display."""

import logging
import queue
import threading
import time

from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from trafficlens.analysis.aggregator import TrafficAggregator
from trafficlens.analysis.models import ScanMetadata

logger = logging.getLogger("trafficlens.reporting.dashboard")

REFRESH_INTERVAL = 0.25  # 4Hz


def _format_bytes(n: int) -> str:
    """Format bytes into human-readable string."""
    if n < 1024:
        return f"{n} B"
    elif n < 1024 * 1024:
        return f"{n / 1024:.1f} KB"
    elif n < 1024 * 1024 * 1024:
        return f"{n / (1024 * 1024):.1f} MB"
    return f"{n / (1024 * 1024 * 1024):.1f} GB"


def _build_host_table(summary) -> Table:
    """Build the host inventory table."""
    table = Table(title="Host Inventory", expand=True, padding=(0, 1))
    table.add_column("IP", style="cyan", no_wrap=True)
    table.add_column("MAC", style="dim", no_wrap=True)
    table.add_column("Hostname", max_width=25)
    table.add_column("Vendor", max_width=20)
    table.add_column("Sent", justify="right", style="green")
    table.add_column("Recv", justify="right", style="yellow")

    for ip in sorted(summary.hosts.keys()):
        host = summary.hosts[ip]
        traffic = summary.per_host_traffic.get(ip)
        sent = _format_bytes(traffic.bytes_sent) if traffic else "-"
        recv = _format_bytes(traffic.bytes_received) if traffic else "-"
        table.add_row(
            ip,
            host.mac[:17] if host.mac else "",
            host.hostname or "",
            host.manufacturer or "",
            sent,
            recv,
        )

    return table


def _build_protocol_table(summary) -> Table:
    """Build the protocol distribution table."""
    table = Table(title="Protocol Distribution", expand=True, padding=(0, 1))
    table.add_column("Protocol", style="bold")
    table.add_column("Bytes", justify="right")
    table.add_column("Share", justify="right")

    total = sum(summary.protocol_distribution.values()) or 1
    sorted_protos = sorted(
        summary.protocol_distribution.items(),
        key=lambda x: -x[1],
    )

    for proto, bytes_count in sorted_protos[:12]:
        pct = (bytes_count / total) * 100
        bar_len = int(pct / 5)
        bar = "=" * bar_len
        table.add_row(proto, _format_bytes(bytes_count), f"{pct:.1f}% {bar}")

    return table


def _build_top_talkers_table(summary) -> Table:
    """Build the top talkers table."""
    table = Table(title="Top Talkers (by bytes)", expand=True, padding=(0, 1))
    table.add_column("#", style="dim", width=3)
    table.add_column("IP", style="cyan")
    table.add_column("Total", justify="right", style="bold")

    for i, (ip, total_bytes) in enumerate(summary.top_talkers_by_bytes[:10], 1):
        table.add_row(str(i), ip, _format_bytes(total_bytes))

    return table


def _build_stats_panel(summary, start_time: float) -> Panel:
    """Build the live statistics panel."""
    elapsed = time.time() - start_time
    pps = summary.scan_metadata.total_packets / elapsed if elapsed > 0 else 0

    text = Text()
    text.append(f"Packets:  {summary.scan_metadata.total_packets:,}\n", style="bold")
    text.append(f"Bytes:    {_format_bytes(summary.scan_metadata.total_bytes)}\n")
    text.append(f"Hosts:    {len(summary.hosts)}\n")
    text.append(f"Rate:     {pps:.0f} pps\n")
    text.append(f"Elapsed:  {int(elapsed)}s\n")
    text.append(f"Protocols: {len(summary.protocol_distribution)}\n")

    return Panel(text, title="Live Stats", border_style="green")


def _build_layout(summary, start_time: float) -> Layout:
    """Build the full dashboard layout."""
    layout = Layout()
    layout.split_column(
        Layout(name="upper", ratio=3),
        Layout(name="lower", ratio=2),
    )

    layout["upper"].split_row(
        Layout(_build_host_table(summary), name="hosts", ratio=3),
        Layout(_build_protocol_table(summary), name="protocols", ratio=2),
    )

    layout["lower"].split_row(
        Layout(_build_top_talkers_table(summary), name="talkers", ratio=2),
        Layout(_build_stats_panel(summary, start_time), name="stats", ratio=1),
    )

    return layout


def run_dashboard(
    packet_queue: queue.Queue,
    aggregator: TrafficAggregator,
    shutdown_event: threading.Event,
    scan_metadata: ScanMetadata,
) -> None:
    """Run the live terminal dashboard until shutdown_event is set.

    Drains packets from the queue, feeds them to the aggregator,
    takes snapshots, and renders the Rich layout.
    """
    console = Console(stderr=True)
    start_time = scan_metadata.start_time or time.time()

    try:
        with Live(
            _build_layout(aggregator.snapshot(), start_time),
            console=console,
            refresh_per_second=4,
            screen=True,
        ) as live:
            while not shutdown_event.is_set():
                # Batch-drain the queue
                drained = 0
                while drained < 500:  # limit per tick to keep dashboard responsive
                    try:
                        pkt = packet_queue.get_nowait()
                        aggregator.ingest(pkt)
                        drained += 1
                    except queue.Empty:
                        break

                # Update scan metadata counters for the snapshot
                scan_metadata.total_packets = aggregator.packet_count
                scan_metadata.total_bytes = aggregator.total_bytes

                summary = aggregator.snapshot()
                live.update(_build_layout(summary, start_time))

                # Sleep for remainder of tick
                time.sleep(REFRESH_INTERVAL)

    except KeyboardInterrupt:
        shutdown_event.set()
    except Exception as e:
        logger.error("Dashboard error: %s", e)
        shutdown_event.set()
