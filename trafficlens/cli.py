"""TrafficLens CLI entry point."""

import enum
import logging
import os
import signal
import sys
import queue
import threading
import time
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console

from trafficlens import __version__
from trafficlens.config import (
    DEFAULT_DURATION,
    DEFAULT_OUTPUT,
    VIRTUAL_INTERFACE_PREFIXES,
    setup_logging,
)

logger = logging.getLogger("trafficlens.cli")
console = Console(stderr=True)

app = typer.Typer(
    name="trafficlens",
    help="TrafficLens - Local Network Traffic Analyzer",
    add_completion=False,
)


class ReportFormat(str, enum.Enum):
    md = "md"
    html = "html"
    both = "both"


def _get_interfaces() -> list:
    """Return list of non-virtual network interfaces with IPv4 addresses."""
    import psutil

    interfaces = []
    addrs = psutil.net_if_addrs()
    stats = psutil.net_if_stats()

    for name, addr_list in addrs.items():
        # Skip virtual interfaces
        if any(name.startswith(prefix) for prefix in VIRTUAL_INTERFACE_PREFIXES):
            continue

        stat = stats.get(name)
        if stat is None or not stat.isup:
            continue

        # Check for IPv4 address
        has_ipv4 = False
        ipv4_addr = None
        for addr in addr_list:
            if addr.family.name == "AF_INET":
                has_ipv4 = True
                ipv4_addr = addr.address
                break

        if has_ipv4:
            interfaces.append({"name": name, "ipv4": ipv4_addr, "is_up": stat.isup})

    return interfaces


def _auto_detect_interface() -> Optional[str]:
    """Auto-detect the best network interface for capture."""
    interfaces = _get_interfaces()
    if not interfaces:
        return None
    if len(interfaces) == 1:
        return interfaces[0]["name"]

    # Prefer non-loopback with an address
    for iface in interfaces:
        if iface["ipv4"] and not iface["ipv4"].startswith("127."):
            return iface["name"]

    return interfaces[0]["name"]


def _get_subnet(interface: str) -> str:
    """Get the subnet CIDR for an interface."""
    import psutil

    addrs = psutil.net_if_addrs().get(interface, [])
    for addr in addrs:
        if addr.family.name == "AF_INET":
            ip = addr.address
            netmask = addr.netmask
            if ip and netmask:
                # Simple /24 detection from netmask
                parts = netmask.split(".")
                prefix_len = sum(bin(int(p)).count("1") for p in parts)
                ip_parts = ip.split(".")
                # Zero out host bits for common cases
                if prefix_len == 24:
                    return f"{ip_parts[0]}.{ip_parts[1]}.{ip_parts[2]}.0/24"
                elif prefix_len == 16:
                    return f"{ip_parts[0]}.{ip_parts[1]}.0.0/16"
                return f"{ip}/{prefix_len}"
    return "unknown"


@app.command("interfaces")
def list_interfaces():
    """List available network interfaces."""
    from rich.table import Table

    interfaces = _get_interfaces()
    if not interfaces:
        console.print("[yellow]No non-virtual network interfaces found.[/yellow]")
        raise typer.Exit(1)

    table = Table(title="Available Network Interfaces")
    table.add_column("Interface", style="cyan")
    table.add_column("IPv4 Address", style="green")
    table.add_column("Status", style="bold")

    for iface in interfaces:
        status = "[green]UP[/green]" if iface["is_up"] else "[red]DOWN[/red]"
        table.add_row(iface["name"], iface["ipv4"] or "N/A", status)

    console.print(table)


