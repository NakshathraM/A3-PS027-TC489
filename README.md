# NETSCOPE — IPv6 Website & Dependency Readiness Auditor

> **AIORI Hackathon Project**  
> *"Don't just test the domain. Audit the entire delivery chain."*

---

## 1. Executive Summary & Value Proposition

Most internet infrastructure audits only test the top-level domain name for an `AAAA` DNS record. However, modern web applications pull vital runtime assets from dozens of third-party domains (CDNs, analytics, fonts, API endpoints, payment gateways, and tag managers). If an IPv6-only user accesses a website whose delivery-chain dependencies lack IPv6 routing, the application can fail silently or suffer degradation.

**NETSCOPE** evaluates the IPv6 readiness of a website and its observable delivery chain, translates technical test results into evidence-backed findings, estimates impact with the **Dependency Blast-Radius Engine**, and allows infrastructure teams to test hypothetical fixes via the interactive **What-If Remediation Simulator**.

---

## 2. Architecture & Folder Structure

```
A3-PS027-TC489/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI entry point & lifespan handler
│   │   ├── config.py                   # Environment & runtime configuration
│   │   ├── security/
│   │   │   ├── url_validation.py       # Scheme, credentials, and port validation
│   │   │   └── network_policy.py       # SSRF protection & private/cloud IP blocking
│   │   ├── database/
│   │   │   ├── connection.py           # SQLite WAL connection & schema initialization
│   │   │   └── repositories.py         # Type-safe parameterized database queries
│   │   ├── schemas/
│   │   │   ├── audit.py                # Audit models, statuses, and score breakdowns
│   │   │   ├── resource.py             # Discovered resources & graph schemas
│   │   │   ├── finding.py              # Diagnostic findings & raw evidence schemas
│   │   │   └── simulation.py           # Remediation actions & simulation results
│   │   ├── services/
│   │   │   ├── dns_service.py          # Real DNS resolution (A, AAAA, CNAME)
│   │   │   ├── ipv6_service.py         # Scanner IPv6 route check & target TCP connect
│   │   │   ├── http_service.py         # Safe HTML fetch & IPv6 TLS handshake verification
│   │   │   ├── discovery_service.py    # Static HTML dependency extractor
│   │   │   ├── impact_service.py       # Dependency Blast-Radius mathematical engine
│   │   │   ├── scoring_service.py      # Readiness, Coverage, & Confidence calculations
│   │   │   ├── remediation_service.py  # Prioritization & What-If score recalculator
│   │   │   ├── explanation_service.py  # NETSCOPE INSIGHT evidence-grounded explainer
│   │   │   ├── report_service.py       # Downloadable standalone HTML/PDF-ready report
│   │   │   ├── sample_data_service.py  # Documentation-safe demo dataset
│   │   │   └── audit_service.py        # Asynchronous multi-stage audit orchestrator
│   │   └── api/
│   │       ├── audits.py               # REST API endpoints for audits, graph, & findings
│   │       └── system.py               # Methodology and scanner settings endpoints
│   ├── tests/
│   │   ├── test_core.py                # Unit tests: URL validation, SSRF, scoring, blast-radius
│   │   └── test_api.py                 # Integration tests: REST API routes & simulation
│   ├── pytest.ini                      # Test runner configuration
│   └── requirements.txt                # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts               # Type-safe HTTP client with backend proxy
│   │   ├── types/index.ts              # TypeScript domain types and schemas
│   │   ├── components/
│   │   │   ├── Layout/AppLayout.tsx    # Header, sidebar navigation, scanner capability indicator
│   │   │   └── UI/
│   │   │       ├── StatusPill.tsx      # Accessible status pills with color tokens
│   │   │       └── ScoreCard.tsx       # KPI cards with methodology tooltips
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx         # Hero network visualizer & credibility sections
│   │   │   ├── OverviewPage.tsx        # Observability dashboard & latest audit summary
│   │   │   ├── NewAuditPage.tsx        # Audit configuration form & scan mode selector
│   │   │   ├── AuditDashboardPage.tsx  # Audit overview, Recharts breakdown, KPIs
│   │   │   ├── DependencyExplorerPage.tsx # Interactive React Flow dependency graph + table
│   │   │   ├── FindingsExplorerPage.tsx   # Filterable findings + NETSCOPE INSIGHT drawer
│   │   │   ├── RemediationStudioPage.tsx  # What-If Simulator with live score recalculation
│   │   │   ├── HistoryPage.tsx         # Persistent audit snapshot history table
│   │   │   ├── MethodologyPage.tsx     # Technical documentation & mathematical formulas
│   │   │   └── SettingsPage.tsx        # Scanner route probe & SSRF policy inspector
│   │   ├── App.tsx                     # React Router tree
│   │   ├── main.tsx                    # React DOM root
│   │   └── index.css                   # Tailwind CSS base and design tokens
│   ├── tailwind.config.js              # Curated light palette & design tokens
│   ├── tsconfig.app.json               # TypeScript configuration
│   └── vite.config.ts                  # Vite build config & dev proxy
│
├── .env.example                        # Environment variables documentation
└── README.md                           # Documentation & user guide
```

