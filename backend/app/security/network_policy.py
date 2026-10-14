import ipaddress
from typing import Tuple

class SSRFViolationError(Exception):
    pass

# Known sensitive subnets and addresses
BLOCKED_IPV4_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),          # Current network
    ipaddress.ip_network("10.0.0.0/8"),         # Private RFC 1918
    ipaddress.ip_network("100.64.0.0/10"),      # Shared Address Space (CGNAT)
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback
    ipaddress.ip_network("169.254.0.0/16"),     # Link-Local (includes Cloud metadata 169.254.169.254)
    ipaddress.ip_network("172.16.0.0/12"),      # Private RFC 1918
    ipaddress.ip_network("192.0.0.0/24"),       # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),       # TEST-NET-1 (documentation)
    ipaddress.ip_network("192.88.99.0/24"),     # 6to4 Relay Anycast
    ipaddress.ip_network("192.168.0.0/16"),     # Private RFC 1918
    ipaddress.ip_network("198.18.0.0/15"),      # Benchmarking
    ipaddress.ip_network("198.51.100.0/24"),    # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),     # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved
    ipaddress.ip_network("255.255.255.255/32"), # Broadcast
]

BLOCKED_IPV6_NETWORKS = [
    ipaddress.ip_network("::/128"),             # Unspecified
    ipaddress.ip_network("::1/128"),            # Loopback
    ipaddress.ip_network("fc00::/7"),           # Unique Local Address (ULA)
    ipaddress.ip_network("fe80::/10"),          # Link-Local Unicast
    ipaddress.ip_network("ff00::/8"),           # Multicast
    ipaddress.ip_network("2001:db8::/32"),      # Documentation
    ipaddress.ip_network("2002::/16"),          # 6to4 relay
]

def classify_and_verify_ip(ip_str: str) -> Tuple[bool, str, str]:
    """
    Parses and checks if an IP is safe for public scanning.
    Returns: (is_safe, address_family, reason)
    Raises SSRFViolationError if unsafe.
    """
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        raise SSRFViolationError(f"Invalid IP address literal: '{ip_str}'")

    # Check for IPv4-mapped IPv6 address (e.g., ::ffff:127.0.0.1)
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        v4_equivalent = ip.ipv4_mapped
        return classify_and_verify_ip(str(v4_equivalent))

    if ip.version == 4:
        for net in BLOCKED_IPV4_NETWORKS:
            if ip in net:
                raise SSRFViolationError(
                    f"Outbound connection to IPv4 address {ip_str} blocked by network security policy (SSRF protection: {net})."
                )
        return True, "IPv4", "Public routable IPv4"
    else:
        for net in BLOCKED_IPV6_NETWORKS:
            if ip in net:
                raise SSRFViolationError(
                    f"Outbound connection to IPv6 address {ip_str} blocked by network security policy (SSRF protection: {net})."
                )
        return True, "IPv6", "Public routable IPv6"

def is_ip_safe_for_testing(ip_str: str) -> bool:
    try:
        is_safe, _, _ = classify_and_verify_ip(ip_str)
        return is_safe
    except SSRFViolationError:
        return False