@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    interface: Optional[str] = typer.Option(
        None, "--interface", "-i", help="Network interface to capture on"
    ),
    duration: int = typer.Option(
        DEFAULT_DURATION, "--duration", "-d", help="Capture duration in seconds (0 = until Ctrl+C)"
    ),
    output: str = typer.Option(
        DEFAULT_OUTPUT, "--output", "-o", help="Output path for reports (no extension)"
    ),
    format: ReportFormat = typer.Option(
        ReportFormat.both, "--format", "-f", help="Report format: md, html, or both"
    ),
    no_dashboard: bool = typer.Option(
        False, "--no-dashboard", help="Skip live terminal dashboard"
    ),
    no_arp: bool = typer.Option(
        False, "--no-arp", help="Skip initial ARP discovery scan"
    ),
    upload: bool = typer.Option(
        False, "--upload", help="Upload results to InsForge backend"
    ),
    backend_url: Optional[str] = typer.Option(
        None, "--backend-url", help="InsForge endpoint URL",
        envvar="TRAFFICLENS_BACKEND_URL",
    ),
    verbose: bool = typer.Option(
        False, "--verbose", "-v", help="Enable debug-level logging"
    ),
    quiet: bool = typer.Option(
        False, "--quiet", "-q", help="Suppress all output except errors"
    ),
    version: bool = typer.Option(
        False, "--version", help="Show version and exit"
    ),
):
    """Capture and analyze local network traffic."""
    if version:
        console.print(f"TrafficLens v{__version__}")
        raise typer.Exit(0)

    # If a subcommand was invoked, don't run main
    if ctx.invoked_subcommand is not None:
        return

    setup_logging(verbose=verbose, quiet=quiet)

    # Check permissions
    from trafficlens.capture.permissions import require_capture_permissions
    require_capture_permissions()

    # Resolve interface
    if interface is None:
        interface = _auto_detect_interface()
        if interface is None:
            console.print(
                "[red]Error:[/red] No suitable network interface found.\n"
                "Use [cyan]python -m trafficlens interfaces[/cyan] to list available interfaces,\n"
                "then specify one with [cyan]--interface[/cyan]."
            )
            raise typer.Exit(1)
        logger.info("Auto-detected interface: %s", interface)

    # Verify interface exists
    import psutil
    all_ifaces = psutil.net_if_addrs()
    if interface not in all_ifaces:
        console.print(f"[red]Error:[/red] Interface '{interface}' not found.")
        console.print("Available interfaces:")
        for name in sorted(all_ifaces.keys()):
            console.print(f"  {name}")
        raise typer.Exit(1)

    # Validate output directory
    output_path = Path(output)
    output_dir = output_path.parent
    if not output_dir.exists():
        console.print(
            f"[red]Error:[/red] Output directory '{output_dir}' does not exist.\n"
            f"Create it first or specify a different [cyan]--output[/cyan] path."
        )
        raise typer.Exit(1)

    subnet = _get_subnet(interface)
    if not quiet:
        console.print(f"[bold]TrafficLens v{__version__}[/bold]")
        console.print(f"Interface: [cyan]{interface}[/cyan]  Subnet: [cyan]{subnet}[/cyan]")
        console.print(
            f"Duration: [cyan]{duration}s[/cyan]  "
            f"Format: [cyan]{format.value}[/cyan]  "
            f"Dashboard: [cyan]{'off' if no_dashboard else 'on'}[/cyan]"
        )
        console.print()

    # Import heavy modules only after validation
    from trafficlens.analysis.aggregator import TrafficAggregator
    from trafficlens.analysis.models import ScanMetadata

    aggregator = TrafficAggregator()
    start_time = time.time()
    scan_meta = ScanMetadata(
        start_time=start_time,
        interface=interface,
        subnet=subnet,
    )

    # Phase 1: Host Discovery
    if not no_arp:
        if not quiet:
            console.print("[bold]Phase 1:[/bold] Discovering hosts via ARP scan...")
        try:
            from trafficlens.discovery.arp_scanner import arp_scan
            from trafficlens.discovery.resolver import resolve_hostnames
            from trafficlens.discovery.oui import lookup_manufacturers

            hosts = arp_scan(interface, subnet)
            hosts = resolve_hostnames(hosts)
            hosts = lookup_manufacturers(hosts)
            aggregator.register_hosts(hosts)

            if not quiet:
                from rich.table import Table
                table = Table(title=f"Discovered {len(hosts)} hosts")
                table.add_column("IP", style="cyan")
                table.add_column("MAC", style="dim")
                table.add_column("Hostname")
                table.add_column("Manufacturer")
                for h in hosts:
                    table.add_row(h.ip, h.mac, h.hostname or "", h.manufacturer or "")
                console.print(table)
                console.print()
        except Exception as e:
            logger.warning("ARP scan failed: %s. Continuing with passive discovery.", e)

    # Phase 2: Packet Capture
    if not quiet:
        dur_msg = f"{duration}s" if duration > 0 else "until Ctrl+C"
        console.print(f"[bold]Phase 2:[/bold] Capturing traffic for {dur_msg}...")

    from trafficlens.capture.sniffer import PacketCapture
    from trafficlens.config import QUEUE_MAX_SIZE

    packet_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
    shutdown_event = threading.Event()

    capture = PacketCapture(
        interface=interface,
        packet_queue=packet_queue,
        shutdown_event=shutdown_event,
    )

    # Set up SIGINT handler
    original_sigint = signal.getsignal(signal.SIGINT)

    def sigint_handler(sig, frame):
        if not quiet:
            console.print("\n[yellow]Ctrl+C received, stopping capture...[/yellow]")
        shutdown_event.set()

    signal.signal(signal.SIGINT, sigint_handler)

    # Start capture
    capture.start()

    # Duration timer
    if duration > 0:
        timer = threading.Timer(duration, shutdown_event.set)
        timer.daemon = True
        timer.start()

    # Phase 2b: Dashboard or silent capture
    if no_dashboard:
        # Just wait for shutdown
        shutdown_event.wait()
    else:
        from trafficlens.reporting.dashboard import run_dashboard
        run_dashboard(
            packet_queue=packet_queue,
            aggregator=aggregator,
            shutdown_event=shutdown_event,
            scan_metadata=scan_meta,
        )

    # Stop capture and drain remaining packets
    capture.stop()
    signal.signal(signal.SIGINT, original_sigint)

    # Drain any remaining packets from queue
    while not packet_queue.empty():
        try:
            pkt = packet_queue.get_nowait()
            aggregator.ingest(pkt)
        except queue.Empty:
            break

    # Finalize
    end_time = time.time()
    scan_meta.end_time = end_time
    scan_meta.duration_seconds = int(end_time - start_time)
    scan_meta.total_packets = aggregator.packet_count
    scan_meta.total_bytes = aggregator.total_bytes
    scan_meta.malformed_packets = capture.malformed_count

    summary = aggregator.finalize(scan_meta)

    if not quiet:
        console.print()
        console.print(
            f"[bold]Capture complete.[/bold] "
            f"{summary.scan_metadata.total_packets} packets, "
            f"{len(summary.hosts)} hosts, "
            f"{summary.scan_metadata.duration_seconds}s duration."
        )

    # Phase 3: Report Generation
    if not quiet:
        console.print(f"\n[bold]Phase 3:[/bold] Generating reports...")

    from trafficlens.reporting.markdown import generate_markdown_report
    from trafficlens.reporting.html import generate_html_report

    if format in (ReportFormat.md, ReportFormat.both):
        md_path = f"{output}.md"
        generate_markdown_report(summary, md_path)
        if not quiet:
            console.print(f"  Markdown: [green]{md_path}[/green]")

    if format in (ReportFormat.html, ReportFormat.both):
        html_path = f"{output}.html"
        generate_html_report(summary, html_path)
        if not quiet:
            console.print(f"  HTML:     [green]{html_path}[/green]")

    # Phase 4: Optional upload
    if upload:
        if not quiet:
            console.print(f"\n[bold]Phase 4:[/bold] Uploading to InsForge...")
        from trafficlens.backend.uploader import upload_scan
        url = backend_url or os.environ.get("TRAFFICLENS_BACKEND_URL")
        if not url:
            console.print(
                "[yellow]Warning:[/yellow] No backend URL configured. "
                "Set --backend-url or TRAFFICLENS_BACKEND_URL env var."
            )
        else:
            success = upload_scan(summary, url)
            if success and not quiet:
                console.print("  [green]Upload successful.[/green]")
            elif not success and not quiet:
                console.print("  [yellow]Upload failed. Local reports saved.[/yellow]")

    # Final statistics
    logger.info(
        "Session complete: %d packets, %d hosts, %ds, %d errors",
        summary.scan_metadata.total_packets,
        len(summary.hosts),
        summary.scan_metadata.duration_seconds,
        summary.scan_metadata.malformed_packets,
    )


def run():
    """Entry point for the CLI."""
    app()
