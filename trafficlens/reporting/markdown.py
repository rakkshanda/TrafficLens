"""Markdown report generation."""

import logging
from datetime import datetime
from typing import Optional

from trafficlens.analysis.models import TrafficSummary

logger = logging.getLogger("trafficlens.reporting.markdown")


def _format_bytes(n: int) -> str:
    if n < 1024:
        return f"{n} B"
    elif n < 1024 * 1024:
        return f"{n / 1024:.1f} KB"
    elif n < 1024 * 1024 * 1024:
        return f"{n / (1024 * 1024):.1f} MB"
    return f"{n / (1024 * 1024 * 1024):.1f} GB"


def _format_timestamp(ts: float) -> str:
    if ts == 0:
        return "N/A"
    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S")


def generate_markdown_report(summary: TrafficSummary, output_path: str) -> None:
    """Generate a Markdown report from a TrafficSummary."""
    meta = summary.scan_metadata
    lines = []

    lines.append("# TrafficLens Scan Report\n")
    lines.append(f"**Date:** {_format_timestamp(meta.start_time)}\n")
    lines.append(f"**Interface:** {meta.interface}\n")
    lines.append(f"**Subnet:** {meta.subnet}\n")
    lines.append(f"**Duration:** {meta.duration_seconds}s\n")
    lines.append(f"**Packets:** {meta.total_packets:,}\n")
    lines.append(f"**Total Bytes:** {_format_bytes(meta.total_bytes)}\n")
    lines.append(f"**Hosts Discovered:** {len(summary.hosts)}\n")
    if meta.malformed_packets > 0:
        lines.append(f"**Malformed Packets:** {meta.malformed_packets}\n")
    lines.append("")

    # Host Inventory
    lines.append("## Host Inventory\n")
    if summary.hosts:
        lines.append("| IP | MAC | Hostname | Manufacturer | First Seen | Last Seen |")
        lines.append("|---|---|---|---|---|---|")
        for ip in sorted(summary.hosts.keys()):
            h = summary.hosts[ip]
            gw = " (GW)" if h.is_gateway else ""
            lines.append(
                f"| {ip}{gw} | {h.mac} | {h.hostname or '-'} | "
                f"{h.manufacturer or '-'} | {_format_timestamp(h.first_seen)} | "
                f"{_format_timestamp(h.last_seen)} |"
            )
        lines.append("")
    else:
        lines.append("No hosts discovered.\n")

    # Per-Host Traffic Breakdown
    lines.append("## Per-Host Traffic Breakdown\n")
    if summary.per_host_traffic:
        lines.append("| IP | Sent | Received | Connections | Top Protocol |")
        lines.append("|---|---|---|---|---|")
        for ip in sorted(summary.per_host_traffic.keys()):
            ht = summary.per_host_traffic[ip]
            top_proto = max(ht.protocols.items(), key=lambda x: x[1])[0] if ht.protocols else "-"
            host = summary.hosts.get(ip)
            gw = " (GW)" if host and host.is_gateway else ""
            lines.append(
                f"| {ip}{gw} | {_format_bytes(ht.bytes_sent)} | "
                f"{_format_bytes(ht.bytes_received)} | "
                f"{ht.connection_count} | {top_proto} |"
            )
        lines.append("")
    else:
        lines.append("No traffic captured.\n")

    # Protocol Distribution
    lines.append("## Protocol Distribution\n")
    if summary.protocol_distribution:
        total = sum(summary.protocol_distribution.values()) or 1
        lines.append("| Protocol | Bytes | Share |")
        lines.append("|---|---|---|")
        sorted_protos = sorted(
            summary.protocol_distribution.items(), key=lambda x: -x[1]
        )
        for proto, byte_count in sorted_protos:
            pct = (byte_count / total) * 100
            lines.append(f"| {proto} | {_format_bytes(byte_count)} | {pct:.1f}% |")
        lines.append("")
    else:
        lines.append("No protocols detected.\n")

    # Top Talkers
    lines.append("## Top Talkers (by Bytes)\n")
    if summary.top_talkers_by_bytes:
        lines.append("| Rank | IP | Total Bytes |")
        lines.append("|---|---|---|")
        for i, (ip, total_bytes) in enumerate(summary.top_talkers_by_bytes[:20], 1):
            host = summary.hosts.get(ip)
            gw = " (GW)" if host and host.is_gateway else ""
            lines.append(f"| {i} | {ip}{gw} | {_format_bytes(total_bytes)} |")
        lines.append("")

    lines.append("## Top Talkers (by Connections)\n")
    if summary.top_talkers_by_connections:
        lines.append("| Rank | IP | Connections |")
        lines.append("|---|---|---|")
        for i, (ip, count) in enumerate(summary.top_talkers_by_connections[:20], 1):
            host = summary.hosts.get(ip)
            gw = " (GW)" if host and host.is_gateway else ""
            lines.append(f"| {i} | {ip}{gw} | {count} |")
        lines.append("")

    # Connection Pairs
    lines.append("## Connection Pairs\n")
    if summary.connections:
        lines.append("| Source | Destination | Port | Protocol | Bytes | Packets |")
        lines.append("|---|---|---|---|---|---|")
        sorted_conns = sorted(summary.connections, key=lambda c: -c.byte_count)
        for conn in sorted_conns[:50]:
            lines.append(
                f"| {conn.src_ip} | {conn.dst_ip} | {conn.dst_port} | "
                f"{conn.protocol_label} | {_format_bytes(conn.byte_count)} | "
                f"{conn.packet_count} |"
            )
        if len(summary.connections) > 50:
            lines.append(f"\n*Showing top 50 of {len(summary.connections)} connections.*\n")
        lines.append("")
    else:
        lines.append("No connections recorded.\n")

    lines.append("---\n")
    lines.append("*Generated by TrafficLens*\n")

    report = "\n".join(lines)

    with open(output_path, "w") as f:
        f.write(report)

    logger.info("Markdown report written to %s", output_path)
