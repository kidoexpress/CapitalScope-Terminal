"""
proxy.py
--------
Yahoo Finance proxy — forwards /api/yahoo/* requests to query1.finance.yahoo.com.
This enables production builds to access Yahoo Finance without the Vite dev proxy.
"""
from __future__ import annotations

import httpx
from fastapi import APIRouter, Request, Response

proxy_router = APIRouter(prefix="/yahoo", tags=["proxy"])

YAHOO_BASE = "https://query1.finance.yahoo.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}


@proxy_router.get("/{path:path}")
async def proxy_yahoo(path: str, request: Request) -> Response:
    """Forward GET requests to Yahoo Finance and return the response."""
    query_string = str(request.url.query)
    url = f"{YAHOO_BASE}/{path}"
    if query_string:
        url = f"{url}?{query_string}"
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=HEADERS)
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                media_type=resp.headers.get("content-type", "application/json"),
            )
    except httpx.TimeoutException:
        return Response(
            content='{"error":"timeout"}',
            status_code=504,
            media_type="application/json",
        )
    except Exception as exc:
        return Response(
            content=f'{{"error":"{exc}"}}',
            status_code=502,
            media_type="application/json",
        )
