"""HTML report generation using Jinja2."""

import logging
import os
from datetime import datetime
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from trafficlens.analysis.models import TrafficSummary

logger = logging.getLogger("trafficlens.reporting.html")

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")


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
    return datetime.fromtimestamp(ts).strftime("%H:%M:%S")


def _top_protocol(ht) -> str:
    if ht.protocols:
        return max(ht.protocols.items(), key=lambda x: x[1])[0]
    return "-"


def generate_html_report(summary: TrafficSummary, output_path: str) -> None:
    """Generate an HTML report from a TrafficSummary."""
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR), autoescape=False)
    template = env.get_template("report.html.j2")

    meta = summary.scan_metadata
    start_date = datetime.fromtimestamp(meta.start_time).strftime("%Y-%m-%d %H:%M:%S") if meta.start_time else "N/A"

    sorted_protocols = sorted(
        summary.protocol_distribution.items(), key=lambda x: -x[1]
    )
    total_proto_bytes = sum(summary.protocol_distribution.values()) or 1

    sorted_connections = sorted(
        summary.connections, key=lambda c: -c.byte_count
    )

    html = template.render(
        meta=meta,
        start_date=start_date,
        total_bytes_fmt=_format_bytes(meta.total_bytes),
        hosts=summary.hosts,
        per_host_traffic=summary.per_host_traffic,
        protocol_distribution=summary.protocol_distribution,
        sorted_protocols=sorted_protocols,
        total_proto_bytes=total_proto_bytes,
        top_talkers_by_bytes=summary.top_talkers_by_bytes,
        top_talkers_by_connections=summary.top_talkers_by_connections,
        connections=summary.connections,
        sorted_connections=sorted_connections,
        fmt_bytes=_format_bytes,
        fmt_ts=_format_timestamp,
        top_proto=_top_protocol,
    )

    with open(output_path, "w") as f:
        f.write(html)

    logger.info("HTML report written to %s", output_path)
