# TrafficLens - Product Requirements Document

## Overview

TrafficLens is a local network traffic analysis tool that discovers hosts on a Wi-Fi subnet, passively captures and classifies network traffic, provides real-time visibility via a terminal dashboard, and generates post-capture reports.

---

## Core User Experiences (CUEs)

### CUE-1: Host Discovery

Discover all hosts on the local Wi-Fi subnet with IP, MAC, hostname, and manufacturer (OUI lookup).

**Success Criteria:**
- ARP scan completes within 5 seconds for a /24 subnet
- Discovered hosts include IP address, MAC address, hostname (when resolvable), and manufacturer
- Gateway is correctly identified
- Results are displayed in a formatted table before capture begins

**Failure Modes:**
- No Wi-Fi interface found: exit with list of available interfaces
- Permission denied on raw sockets: exit with sudo/setcap instructions
- Empty subnet (no ARP replies): log warning, continue with passive discovery from captured traffic
- DNS resolution timeout for a host: set hostname to None, continue with remaining hosts

**Required Scope:** ARP scan, reverse DNS, OUI lookup
**Nice-to-Have:** mDNS/Bonjour hostname discovery, OS fingerprinting

---

### CUE-2: Traffic Capture and Classification

Passively capture and classify network traffic by protocol (HTTP, HTTPS, DNS, SSH, SMB, mDNS, etc.).

**Success Criteria:**
- Captures packets on the specified interface for the configured duration
- Correctly classifies traffic into protocol categories by port mapping
- Handles at least: HTTP, HTTPS, DNS, SSH, SMB, mDNS, DHCP, NTP, SSDP, ICMP, ARP
- Unknown protocols are labeled with transport/port (e.g., "TCP/8080")
- Capture runs without dropping packets at typical home network rates (<10K pps)

**Failure Modes:**
- Permission denied: fail fast before capture starts
- Interface disappears mid-capture: stop gracefully, preserve collected data
- Malformed/truncated packets: skip with debug log, increment error counter
- Queue overflow under high traffic: drop oldest packets, log warning

**Required Scope:** Protocol classification by port, byte/packet counting per connection
**Nice-to-Have:** Deep packet inspection, payload analysis, encrypted traffic fingerprinting

---

### CUE-3: Live Terminal Dashboard

View a live terminal dashboard showing traffic in real time during capture.

**Success Criteria:**
- Dashboard refreshes at ~4Hz with current statistics
- Shows: host inventory, protocol distribution, top talkers, live packet stats
- Does not interfere with capture performance
- Responds to Ctrl+C for graceful shutdown

**Failure Modes:**
- Terminal too small: degrade gracefully (fewer columns, truncated data)
- Dashboard rendering slower than capture: queue buffers packets, dashboard catches up

**Required Scope:** Rich Live layout with host table, protocol stats, top talkers, capture counter
**Nice-to-Have:** Interactive host selection, protocol filtering

---

### CUE-4: Post-Capture Report

Generate a report (Markdown and/or HTML) after capture containing host inventory, per-host traffic breakdown, top talkers, and connection graph.

**Success Criteria:**
- Report includes: host inventory table (IP, MAC, hostname, manufacturer, first/last seen)
- Per-host traffic breakdown by protocol and volume
- Top talkers ranking by bytes and by connection count
- Connection pairs table showing host-to-host communication
- HTML report is a self-contained single file with embedded CSS
- Markdown report renders correctly in any Markdown viewer

**Failure Modes:**
- Output directory doesn't exist: fail fast with actionable error before capture
- Zero packets captured: generate report with "No traffic captured" message
- Disk full: catch IOError, log warning

**Required Scope:** Host inventory, protocol breakdown, top talkers, connection pairs
**Nice-to-Have:** Protocol distribution pie chart (HTML), network topology diagram

---

### CUE-5: Scan Persistence

Persist scan results to an InsForge backend for historical comparison.

**Success Criteria:**
- Upload completes within 10 seconds for a typical scan (50 hosts, 500 connections)
- Data stored atomically across related tables (scans, hosts, connections, protocol_summary)
- Upload failure does not prevent local report generation
- Uploaded data is queryable for future dashboard integration

**Failure Modes:**
- Backend unreachable: retry once (5s timeout), log warning, save local report, exit 0
- Authentication failure: log error with instructions to configure credentials
- Malformed payload rejected by backend: log the validation error

**Required Scope:** Upload scan results via REST API with --upload flag
**Nice-to-Have:** Automatic upload (no flag needed), scan comparison endpoint
