# TrafficLens - Technology Stack Decisions

Each decision documents: options considered, option selected, and rationale.

---

## Packet Capture

**Options:** scapy, pyshark, raw sockets

**Selected:** scapy

**Rationale:** Pure Python with no external binary dependencies (pyshark requires tshark). Provides `AsyncSniffer` for non-blocking capture that integrates with our threading model. Includes packet parsing, layer access, and ARP frame crafting out of the box. Raw sockets would require reimplementing protocol dissection from scratch. The ~15MB footprint and slightly lower throughput than raw sockets is irrelevant for a local network analysis tool.

---

## ARP / Host Discovery

**Options:** scapy `srp()`, nmap subprocess

**Selected:** scapy `srp()` (primary)

**Rationale:** Since scapy is already a dependency for capture, using `srp()` for ARP scanning avoids adding nmap as a hard dependency. ARP scan via scapy is concise, fast, and returns structured data. If scapy ARP fails (e.g., in virtualized environments), the tool continues with passive host discovery from captured traffic.

---

## OUI Lookup

**Options:** manuf library, local OUI text database

**Selected:** manuf

**Rationale:** The `manuf` library parses the IEEE OUI file and provides a single-call API for MAC-to-manufacturer lookup. It self-updates and handles the parsing complexity. Maintaining a local OUI text file would be a maintenance burden. Fallback: if manuf fails to load, return "Unknown" for manufacturer - never crash on OUI failure.

---

## CLI Framework

**Options:** click, argparse, typer

**Selected:** typer

**Rationale:** Type-annotated CLI definitions reduce boilerplate. Auto-generates `--help` documentation. Wraps click, so click's testing infrastructure (`CliRunner`) is available for tests. Argparse would require significantly more code for the 10+ flags this tool needs. Typer's enum support is useful for the `--format` flag.

---

## Terminal Dashboard

**Options:** Rich, curses, blessed

**Selected:** Rich

**Rationale:** Rich's `Live` context manager + `Table` + `Layout` provide a high-level API for real-time terminal dashboards. It handles terminal resizing, color support detection, and Unicode rendering. Curses would require much more low-level code for equivalent output quality.

---

## Report Generation

**Options:** Rich only, Jinja2 only, both Rich + Jinja2

**Selected:** Both - Jinja2 for HTML, string formatting for Markdown

**Rationale:** Jinja2 provides template-based HTML generation with a single self-contained report file. Markdown is simple enough that string formatting is cleaner than a template engine. Rich is used for terminal output during capture but not for file-based reports.

---

## Async Strategy

**Options:** asyncio, threading, multiprocessing

**Selected:** Threading

**Rationale:** The core concurrency need is two I/O-bound tasks: (1) packet sniffing via scapy's `AsyncSniffer` (uses its own internal thread), and (2) Rich's `Live` dashboard on the main thread. A `queue.Queue` bridges them. Pure asyncio would fight scapy's internal threading. Multiprocessing would require serializing packets across process boundaries - overkill for two I/O threads.

---

## Backend Persistence

**Options:** SQLite (local), InsForge/Supabase, Firebase, raw PostgreSQL

**Selected:** InsForge (Supabase)

**Rationale:** User has an existing InsForge account. Provides REST API for data upload, auth for dashboard access, and structured table storage. SQLite would work for local-only persistence but doesn't enable the web dashboard use case. Firebase and raw PostgreSQL would require more setup for equivalent functionality.

---

## Testing Framework

**Options:** pytest, unittest

**Selected:** pytest

**Rationale:** Fixture system enables rootless testing via mock packet factories. Marker system (`@pytest.mark.requires_root`) enables auto-skipping privileged tests in CI. Parametrize support reduces test boilerplate for protocol classification matrix.
