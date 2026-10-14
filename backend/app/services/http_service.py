import ssl
import socket
import time
from typing import Optional, Dict, Any, Tuple
from urllib.parse import urlparse
import httpx
from app.config import settings
from app.security.network_policy import classify_and_verify_ip, SSRFViolationError
from app.security.url_validation import validate_and_normalize_url

class TLSCheckResult:
    def __init__(
        self,
        hostname: str,
        tls_version: Optional[str],
        cert_valid: bool,
        cert_error: Optional[str],
        http_status: Optional[int],
        duration_ms: float
    ):
        self.hostname = hostname
        self.tls_version = tls_version
        self.cert_valid = cert_valid
        self.cert_error = cert_error
        self.http_status = http_status
        self.duration_ms = duration_ms

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hostname": self.hostname,
            "tls_version": self.tls_version,
            "cert_valid": self.cert_valid,
            "cert_error": self.cert_error,
            "http_status": self.http_status,
            "duration_ms": round(self.duration_ms, 2)
        }

def test_tls_and_https_ipv6(
    hostname: str,
    aaaa_ip: str,
    port: int = 443,
    timeout: float = 5.0
) -> TLSCheckResult:
    """
    Performs TLS handshake over IPv6 with strict certificate validation.
    Does not disable SSL verification!
    """
    start_time = time.perf_counter()
    tls_version = None
    cert_valid = False
    cert_error = None
    http_status = None

    context = ssl.create_default_context()
    context.check_hostname = True

    try:
        raw_sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
        raw_sock.settimeout(timeout)
        raw_sock.connect((aaaa_ip, port))

        with context.wrap_socket(raw_sock, server_hostname=hostname) as ssock:
            tls_version = ssock.version()
            cert_valid = True
            
            # Send simple HEAD or GET request to verify HTTP response
            request_data = f"HEAD / HTTP/1.1\r\nHost: {hostname}\r\nUser-Agent: NetScope-Auditor/1.0\r\nConnection: close\r\n\r\n".encode("utf-8")
            ssock.sendall(request_data)
            
            response = ssock.recv(1024).decode("utf-8", errors="ignore")
            if response.startswith("HTTP/"):
                parts = response.split(" ", 2)
                if len(parts) >= 2 and parts[1].isdigit():
                    http_status = int(parts[1])

    except ssl.SSLCertVerificationError as e:
        cert_error = f"Certificate Verification Failed: {e.verify_message}"
    except ssl.SSLError as e:
        cert_error = f"TLS Handshake Error: {e.reason if hasattr(e, 'reason') else e}"
    except socket.timeout:
        cert_error = f"TLS handshake timed out after {timeout}s"
    except Exception as e:
        cert_error = f"Connection/TLS error: {type(e).__name__} - {e}"

    duration_ms = (time.perf_counter() - start_time) * 1000

    return TLSCheckResult(
        hostname=hostname,
        tls_version=tls_version,
        cert_valid=cert_valid,
        cert_error=cert_error,
        http_status=http_status,
        duration_ms=duration_ms
    )

def fetch_target_html_safely(
    url: str,
    timeout: float = 8.0,
    max_size: int = settings.MAX_RESPONSE_SIZE_BYTES
) -> Tuple[str, str, int, Dict[str, str]]:
    """
    Fetches target page HTML with strict security controls:
    - SSRF prevention on every redirect hop
    - Maximum body size limit (5MB)
    - Returns (html_content, final_url, status_code, headers)
    """
    norm = validate_and_normalize_url(url)
    
    # Custom headers
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NetScope/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    current_url = norm.normalized_url
    redirects_followed = 0

    with httpx.Client(
        headers=headers,
        timeout=timeout,
        follow_redirects=False,
        verify=True,
    ) as client:
        while True:
            # Revalidate target URL on each step
            step_norm = validate_and_normalize_url(current_url)

            # Stream request to enforce max size
            with client.stream("GET", current_url) as response:
                if response.is_redirect:
                    redirects_followed += 1
                    if redirects_followed > settings.MAX_REDIRECTS:
                        raise ValueError(f"Exceeded maximum redirects ({settings.MAX_REDIRECTS}).")
                    
                    loc = response.headers.get("location")
                    if not loc:
                        raise ValueError("Redirect response missing Location header.")
                    
                    from urllib.parse import urljoin
                    current_url = urljoin(current_url, loc)
                    continue

                # Read body up to max_size
                chunks = []
                bytes_read = 0
                for chunk in response.iter_bytes():
                    bytes_read += len(chunk)
                    if bytes_read > max_size:
                        raise ValueError(f"Target response exceeded max allowed size ({max_size} bytes).")
                    chunks.append(chunk)

                raw_bytes = b"".join(chunks)
                encoding = response.encoding or "utf-8"
                try:
                    html_content = raw_bytes.decode(encoding, errors="replace")
                except Exception:
                    html_content = raw_bytes.decode("utf-8", errors="replace")

                return html_content, str(response.url), response.status_code, dict(response.headers)
