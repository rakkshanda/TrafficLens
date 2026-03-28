# InsForge Prompt: Backend for Network Traffic Analyzer

## Phase 1: PRD & Schema Design

```
I'm using InsForge as my backend platform. Call InsForge MCP's fetch-docs
tool to learn the InsForge instructions.

Before building anything, follow this phased pipeline. Each phase produces
a deliverable that the next phase consumes. Do not skip phases.

--- PHASE 1: PRD FOR THE BACKEND ---

This backend supports a local network traffic analysis CLI tool. The Core
User Experiences (CUEs) that the backend must enable are:

  CUE-1: Ingest — Accept a JSON payload from the CLI containing a
         complete scan session (metadata + hosts + connections) and
         persist it atomically across related tables.
  CUE-2: Browse — Serve a paginated list of past scans with summary
         stats (host count, duration, top talker) for a dashboard.
  CUE-3: Drill-down — Given a scan_id and optional host IP, return
         the full traffic breakdown for that session or host.
  CUE-4: Compare — Given two scan_ids, return which hosts appeared,
         disappeared, or changed traffic patterns between them.
  CUE-5: Auth — Require login for all dashboard and API access.

For each CUE, define:
  - Measurable success criteria
  - Failure modes (malformed payload, duplicate scan_id, missing FK, etc.)
  - Required vs. nice-to-have scope

--- PHASE 2: TECH STACK & SCHEMA DECISION ---

Document the schema design rationale in a TECH_STACK.md:
  - Why these tables and relationships (not a single JSON blob)
  - Indexing strategy for common query patterns
  - Decision to use InsForge edge functions vs. client-side queries
  - Storage bucket justification for report files

Then create the following database tables:

1. scans
   - id (primary key, auto-generated)
   - started_at (timestamp)
   - ended_at (timestamp)
   - duration_seconds (integer)
   - interface_name (text)
   - subnet (text, e.g. "192.168.1.0/24")
   - host_count (integer)
   - total_bytes_captured (bigint)
   - notes (text, optional)

2. hosts
   - id (primary key)
   - scan_id (foreign key → scans.id)
   - ip_address (text)
   - mac_address (text)
   - hostname (text, nullable)
   - manufacturer (text, nullable)
   - first_seen (timestamp)
   - last_seen (timestamp)
   - bytes_sent (bigint)
   - bytes_received (bigint)
   - is_gateway (boolean)

3. connections
   - id (primary key)
   - scan_id (foreign key → scans.id)
   - source_ip (text)
   - destination_ip (text)
   - destination_port (integer)
   - protocol (text)
   - byte_count (bigint)
   - packet_count (integer)

4. protocol_summary
   - id (primary key)
   - host_id (foreign key → hosts.id)
   - protocol (text)
   - byte_count (bigint)
   - connection_count (integer)

Authentication:
  - Enable email/password auth for the dashboard
  - Create a default admin role

Storage:
  - Create a bucket called "scan-reports" for storing generated
    HTML/Markdown report files from each scan session

--- PHASE 3: EDGE FUNCTION IMPLEMENTATION ---

Build these edge functions:

  ingest-scan:
    - Accepts a JSON payload from the CLI tool
    - Validates the schema before writing
    - Inserts records across all tables in a single transaction
    - Returns the created scan_id on success
    - Returns a structured error on validation failure

  scan-summary:
    - Returns a paginated list of past scans
    - Includes host count and top-talker highlight per scan
    - Supports sort by date, duration, or host count

  host-detail:
    - Given a scan_id and host IP, returns the full traffic breakdown
    - Includes protocol summary and connection list for that host

  compare-scans:
    - Given two scan_ids, returns:
      - Hosts that appeared in scan B but not scan A
      - Hosts that disappeared
      - Hosts present in both with traffic delta

--- PHASE 4: TESTING ---

Follow the Test Generation Context Directive for all backend components.

For each component under test:

1. DEFINE SCOPE
   - Which CUE does this test validate?
   - What is the failure domain? (auth | database | edge-function | storage)

2. GENERATE TEST CASES with:
   - Preconditions and setup
   - Expected behavior and success criteria
   - Failure scenarios
   - Observability checks

3. VALIDATION REQUIREMENTS
   - Explicit contract validation (request/response schemas, status
     codes, FK integrity)
   - Error condition handling
   - State cleanup after each test

REQUIRED TEST CATEGORIES:

  HEALTH CHECK / SMOKE TESTS:
    - Are all InsForge tables created and accessible?
    - Does the auth endpoint respond?
    - Can the scan-reports storage bucket accept an upload?
    - Do edge functions respond to a basic ping/health request?

  INTEGRATION TESTS:
    - Submit a valid scan payload via ingest-scan → query it back
      via scan-summary → drill into it via host-detail
    - Upload a report file to scan-reports → retrieve it by URL
    - Authenticate → access a protected endpoint → confirm 401
      without auth

  CONTRACT TESTS:
    - ingest-scan rejects a payload missing required fields and
      returns a structured error (not a 500)
    - scan-summary pagination returns correct page sizes and
      total counts
    - host-detail returns 404 for a nonexistent scan_id (not a crash)
    - compare-scans handles the case where one scan_id doesn't exist

  NEGATIVE / EDGE CASE TESTS:
    - Duplicate scan_id submission (idempotency or rejection?)
    - Extremely large payload (100+ hosts, 10K+ connections)
    - Concurrent ingestion of two scans simultaneously
    - Malformed JSON in the request body
    - Expired or invalid auth token

  FAILURE ISOLATION:
    - If the storage bucket is unreachable, does ingest-scan still
      persist the database records?
    - If one table insert fails mid-transaction, is the entire
      transaction rolled back?
    - If auth is misconfigured, do edge functions fail with a clear
      error rather than silently serving data?

DELTA SNAPSHOT:
  After tests pass, generate a test_baseline.json capturing:
    - All edge function endpoints and their expected response schemas
    - Table row counts after seeded test data
    - Auth configuration state
    - Date generated

--- PHASE 5: VALIDATION ---

  - Submit a realistic scan payload (10+ hosts, 50+ connections)
    and confirm all tables are populated correctly
  - Query scan-summary and confirm the new scan appears
  - Drill into a host and confirm protocol breakdown matches
    the ingested data
  - Compare two scans and confirm the diff is accurate
  - Verify auth blocks unauthenticated access to all endpoints

--- AGENT MEMORY ---

Create a .AgentLessonsLearned directory. After each phase, write a
lessons-learned file documenting:
  - What worked well
  - What required iteration or backtracking
  - InsForge-specific quirks or gotchas discovered
  - Anything a future agent should know before modifying this backend

Use the naming convention: LL_<phase_number>_<short_description>.md
```

