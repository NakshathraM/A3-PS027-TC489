import os
from pydantic import BaseModel

class Settings(BaseModel):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "NETSCOPE — IPv6 Website & Dependency Readiness Auditor"
    PROJECT_VERSION: str = "1.0.0"
    SCORING_MODEL_VERSION: str = "1.0.0"
    DATABASE_PATH: str = os.getenv("NETSCOPE_DB_PATH", "netscope.db")
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
    ]
    DEFAULT_TIMEOUT: float = float(os.getenv("NETSCOPE_TIMEOUT", "8.0"))
    MAX_DEPENDENCIES_DEFAULT: int = int(os.getenv("NETSCOPE_MAX_DEPS", "50"))
    MAX_REDIRECTS: int = 5
    MAX_RESPONSE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_PORTS: set[int] = {80, 443, 8080, 8443}
    IPV6_PROBE_TARGET: str = os.getenv("NETSCOPE_IPV6_PROBE", "2001:4860:4860::8888")  # Google IPv6 DNS
    IPV6_PROBE_PORT: int = 53
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY", None)

settings = Settings()
