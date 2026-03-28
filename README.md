# TrafficLens

## Pain: 
Most people have no idea what’s actually happening on their Wi-Fi. Devices connect, send traffic, make requests—but you’re flying blind. 

When you're on community wifi, you don’t know which systems are probing yours, what peer-to-peer traffic is happening, or how aggressive devices are being with connection attempts.

## Agitate: 
That blindness creates real problems. All of us have been on the Thinkspace wifi.  

In the time we've been here, We discovered lots discovery traffic touching our system.

Were you aware of any probles?  

You can’t assess security risks because you don’t see who’s trying to probe your system. You can’t answer basic questions like, “What devices tried to reach my machine today?” 

## Solve: 

TrafficLens is a network traffic analysis tool runs wifi network threat detection heuristics that tell you who tried touching your system. 

This tool gives you complete visibility into your local network. It tells you who is connecting to your system in real time.  You go from confused to confident about what’s actually on your network.


Here's how we start the scanner that monitors your laptop for connection requests:

```
sudo -E python3 -m trafficlens -i wlp0s20f3 -d 30 -o ./demo_scan
```

and here we take a look at the summary:

```
head -40 demo_scan/trafficlens_report.md
```

Here we upload our data to supabase:
```
sudo -E python3 -m trafficlens -i wlp0s20f3 -d 30 --upload
```
Say: "This pushes the scan metadata, all discovered hosts, connection pairs, and protocol breakdowns up to Supabase in one shot."

Click the scan row.

Say: "When I select a scan, three things happen. First, it loads all the host and connection data from Supabase. Then it runs six client-side threat detection heuristics -- looking for port scans, SSH brute force attempts, RDP scanning, SMB lateral movement, high-volume anomalies, and DNS tunneling patterns."

Point to the panels:
Threat Inventory table: "This table shows every host classified by threat level. You can sort by any column -- let's sort by threat level to see what it flagged."
Intrusion Attempt Feed: "Over here is the event feed showing individual connections color-coded by severity."
Top Attackers chart: "And down here, the Top Attackers chart shows which hosts triggered the most threat indicators, with a bar chart and breakdown by attack type."


## for nerds:

Local network traffic analyzer. Discovers hosts via ARP, captures packets, classifies protocols, renders a live terminal dashboard, and generates post-capture reports.

## Requirements

- Python 3.10+
- Linux (requires raw socket access for capture)
- Root or `CAP_NET_RAW` capability for packet capture and ARP scanning

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# List available interfaces
python3 -m trafficlens interfaces

# Runningboard:  the dash
Terminal 1: Make sure the dashboard is running,
```  
cd ~/Development/TrafficLens/Dash
source ~/.nvm/nvm.sh && nvm use 22
npm run dev
```


Terminal 2: Set env vars for the Python CLI,
```
export TRAFFICLENS_BACKEND_URL=https://undwelfmiretpntyzewb.supabase.co/
export TRAFFICLENS_SUPABASE_KEY=yourkeyyourkey
```