---

## 3. Core Differentiators & Mathematical Models

### 3.1 Separate Metrics
NETSCOPE strictly separates three independent metrics:
1. **Observed Readiness Score (0–100%)**:
   - DNS Configuration: **15%**
   - Main Hostname IPv6 TCP Reachability: **25%**
   - HTTPS / TLS over IPv6: **20%**
   - Observed Dependency Connectivity: **25%**
   - Protocol & Dual-Stack Symmetry: **15%**
2. **Audit Coverage (%)**:
   $$\text{Coverage} = \frac{\text{Successfully Assessed Relevant Items}}{\text{Discovered Relevant Items}} \times 100$$
3. **Evidence Confidence**:
   Deterministically assigned as **HIGH**, **MODERATE**, **LOW**, or **INCONCLUSIVE** based on probe completion and scanner outbound routing capability.

### 3.2 Dependency Blast-Radius Engine
Ranks the operational impact of delivery-chain failures:
$$\text{Impact Score} = 0.35 \times \text{Criticality} + 0.30 \times \text{Severity} + 0.20 \times \text{Relevance} + 0.15 \times \text{Evidence Strength}$$
- **0–24**: Informational
- **25–49**: Low Potential Impact
- **50–74**: Moderate Potential Impact
- **75–100**: High Potential Impact

### 3.3 What-If Remediation Simulator
Allows engineers to select hypothetical configuration changes (e.g., publishing an `AAAA` record on a CDN or whitelisting IPv6 port 443 ingress) and recalculates the projected score in real time using the exact same deterministic scoring model—without altering live infrastructure.

### 3.4 Security & SSRF Defense
- Enforces HTTP/HTTPS only; blocks embedded credentials.
- Strictly parses and blocks private IPv4 (RFC 1918), loopback (`127.0.0.1`), IPv6 loopback (`::1`), Unique-Local (`fc00::/7`), Link-Local (`fe80::/10`), Cloud Metadata (`169.254.169.254`), and IPv4-mapped IPv6 literals.
- Re-validates destinations on every redirect hop.

---

## 4. Quickstart & Installation Instructions

### Prerequisites
- **Node.js** (v18+) and **npm**
- **Python** (3.12+ recommended) or `uv` package manager

### 4.1 Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (using standard python or uv)
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will be available at: `http://127.0.0.1:8000` (OpenAPI docs at `http://127.0.0.1:8000/docs`).

### 4.2 Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend application will be available at: `http://127.0.0.1:5173`.

---

## 5. Verification & Automated Test Suite

### Running Backend Unit & Integration Tests
```bash
cd backend
.venv\Scripts\python.exe -m pytest -v
```
All 16 tests pass covering:
- Safe URL normalization & rejection of malformed protocols/ports
- SSRF prevention against loopback, private networks, and cloud metadata
- Deterministic Blast-Radius formula calculations
- Weighted Readiness scoring and confidence evaluation
- High-fidelity sample dataset consistency
- Standalone HTML audit report generation
- Full REST API endpoints (Audits, Resources, Dependencies, Findings, Remediation, Simulation, and AI explanation)

### Running Frontend Type Checks & Production Build
```bash
cd frontend
npm run build
```
Generates a minified, production-ready bundle in `frontend/dist/`.