---

## Phase 5: Dashboard Build

```
Build a React dashboard that connects to the InsForge backend above.
This is Phase 3 (Experiment & Implementation) for the frontend.

Before coding, document frontend tech stack decisions in TECH_STACK.md:
  - React vs plain HTML
  - Charting library (Recharts, Chart.js, D3)
  - State management approach
  - InsForge JS client usage

Dashboard pages:
  - Login page using InsForge auth
  - Scan history list: date, duration, host count (sortable, paginated)
  - Scan detail view:
    - Host inventory table (sortable by bytes, hostname, etc.)
    - Bar chart of top talkers by traffic volume
    - Protocol distribution pie chart
    - Connections list filtered by host when you click a row
  - Compare Scans view: select two scans, show hosts that appeared,
    disappeared, or changed between them

Testing (same Test Generation Directive):
  - SMOKE: Dashboard loads, login form renders, auth flow completes
  - INTEGRATION: Login → fetch scan list → click scan → see host detail
  - NEGATIVE: Expired token shows login redirect (not blank page),
    empty scan list shows a helpful message (not a crash)
  - CONTRACT: Dashboard queries match the edge function response schemas

Deploy using InsForge site deployment.
Update .AgentLessonsLearned with frontend findings.
```

---

## Stress-Test: Evaluate the Semantic Layer

```
Without reading any documentation, try these commands to see how well
the agent + InsForge semantic layer handles ambiguous requests:

  - "Add a field to track operating system guesses for each host"
  - "Set up a scheduled edge function that runs every hour and
     deletes scans older than 30 days"
  - "Create an API endpoint that returns all hosts seen across
     every scan, deduplicated by MAC address, with total lifetime
     traffic"

After each, check:
  - Did it modify the correct table?
  - Did it update related edge functions to handle the new field?
  - Did it break any existing tests? (Run the test suite to verify)
  - Did it update .AgentLessonsLearned?

These test how well the semantic layer translates intent into correct
database and function operations without hand-holding, and whether
the testing framework catches regressions.
```
