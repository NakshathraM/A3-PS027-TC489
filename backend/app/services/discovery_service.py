from urllib.parse import urljoin, urlparse
from typing import List, Dict, Any, Tuple
from bs4 import BeautifulSoup
from app.schemas.resource import ResourceType, DiscoveryMethod

class DiscoveredResource:
    def __init__(
        self,
        url: str,
        hostname: str,
        resource_type: ResourceType,
        discovery_method: DiscoveryMethod,
        relationship_type: str,
        provenance: str,
    ):
        self.url = url
        self.hostname = hostname
        self.resource_type = resource_type
        self.discovery_method = discovery_method
        self.relationship_type = relationship_type
        self.provenance = provenance

def discover_dependencies_from_html(
    html_content: str,
    base_url: str,
    main_hostname: str,
    max_count: int = 50
) -> List[DiscoveredResource]:
    """
    Parses HTML content to extract static dependencies:
    - Scripts, CSS stylesheets, images, iframes, fonts, preloads
    - Resolves relative URLs to absolute URLs
    - Normalizes hostnames
    - Deduplicates by URL
    """
    soup = BeautifulSoup(html_content, "html.parser")
    discovered: List[DiscoveredResource] = []
    seen_urls = set()

    def add_candidate(raw_src: str, res_type: ResourceType, rel_type: str, prov: str):
        if not raw_src or len(discovered) >= max_count:
            return
        raw_src = raw_src.strip()
        if raw_src.startswith("data:") or raw_src.startswith("javascript:") or raw_src.startswith("mailto:"):
            return

        try:
            full_url = urljoin(base_url, raw_src)
            parsed = urlparse(full_url)
            if parsed.scheme.lower() not in ("http", "https"):
                return
            
            host = (parsed.hostname or "").lower().rstrip(".")
            if not host:
                return

            if full_url in seen_urls:
                return

            seen_urls.add(full_url)
            discovered.append(
                DiscoveredResource(
                    url=full_url,
                    hostname=host,
                    resource_type=res_type,
                    discovery_method=DiscoveryMethod.STATIC_HTML,
                    relationship_type=rel_type,
                    provenance=prov,
                )
            )
        except Exception:
            pass

    # 1. Script tags
    for tag in soup.find_all("script", src=True):
        add_candidate(tag["src"], ResourceType.JAVASCRIPT, "loads_script", "dom_script_src")

    # 2. Link tags (stylesheets, preloads)
    for tag in soup.find_all("link", href=True):
        rel = [r.lower() for r in tag.get("rel", [])] if isinstance(tag.get("rel"), list) else [tag.get("rel", "").lower()]
        as_attr = tag.get("as", "").lower()
        if "stylesheet" in rel:
            add_candidate(tag["href"], ResourceType.CSS, "loads_stylesheet", "dom_link_stylesheet")
        elif "preload" in rel or "prefetch" in rel:
            if as_attr == "script":
                add_candidate(tag["href"], ResourceType.JAVASCRIPT, "loads_script", "dom_link_preload_script")
            elif as_attr == "style":
                add_candidate(tag["href"], ResourceType.CSS, "loads_stylesheet", "dom_link_preload_style")
            elif as_attr == "font":
                add_candidate(tag["href"], ResourceType.FONT, "fetches_asset", "dom_link_preload_font")
            elif as_attr == "image":
                add_candidate(tag["href"], ResourceType.IMAGE, "fetches_asset", "dom_link_preload_image")
            else:
                add_candidate(tag["href"], ResourceType.OTHER, "fetches_asset", "dom_link_preload")
        elif "preconnect" in rel or "dns-prefetch" in rel:
            add_candidate(tag["href"], ResourceType.API, "requests_api", "dom_link_preconnect")

    # 3. Image tags
    for tag in soup.find_all("img", src=True):
        add_candidate(tag["src"], ResourceType.IMAGE, "fetches_asset", "dom_img_src")

    # 4. Iframes
    for tag in soup.find_all("iframe", src=True):
        add_candidate(tag["src"], ResourceType.IFRAME, "embeds_iframe", "dom_iframe_src")

    # 5. Audio / Video / Source tags
    for tag in soup.find_all("source", src=True):
        add_candidate(tag["src"], ResourceType.OTHER, "fetches_asset", "dom_source_src")

    return discovered
