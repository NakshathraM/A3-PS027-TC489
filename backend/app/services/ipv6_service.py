import socket
import time
from typing import Dict, Any, Optional, Tuple
from app.config import settings
from app.security.network_policy import classify_and_verify_ip, SSRFViolationError

class ScannerCapabilityResult:
    def __init__(self, status: str, detail: str, duration_ms: float):
        self.status = status  # CAPABLE, UNAVAILABLE, INCONCLUSIVE
        self.detail = detail
        self.duration_ms = duration_ms

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "detail": self.detail,
            "duration_ms": round(self.duration_ms, 2)
        }

class IPv6ConnectionResult:
    def __init__(
        self,
        hostname: str,
        destination_ip: Optional[str],
        port: int,
        status: str,  # CONNECTED, TIMEOUT, REFUSED, UNREACHABLE, INCONCLUSIVE, SSRF_BLOCKED, NO_IPV6
        error_category: Optional[str],
        duration_ms: float,
        scanner_capability: str,
    ):
        self.hostname = hostname
        self.destination_ip = destination_ip
        self.port = port
        self.status = status
        self.error_category = error_category
        self.duration_ms = duration_ms
        self.scanner_capability = scanner_capability

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hostname": self.hostname,
            "destination_ip": self.destination_ip,
            "port": self.port,
            "status": self.status,
            "error_category": self.error_category,
            "duration_ms": round(self.duration_ms, 2),
            "scanner_capability": self.scanner_capability,
        }

_cached_scanner_capability: Optional[ScannerCapabilityResult] = None
_last_capability_check_time: float = 0.0

def check_scanner_ipv6_capability(force_refresh: bool = False, timeout: float = 2.5) -> ScannerCapabilityResult:
    """
    Evaluates whether the scanner's network environment has working outbound IPv6 connectivity.
    Probes Google Public IPv6 DNS (2001:4860:4860::8888) or Cloudflare (2606:4700:4700::1111).
    """
    global _cached_scanner_capability, _last_capability_check_time
    now = time.time()
    if not force_refresh and _cached_scanner_capability and (now - _last_capability_check_time < 300):
        return _cached_scanner_capability

    start_time = time.perf_counter()
    probe_targets = [
        (settings.IPV6_PROBE_TARGET, settings.IPV6_PROBE_PORT),
        ("2606:4700:4700::1111", 53),
    ]

    has_ipv6_stack = False
    connected = False
    last_err = ""

    for target_ip, target_port in probe_targets:
        try:
            sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
            has_ipv6_stack = True
            sock.settimeout(timeout)
            sock.connect((target_ip, target_port))
            sock.close()
            connected = True
            break
        except socket.timeout:
            last_err = "Probe timed out"
        except OSError as e:
            last_err = f"Socket error: {e}"
        except Exception as e:
            last_err = f"Unexpected error: {e}"

    duration_ms = (time.perf_counter() - start_time) * 1000

    if connected:
        res = ScannerCapabilityResult(
            status="CAPABLE",
            detail="Public IPv6 route verified via probe endpoint.",
            duration_ms=duration_ms
        )
    elif has_ipv6_stack:
        res = ScannerCapabilityResult(
            status="UNAVAILABLE",
            detail=f"IPv6 stack present but no outbound public route: {last_err}",
            duration_ms=duration_ms
        )
    else:
        res = ScannerCapabilityResult(
            status="UNAVAILABLE",
            detail="IPv6 socket family not supported on host.",
            duration_ms=duration_ms
        )

    _cached_scanner_capability = res
    _last_capability_check_time = now
    return res

def test_ipv6_connectivity(
    hostname: str,
    aaaa_records: list[str],
    port: int = 443,
    timeout: float = 4.0
) -> IPv6ConnectionResult:
    """
    Conducts an explicit IPv6 TCP connection test.
    Never relies on OS automatic address family selection.
    """
    scanner_cap = check_scanner_ipv6_capability()
    
    if not aaaa_records:
        return IPv6ConnectionResult(
            hostname=hostname,
            destination_ip=None,
            port=port,
            status="NO_IPV6",
            error_category="No AAAA DNS records observed",
            duration_ms=0.0,
            scanner_capability=scanner_cap.status
        )

    target_ip = aaaa_records[0]

    # Validate IP against SSRF policy
    try:
        classify_and_verify_ip(target_ip)
    except SSRFViolationError as ssrf_err:
        return IPv6ConnectionResult(
            hostname=hostname,
            destination_ip=target_ip,
            port=port,
            status="SSRF_BLOCKED",
            error_category=str(ssrf_err),
            duration_ms=0.0,
            scanner_capability=scanner_cap.status
        )

    # If scanner itself has no outbound IPv6, do not falsely claim target failed
    if scanner_cap.status != "CAPABLE":
        return IPv6ConnectionResult(
            hostname=hostname,
            destination_ip=target_ip,
            port=port,
            status="INCONCLUSIVE",
            error_category=f"Scanner environment has no usable outbound IPv6 route ({scanner_cap.detail}). Cannot verify target reachability directly.",
            duration_ms=0.0,
            scanner_capability=scanner_cap.status
        )

    start_time = time.perf_counter()
    status = "FAILED"
    error_cat = None

    try:
        sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((target_ip, port))
        sock.close()
        status = "CONNECTED"
    except socket.timeout:
        status = "TIMEOUT"
        error_cat = f"Connection to [{target_ip}]:{port} timed out after {timeout}s"
    except ConnectionRefusedError:
        status = "REFUSED"
        error_cat = f"Connection to [{target_ip}]:{port} actively refused"
    except OSError as e:
        status = "UNREACHABLE"
        error_cat = f"Network or host unreachable: {e}"
    except Exception as e:
        status = "FAILED"
        error_cat = f"Connection error: {type(e).__name__} - {e}"

    duration_ms = (time.perf_counter() - start_time) * 1000

    return IPv6ConnectionResult(
        hostname=hostname,
        destination_ip=target_ip,
        port=port,
        status=status,
        error_category=error_cat,
        duration_ms=duration_ms,
        scanner_capability=scanner_cap.status
    )