Have the dashboard open in a browser tab (http://localhost:5173/) but don't show it yet

# Run a 60-second capture on auto-detected interface
sudo python3 -m trafficlens

# Run on a specific interface for 30 seconds
sudo -E python3 -m trafficlens -i wlp0s20f3 -d 30

# Run indefinitely until Ctrl+C
sudo python3 -m trafficlens -d 0
```

## Usage

```
python -m trafficlens [OPTIONS] COMMAND [ARGS]...

Options:
  -i, --interface TEXT           Network interface to capture on
  -d, --duration INTEGER         Capture duration in seconds (0 = until Ctrl+C) [default: 60]
  -o, --output TEXT              Output path for reports (no extension) [default: ./trafficlens_report]
  -f, --format [md|html|both]   Report format: md, html, or both [default: both]
  --no-dashboard                 Skip live terminal dashboard
  --no-arp                       Skip initial ARP discovery scan
  --upload                       Upload results to InsForge backend
  --backend-url TEXT             InsForge endpoint URL [env: TRAFFICLENS_BACKEND_URL]
  -v, --verbose                  Enable debug-level logging
  -q, --quiet                    Suppress all output except errors
  --version                      Show version and exit

Commands:
  interfaces   List available network interfaces
```

## Features

### Host Discovery
ARP scan of the local subnet to enumerate active hosts. Each host is enriched with:
- DNS reverse lookup (hostname)
- OUI manufacturer lookup (via `manuf` library)
- Gateway detection (default route match)

### Packet Capture
Passive packet capture using scapy's AsyncSniffer. Supports:
- TCP, UDP, ICMP, ARP protocol extraction
- Source/destination IP, MAC, and port parsing
- Queue-based delivery to analysis pipeline (10,000 packet buffer)
- Graceful Ctrl+C shutdown via SIGINT handler

### Protocol Classification
Port-based protocol labeling (HTTP, HTTPS, DNS, SSH, SMB, mDNS, NTP, DHCP, MQTT, and more). Falls back to `TCP/{port}` or `UDP/{port}` for unrecognized ports.

### Live Dashboard
Rich terminal dashboard refreshing at 4 Hz with:
- Host inventory table (IP, MAC, hostname, manufacturer)
- Protocol distribution breakdown
- Top talkers by bytes transferred
- Live packet/byte counters

Disable with `--no-dashboard` for headless operation.

### Report Generation
Post-capture reports in Markdown and/or HTML:
- Host inventory with traffic stats per host
- Protocol distribution table
- Top talkers (by bytes and by connections)
- Connection pair summary

```bash
# Markdown only
sudo python3 -m trafficlens -f md -o ./my_report

# HTML only
sudo python3 -m trafficlens -f html

# Both (default)
sudo python3 -m trafficlens -o ./scan_results
```

### InsForge Backend Upload
Upload scan results to a Supabase-backed InsForge project:

```bash
export TRAFFICLENS_SUPABASE_KEY="your-anon-key"
sudo python3 -m trafficlens --upload --backend-url https://your-project.supabase.co
```

Database schema: `scans`, `hosts`, `connections`, `protocol_summary` tables with RLS enabled.

## Project Structure

```
trafficlens/
  __init__.py          # Package init, version
  __main__.py          # Entry point for python -m trafficlens
  cli.py               # Typer CLI, option parsing, orchestration
  config.py            # Constants, port mappings, logging setup
  capture/
    models.py          # RawPacket dataclass
    permissions.py     # Root/capability checks
    sniffer.py         # AsyncSniffer wrapper, packet extraction
  discovery/
    models.py          # HostRecord dataclass
    arp_scanner.py     # ARP scan via scapy srp()
    resolver.py        # Concurrent DNS reverse lookups
    oui.py             # OUI manufacturer lookup via manuf
  analysis/
    models.py          # TrafficSummary, ConnectionRecord, etc.
    classifier.py      # Port-to-protocol classification
    aggregator.py      # Thread-safe traffic aggregation
    top_talkers.py     # Sorting/ranking utilities
  reporting/
    dashboard.py       # Rich Live terminal dashboard
    markdown.py        # Markdown report generation
    html.py            # HTML report generation (Jinja2)
    templates/
      report.html.j2   # HTML report template
  backend/
    uploader.py        # Supabase REST API upload
tests/
  conftest.py          # Markers, fixtures, auto-skip for root tests
  fixtures/            # Packet, host, and session factories
  smoke/               # Import, CLI parsing, OUI loading tests
  unit/                # Classifier, aggregator, top talkers, templates
  integration/         # Capture-to-analysis, discovery, CLI E2E, pcap replay
  negative/            # Empty capture, malformed packets, permission denied
  failure_isolation/   # Missing OUI, DNS timeout, missing output dir
Dash/                  # React dashboard prototype (separate, not yet integrated)
```

## Testing

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run all tests
python3 -m pytest tests/ -v

# Run by category
python3 -m pytest tests/ -m smoke
python3 -m pytest tests/ -m unit
python3 -m pytest tests/ -m integration
python3 -m pytest tests/ -m negative
python3 -m pytest tests/ -m failure_isolation

# With coverage
python3 -m pytest tests/ --cov=trafficlens --cov-report=term-missing
```

## Without Root

If you prefer not to run as root, grant the `CAP_NET_RAW` capability to your Python interpreter:

```bash
sudo setcap cap_net_raw+ep $(which python3)
python3 -m trafficlens
```

Note: this grants raw socket access to all Python scripts run by that interpreter.

## License

See LICENSE file.
