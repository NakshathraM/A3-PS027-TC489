import re
from urllib.parse import urlparse
from pydantic import BaseModel, Field

class NormalizedURL(BaseModel):
    raw_url: str
    scheme: str
    hostname: str
    port: int
    path: str
    normalized_url: str

class URLValidationError(ValueError):
    pass

ALLOWED_SCHEMES = {"http", "https"}
ALLOWED_PORTS = {80, 443, 8080, 8443}

HOSTNAME_REGEX = re.compile(
    r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
)

def validate_and_normalize_url(url_input: str) -> NormalizedURL:
    """
    Validates that a URL is safe to audit:
    - HTTP or HTTPS only
    - No embedded credentials (username:password)
    - Hostname must be valid
    - Port must be in allowed list (default 80 or 443)
    - Returns standardized normalized URL structure
    """
    if not url_input or not isinstance(url_input, str):
        raise URLValidationError("Target URL cannot be empty.")

    clean_url = url_input.strip()

    # Reject pseudo schemes without authority
    if ":" in clean_url and not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", clean_url):
        first_part = clean_url.split(":", 1)[0].lower()
        if first_part in ("javascript", "data", "file", "mailto", "vbscript", "about", "blob"):
            raise URLValidationError(f"Prohibited URL scheme '{first_part}'.")

    # Prepend https:// if user omitted scheme for convenience
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", clean_url):
        clean_url = f"https://{clean_url}"

    try:
        parsed = urlparse(clean_url)
    except Exception as e:
        raise URLValidationError(f"Malformed URL structure: {e}")

    scheme = parsed.scheme.lower()
    if scheme not in ALLOWED_SCHEMES:
        raise URLValidationError(
            f"Unsupported URL scheme '{scheme}'. Only HTTP and HTTPS are permitted."
        )

    # Reject embedded userinfo (e.g. http://admin:pass@example.com)
    if parsed.username or parsed.password:
        raise URLValidationError("Embedded credentials in target URL are prohibited.")

    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        raise URLValidationError("No hostname found in target URL.")

    # Remove trailing dot if present
    if hostname.endswith("."):
        hostname = hostname[:-1]

    # Validate hostname syntax or IPv4/IPv6 literal
    # Check if contains spaces or control chars
    if any(c in hostname for c in [" ", "\t", "\r", "\n", "\\", "/", ":", "@"]):
        raise URLValidationError(f"Invalid characters in hostname '{hostname}'.")

    # Determine port
    try:
        port = parsed.port if parsed.port else (443 if scheme == "https" else 80)
    except ValueError as e:
        raise URLValidationError(f"Malformed port number in URL: {e}")

    if port not in ALLOWED_PORTS:
        raise URLValidationError(
            f"Port {port} is not in the allowed scanning ports ({sorted(list(ALLOWED_PORTS))})."
        )

    path = parsed.path if parsed.path else "/"
    normalized_url = f"{scheme}://{hostname}{f':{port}' if (scheme == 'http' and port != 80) or (scheme == 'https' and port != 443) else ''}{path}"

    return NormalizedURL(
        raw_url=url_input,
        scheme=scheme,
        hostname=hostname,
        port=port,
        path=path,
        normalized_url=normalized_url,
    )
