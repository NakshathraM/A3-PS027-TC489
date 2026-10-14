import html
from typing import Dict, Any, List

def generate_html_report(
    audit: Dict[str, Any],
    resources: List[Dict[str, Any]],
    findings: List[Dict[str, Any]]
) -> str:
    """
    Renders a standalone, professional HTML report suitable for viewing, archiving, or printing to PDF.
    All untrusted content is escaped.
    """
    audit_id = html.escape(str(audit.get("audit_id", "")))
    target_hostname = html.escape(str(audit.get("target_hostname", "")))
    target_url = html.escape(str(audit.get("target_url", "")))
    scan_mode = html.escape(str(audit.get("scan_mode", "")))
    started_at = html.escape(str(audit.get("started_at", "")))
    completed_at = html.escape(str(audit.get("completed_at", "In progress")))
    scanner_cap = html.escape(str(audit.get("scanner_ipv6_status", "UNKNOWN")))
    confidence = html.escape(str(audit.get("confidence_category", "UNKNOWN")))
    readiness_score = audit.get("readiness_score")
    readiness_str = f"{readiness_score:.1f}%" if readiness_score is not None else "Inconclusive"
    coverage_score = audit.get("coverage_score")
    coverage_str = f"{coverage_score:.1f}%" if coverage_score is not None else "N/A"
    is_sample = bool(audit.get("is_sample_data"))

    # Findings rows
    findings_rows = []
    for f in findings:
        title = html.escape(str(f.get("title", "")))
        host = html.escape(str(f.get("affected_hostname", "")))
        sev = html.escape(str(f.get("severity", "INFO")))
        imp_score = f.get("impact_score", 0.0)
        rec = html.escape(str(f.get("recommendation", "")))
        ev = f.get("evidence", {})
        ev_test = html.escape(str(ev.get("test_type", "")))
        ev_res = html.escape(str(ev.get("connection_result", "")))
        ev_ip = html.escape(str(ev.get("destination_ip", "None")))
        ev_dur = f"{ev.get('duration_ms', 0):.1f}ms"

        sev_badge = "background:#FFE4E7;color:#C52E45;" if sev == "CRITICAL" else ("background:#FFF0CC;color:#966000;" if sev == "WARNING" else "background:#DDF8E9;color:#147A4B;")

        findings_rows.append(f"""
        <div style="border:1px solid #E4EAF2;border-radius:8px;padding:16px;margin-bottom:12px;background:#FFFFFF;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <h4 style="margin:0;font-size:15px;color:#172B4D;">{title}</h4>
                <span style="font-size:11px;font-weight:bold;padding:3px 8px;border-radius:12px;{sev_badge}">{sev}</span>
            </div>
            <div style="font-size:12px;color:#68778D;margin-bottom:8px;">
                Affected Host: <code style="background:#F0F4F9;padding:2px 6px;border-radius:4px;color:#172B4D;">{host}</code> | Potential Impact: <b>{imp_score:.1f}/100</b>
            </div>
            <div style="background:#F7F9FC;border:1px solid #E4EAF2;border-radius:6px;padding:10px;font-size:12px;margin-bottom:8px;">
                <strong>Test Evidence:</strong> {ev_test} | Result: <b>{ev_res}</b> | Destination IP: <code>{ev_ip}</code> | Latency: {ev_dur}
            </div>
            <div style="font-size:12px;color:#172B4D;">
                <strong>Remediation:</strong> {rec}
            </div>
        </div>
        """)

    # Resources summary
    res_rows = []
    for r in resources:
        r_host = html.escape(str(r.get("hostname", "")))
        r_type = html.escape(str(r.get("resource_type", "")))
        r_dns = html.escape(str(r.get("dns_status", "")))
        r_ipv6 = html.escape(str(r.get("ipv6_status", "")))
        res_rows.append(f"""
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #E4EAF2;font-family:monospace;font-size:12px;">{r_host}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #E4EAF2;font-size:12px;">{r_type}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #E4EAF2;font-size:12px;">{r_dns}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #E4EAF2;font-size:12px;">{r_ipv6}</td>
        </tr>
        """)

    sample_banner = ""
    if is_sample:
        sample_banner = """
        <div style="background:#FFF0CC;color:#966000;border:1px solid #FFE082;padding:12px;border-radius:8px;margin-bottom:24px;font-weight:600;text-align:center;">
            SAMPLE DATA — NOT A LIVE AUDIT (Documentation & Demonstration Mode)
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NETSCOPE Audit Report — {target_hostname}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #F7F9FC;
            color: #172B4D;
            line-height: 1.5;
            margin: 0;
            padding: 32px 16px;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: #FFFFFF;
            border: 1px solid #E4EAF2;
            border-radius: 12px;
            padding: 36px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #E4EAF2;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }}
        .logo {{
            font-size: 24px;
            font-weight: 800;
            color: #315CF6;
            letter-spacing: -0.5px;
        }}
        .logo span {{
            color: #172B4D;
        }}
        .grid-3 {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }}
        .kpi-card {{
            background: #F7F9FC;
            border: 1px solid #E4EAF2;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
        }}
        .kpi-val {{
            font-size: 28px;
            font-weight: 700;
            color: #315CF6;
        }}
        .kpi-lbl {{
            font-size: 12px;
            color: #68778D;
            text-transform: uppercase;
            font-weight: 600;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }}
        th {{
            text-align: left;
            background: #F0F4F9;
            padding: 8px 12px;
            font-size: 12px;
            color: #68778D;
            border-bottom: 1px solid #E4EAF2;
        }}
        @media print {{
            body {{ background: #FFFFFF; padding: 0; }}
            .container {{ border: none; box-shadow: none; padding: 0; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        {sample_banner}
        <div class="header">
            <div>
                <div class="logo">NET<span>SCOPE</span></div>
                <div style="font-size:13px;color:#68778D;">IPv6 Website & Dependency Readiness Auditor</div>
            </div>
            <div style="text-align:right;font-size:12px;color:#68778D;">
                <div>Audit ID: <code>{audit_id}</code></div>
                <div>Generated: {completed_at}</div>
            </div>
        </div>

        <div style="margin-bottom:24px;">
            <h2 style="margin:0 0 4px 0;font-size:22px;">Audit Overview for {target_hostname}</h2>
            <div style="font-size:13px;color:#68778D;">Target URL: <a href="{target_url}" style="color:#315CF6;">{target_url}</a> | Mode: {scan_mode.upper()} | Scanner IPv6: <b>{scanner_cap}</b></div>
        </div>

        <div class="grid-3">
            <div class="kpi-card">
                <div class="kpi-val">{readiness_str}</div>
                <div class="kpi-lbl">Observed Readiness Score</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-val">{coverage_str}</div>
                <div class="kpi-lbl">Audit Coverage</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-val">{confidence}</div>
                <div class="kpi-lbl">Evidence Confidence</div>
            </div>
        </div>

        <h3 style="font-size:17px;border-bottom:1px solid #E4EAF2;padding-bottom:6px;margin-bottom:16px;">Prioritized Technical Findings ({len(findings)})</h3>
        <div>
            {''.join(findings_rows) if findings_rows else '<p style="color:#68778D;">No critical findings identified.</p>'}
        </div>

        <h3 style="font-size:17px;border-bottom:1px solid #E4EAF2;padding-bottom:6px;margin-top:24px;margin-bottom:16px;">Discovered Dependencies & Hostnames ({len(resources)})</h3>
        <table>
            <thead>
                <tr>
                    <th>Hostname</th>
                    <th>Resource Type</th>
                    <th>DNS Status</th>
                    <th>IPv6 Status</th>
                </tr>
            </thead>
            <tbody>
                {''.join(res_rows)}
            </tbody>
        </table>

        <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E4EAF2;font-size:11px;color:#68778D;line-height:1.6;">
            <strong>Methodology & Limitations:</strong> NETSCOPE performs non-intrusive DNS and IPv6 reachability tests against observable delivery resources. This audit does not guarantee full application functionality across all IPv6 client configurations. Scores reflect the tested snapshot and documented assessment criteria.
        </div>
    </div>
</body>
</html>
"""
