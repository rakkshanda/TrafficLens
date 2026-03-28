# Qoder Prompt: Local Network Traffic Analyzer

## Phase 1: PRD & Spec Generation (Quest Mode)

```
Build a local network traffic analysis tool in Python. Before writing any
code, follow this phased development pipeline. Each phase produces a
deliverable that the next phase consumes. Do not skip phases.

--- PHASE 1: PRD DRAFTING ---

Produce a Product Requirements Document that defines:

Core User Experiences (CUEs):
  1. Discover all hosts on the local Wi-Fi subnet (IP, MAC, hostname,
     manufacturer via OUI lookup)
  2. Passively capture and classify network traffic by protocol
     (HTTP, HTTPS, DNS, SSH, SMB, mDNS, etc.)
  3. View a live terminal dashboard showing traffic in real time
  4. Generate a post-capture report (Markdown and/or HTML) containing:
     - Host inventory table (IP, MAC, hostname, manufacturer, first/last seen)
     - Per-host traffic breakdown by protocol and volume
     - Top talkers ranking by bytes and connection count
     - Connection graph showing host-to-host communication pairs
  5. Persist scan results to a backend for historical comparison

For each CUE, define:
  - Measurable success criteria
  - Failure modes and edge cases (no Wi-Fi interface found, permission
    denied on raw sockets, empty subnet, interface goes down mid-capture)
  - Required vs. nice-to-have scope

--- PHASE 2: TECH STACK DECISION ---

Evaluate and document tech stack selection with rationale:
  - Packet capture: scapy vs pyshark vs raw sockets
  - ARP/host discovery: scapy ARP scan vs nmap subprocess
  - OUI lookup: manuf library vs local OUI database
  - CLI framework: click vs argparse vs typer
  - Reporting: Rich (terminal), Jinja2 (HTML), or both
  - Async strategy: asyncio vs threading for non-blocking capture

Write decisions into a TECH_STACK.md at the project root. Each decision
should include: option considered, option selected, and why.

--- PHASE 3: EXPERIMENT & IMPLEMENTATION ---

Build the tool with this modular architecture:
  - capture/       → packet sniffing and raw data collection
  - discovery/     → ARP scanning, hostname resolution, OUI lookup
  - analysis/      → traffic aggregation, protocol classification,
                     top-talker computation
  - reporting/     → terminal dashboard (Rich), static report generation
  - cli.py         → CLI entry point with options for interface selection,
                     capture duration, output format, report destination
  - requirements.txt and README.md with setup instructions

Use async where appropriate for non-blocking capture. Keep modules
loosely coupled with clear interfaces between them.

--- PHASE 4: TESTING (SEE DEDICATED SECTION BELOW) ---

--- PHASE 5: VALIDATION ---

After tests pass, perform a validation sweep:
  - Run the tool against a real Wi-Fi interface for 60 seconds
  - Confirm the report renders correctly and contains all CUE deliverables
  - Verify the CLI --help output documents all options
  - Confirm graceful shutdown on SIGINT (Ctrl+C)

--- AGENT MEMORY ---

Create a .AgentLessonsLearned directory at the project root. After each
phase, write a brief lessons-learned file documenting:
  - What worked well
  - What required iteration or backtracking
  - Decisions that had downstream consequences
  - Anything a future agent should know before modifying this project

Use the naming convention: LL_<phase_number>_<short_description>.md
```

---

## Phase 4: Testing Prompt (Quest Mode)

