"""Upload scan results to InsForge (Supabase) backend."""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

import requests

from trafficlens.analysis.models import TrafficSummary
from trafficlens.config import UPLOAD_TIMEOUT, UPLOAD_RETRIES

logger = logging.getLogger("trafficlens.backend.uploader")

# Default Supabase project URL and anon key (overridable via env vars)
DEFAULT_SUPABASE_URL = "https://undwelfmiretpntyzewb.supabase.co"
DEFAULT_SUPABASE_KEY_ENV = "TRAFFICLENS_SUPABASE_KEY"


def _get_headers(api_key: str) -> dict:
    """Build Supabase REST API headers."""
    return {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _ts_to_iso(ts: float) -> Optional[str]:
    """Convert a Unix timestamp to ISO 8601 string."""
    if ts == 0:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def upload_scan(
    summary: TrafficSummary,
    backend_url: Optional[str] = None,
    api_key: Optional[str] = None,
) -> bool:
    """Upload a TrafficSummary to InsForge/Supabase.

    Inserts records across scans, hosts, connections, and protocol_summary
    tables. Returns True on success, False on failure.
    """
    base_url = backend_url or os.environ.get("TRAFFICLENS_BACKEND_URL", DEFAULT_SUPABASE_URL)
    key = api_key or os.environ.get(DEFAULT_SUPABASE_KEY_ENV)

    if not key:
        logger.error(
            "No Supabase API key configured. Set %s environment variable.",
            DEFAULT_SUPABASE_KEY_ENV,
        )
        return False

    rest_url = f"{base_url}/rest/v1"
    headers = _get_headers(key)
    meta = summary.scan_metadata

    # Step 1: Insert scan record
    scan_payload = {
        "started_at": _ts_to_iso(meta.start_time),
        "ended_at": _ts_to_iso(meta.end_time),
        "duration_seconds": meta.duration_seconds,
        "interface_name": meta.interface,
        "subnet": meta.subnet,
        "host_count": len(summary.hosts),
        "total_bytes_captured": meta.total_bytes,
        "total_packets": meta.total_packets,
    }

    scan_id = _post_with_retry(
        f"{rest_url}/scans",
        headers,
        scan_payload,
        "scan",
    )
    if scan_id is None:
        return False

    logger.info("Scan uploaded with ID: %s", scan_id)

    # Step 2: Insert host records
    host_id_map = {}  # ip -> host UUID
    for ip, host in summary.hosts.items():
        traffic = summary.per_host_traffic.get(ip)
        host_payload = {
            "scan_id": scan_id,
            "ip_address": ip,
            "mac_address": host.mac,
            "hostname": host.hostname,
            "manufacturer": host.manufacturer,
            "first_seen": _ts_to_iso(host.first_seen),
            "last_seen": _ts_to_iso(host.last_seen),
            "bytes_sent": traffic.bytes_sent if traffic else 0,
            "bytes_received": traffic.bytes_received if traffic else 0,
            "is_gateway": host.is_gateway,
        }
        host_uuid = _post_with_retry(
            f"{rest_url}/hosts",
            headers,
            host_payload,
            f"host {ip}",
        )
        if host_uuid:
            host_id_map[ip] = host_uuid

    logger.info("Uploaded %d/%d host records", len(host_id_map), len(summary.hosts))

    # Step 3: Insert connection records (batch)
    if summary.connections:
        conn_payloads = [
            {
                "scan_id": scan_id,
                "source_ip": c.src_ip,
                "destination_ip": c.dst_ip,
                "destination_port": c.dst_port,
                "protocol": c.protocol_label,
                "byte_count": c.byte_count,
                "packet_count": c.packet_count,
            }
            for c in summary.connections
        ]
        # Batch insert (Supabase supports array POST)
        _post_with_retry(
            f"{rest_url}/connections",
            headers,
            conn_payloads,
            "connections",
            expect_id=False,
        )
        logger.info("Uploaded %d connection records", len(conn_payloads))

    # Step 4: Insert protocol summary per host
    proto_payloads = []
    for ip, traffic in summary.per_host_traffic.items():
        host_uuid = host_id_map.get(ip)
        if not host_uuid:
            continue
        for protocol, byte_count in traffic.protocols.items():
            proto_payloads.append({
                "host_id": host_uuid,
                "protocol": protocol,
                "byte_count": byte_count,
                "connection_count": 1,  # simplified
            })

    if proto_payloads:
        _post_with_retry(
            f"{rest_url}/protocol_summary",
            headers,
            proto_payloads,
            "protocol_summary",
            expect_id=False,
        )
        logger.info("Uploaded %d protocol summary records", len(proto_payloads))

    return True


def _post_with_retry(
    url: str,
    headers: dict,
    payload,
    label: str,
    expect_id: bool = True,
) -> Optional[str]:
    """POST to Supabase with retry logic. Returns the ID if expect_id=True."""
    for attempt in range(UPLOAD_RETRIES + 1):
        try:
            resp = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=UPLOAD_TIMEOUT,
            )
            if resp.status_code in (200, 201):
                if expect_id:
                    data = resp.json()
                    if isinstance(data, list) and data:
                        return data[0].get("id")
                    elif isinstance(data, dict):
                        return data.get("id")
                return "ok"
            else:
                logger.warning(
                    "Upload %s failed (attempt %d): %d %s",
                    label, attempt + 1, resp.status_code, resp.text[:200],
                )
        except requests.exceptions.Timeout:
            logger.warning("Upload %s timed out (attempt %d)", label, attempt + 1)
        except requests.exceptions.ConnectionError:
            logger.warning("Upload %s connection failed (attempt %d)", label, attempt + 1)
        except Exception as e:
            logger.warning("Upload %s error (attempt %d): %s", label, attempt + 1, e)

    logger.error("Upload %s failed after %d attempts", label, UPLOAD_RETRIES + 1)
    return None
