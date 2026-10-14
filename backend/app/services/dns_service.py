import time
from typing import List, Dict, Any, Optional
import dns.resolver
import dns.exception

class DNSCheckResult:
    def __init__(
        self,
        hostname: str,
        a_records: List[str],
        aaaa_records: List[str],
        cname: Optional[str],
        status: str,
        error_category: Optional[str] = None,
        duration_ms: float = 0.0,
    ):
        self.hostname = hostname
        self.a_records = a_records
        self.aaaa_records = aaaa_records
        self.cname = cname
        self.status = status  # AAAA_OBSERVED, NO_AAAA_OBSERVED, RESOLUTION_FAILED, TIMEOUT
        self.error_category = error_category
        self.duration_ms = duration_ms

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hostname": self.hostname,
            "a_records": self.a_records,
            "aaaa_records": self.aaaa_records,
            "cname": self.cname,
            "status": self.status,
            "error_category": self.error_category,
            "duration_ms": round(self.duration_ms, 2),
        }

def resolve_hostname_dns(hostname: str, timeout: float = 4.0) -> DNSCheckResult:
    """
    Performs real DNS lookups for A and AAAA records using dnspython.
    Handles timeouts, NXDOMAIN, NoAnswer gracefully with structured results.
    """
    resolver = dns.resolver.Resolver()
    resolver.timeout = timeout
    resolver.lifetime = timeout

    start_time = time.perf_counter()
    a_records: List[str] = []
    aaaa_records: List[str] = []
    cname: Optional[str] = None
    error_category: Optional[str] = None

    # Query A records (IPv4)
    try:
        a_answers = resolver.resolve(hostname, "A")
        for rdata in a_answers:
            a_records.append(rdata.to_text())
        if a_answers.canonical_name and str(a_answers.canonical_name).rstrip(".") != hostname:
            cname = str(a_answers.canonical_name).rstrip(".")
    except dns.resolver.NXDOMAIN:
        error_category = "NXDOMAIN (Host not found)"
    except dns.resolver.NoAnswer:
        pass  # No A record
    except dns.exception.Timeout:
        error_category = "DNS Query Timeout"
    except Exception as e:
        error_category = f"DNS Resolution Error: {type(e).__name__}"

    # Query AAAA records (IPv6)
    try:
        aaaa_answers = resolver.resolve(hostname, "AAAA")
        for rdata in aaaa_answers:
            aaaa_records.append(rdata.to_text())
        if not cname and aaaa_answers.canonical_name and str(aaaa_answers.canonical_name).rstrip(".") != hostname:
            cname = str(aaaa_answers.canonical_name).rstrip(".")
    except dns.resolver.NXDOMAIN:
        if not error_category:
            error_category = "NXDOMAIN (Host not found)"
    except dns.resolver.NoAnswer:
        pass  # Normal if domain has no IPv6 configured
    except dns.exception.Timeout:
        if not error_category:
            error_category = "DNS AAAA Query Timeout"
    except Exception as e:
        if not error_category:
            error_category = f"DNS AAAA Query Error: {type(e).__name__}"

    duration_ms = (time.perf_counter() - start_time) * 1000

    if error_category and not a_records and not aaaa_records:
        if "Timeout" in error_category:
            status = "TIMEOUT"
        else:
            status = "RESOLUTION_FAILED"
    elif aaaa_records:
        status = "AAAA_OBSERVED"
    else:
        status = "NO_AAAA_OBSERVED"

    return DNSCheckResult(
        hostname=hostname,
        a_records=a_records,
        aaaa_records=aaaa_records,
        cname=cname,
        status=status,
        error_category=error_category,
        duration_ms=duration_ms,
    )