```
Generate comprehensive tests for the network traffic analyzer. Follow the
Test Generation Context Directive below.

You have read and write access to the entire project codebase.

--- TEST GENERATION CONTEXT DIRECTIVE ---

For each component under test:

1. DEFINE SCOPE
   - List the specific user journeys being tested
   - Document dependencies and integration points
   - Specify the required system state (fresh install, running capture, etc.)

2. GENERATE TEST CASES
   For each test case, provide:
   - Preconditions and setup requirements
   - Expected behavior and success criteria
   - Failure scenarios to validate
   - Required observability checks (logs, metrics)

3. VALIDATION REQUIREMENTS
   Each test must include:
   - Explicit contract validation (ports, expected data formats,
     return types, status codes)
   - Error condition handling
   - Logging and metric verification
   - State cleanup after test completion

4. OUTPUT FORMAT
   For each test, tag it with:
   - testType: unit | integration | system
   - scope: which CUE(s) it validates
   - failureDomain: capture | discovery | analysis | reporting | cli

--- REQUIRED TEST CATEGORIES ---

HEALTH CHECK / SMOKE TESTS:
  - Can the tool detect available network interfaces?
  - Does the CLI parse all expected arguments without error?
  - Can the OUI database be loaded?
  - Does the reporting module render a minimal valid report from
    synthetic data?

UNIT TESTS:
  - Protocol classifier correctly identifies HTTP, DNS, SSH, etc.
    from sample packet data
  - OUI lookup returns expected manufacturer for known MAC prefixes
  - Traffic aggregation math is correct (bytes summed, counts accurate)
  - Top-talker ranking sorts correctly by volume and by count
  - Report templates render without errors given valid input

INTEGRATION TESTS:
  - Capture module feeds data into analysis module and produces
    expected aggregated output
  - Discovery module resolves hostnames and enriches host records
    that the reporting module can consume
  - CLI invocation with --duration 5 produces a valid report file
    at the specified --output path
  - End-to-end: synthetic pcap replay → analysis → report generation

NEGATIVE / EDGE CASE TESTS:
  - Behavior when no packets are captured (empty subnet, wrong interface)
  - Malformed packet handling (truncated, corrupted headers)
  - Permission denied on raw socket (non-root execution)
  - Interface disappears mid-capture
  - Extremely long-running capture (memory leak check)

FAILURE ISOLATION:
  - If the OUI database is missing, does discovery still return
    IP and MAC without crashing?
  - If hostname resolution times out, does the pipeline continue?
  - If the report output directory doesn't exist, is the error
    message actionable?

--- OBSERVABILITY ---

Ensure the tool includes:
  - Structured logging (not just print statements) with log levels
  - A --verbose flag that increases log detail
  - Capture statistics logged at shutdown: packets seen, hosts found,
    duration, errors encountered

--- DELTA SNAPSHOT ---

After all tests are written, generate a single snapshot file
(test_baseline.json) that captures:
  - List of all test files and their test counts
  - Python and dependency versions
  - Date generated
  - Pass/fail summary from a test run

This snapshot serves as a baseline so future changes can be diffed
against it to understand what changed.

Document testing decisions in .AgentLessonsLearned/LL_04_testing.md
```

---

## Follow-Up: InsForge Backend Integration

```
Now integrate InsForge as the backend for persisting scan results.

Before implementing, update the PRD to add CUE #5 (historical scan
persistence) and write a TECH_STACK addendum documenting the decision
to use InsForge over alternatives (Supabase, Firebase, raw Postgres).

Implementation:
  - POST completed scan sessions to an InsForge database table (scan_id,
    timestamp, duration, host_count, full results as JSON)
  - Store per-host records in a related table (host_ip, mac, hostname,
    manufacturer, bytes_in, bytes_out, protocols, scan_id FK)
  - Add a --upload flag to the CLI that pushes results after capture
  - Build a simple web dashboard (React or HTML) that queries InsForge
    to display historical scans with drill-down into any session
  - Use InsForge auth so the dashboard requires login

Testing for this integration (follow the same Test Generation Directive):
  - SMOKE: Can the tool reach the InsForge endpoint?
  - INTEGRATION: Does a completed scan upload and become queryable
    via the dashboard?
  - NEGATIVE: What happens if InsForge is unreachable during upload?
    (graceful failure, local report still saved)
  - CONTRACT: Validate the JSON schema of the upload payload matches
    the InsForge table schema exactly

Update .AgentLessonsLearned with integration findings.
```

---

## Exploration: Test Repo Wiki & Context Engine

```
Use Repo Wiki to generate full documentation for this project. Then
validate Qoder's codebase understanding by asking in Ask Mode:

  - "What is the data flow from packet capture to final report?"
  - "Which module would I modify to add a new protocol detector?"
  - "What are the external dependencies and what does each one do?"
  - "If the OUI database fails to load, what is the fallback behavior?"
  - "Trace the test coverage: which CUEs have integration tests and
     which only have unit tests?"

These questions evaluate whether Qoder's context engine has internalized
the architecture, the testing strategy, and the failure handling — not
just the code syntax.
```
