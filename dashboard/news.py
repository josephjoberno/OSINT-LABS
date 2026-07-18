"""Safe aggregation of a small, allowlisted set of official OSINT feeds."""

import json
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

SOURCES = {
    "bellingcat_github": "https://api.github.com/orgs/bellingcat/repos?sort=pushed&direction=desc&per_page=12",
    "bellingcat_rss": "https://www.bellingcat.com/feed/",
    "arxiv": "https://export.arxiv.org/api/query?search_query=all%3AOSINT&start=0&max_results=12&sortBy=submittedDate&sortOrder=descending",
}
MAX_RESPONSE_BYTES = 2_000_000


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _request(source_id):
    url = SOURCES[source_id]
    req = urllib.request.Request(url, headers={"User-Agent": "OSINT-Labs-News/1.0", "Accept": "application/json, application/atom+xml, application/rss+xml"})
    opener = urllib.request.build_opener(_NoRedirect)
    with opener.open(req, timeout=8) as response:
        if urllib.parse.urlparse(response.geturl()).hostname != urllib.parse.urlparse(url).hostname:
            raise ValueError("Redirect outside the source allowlist")
        data = response.read(MAX_RESPONSE_BYTES + 1)
    if len(data) > MAX_RESPONSE_BYTES:
        raise ValueError("News source response is too large")
    return data


def _iso_date(value):
    if not value:
        return datetime.now(timezone.utc).isoformat()
    try:
        if "," in value:
            return parsedate_to_datetime(value).astimezone(timezone.utc).isoformat()
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError):
        return datetime.now(timezone.utc).isoformat()


def _allowed_link(value, hosts):
    parsed = urllib.parse.urlparse(str(value or ""))
    return str(value) if parsed.scheme == "https" and parsed.hostname in hosts else ""


def _github():
    repos = json.loads(_request("bellingcat_github"))
    return [{"id": f"github:{repo['id']}", "type": "tool", "source": "Bellingcat GitHub", "title": repo["name"], "summary": repo.get("description") or "Bellingcat open source repository", "url": _allowed_link(repo["html_url"], {"github.com"}), "published_at": _iso_date(repo.get("pushed_at"))} for repo in repos if not repo.get("archived") and _allowed_link(repo.get("html_url"), {"github.com"})]


def _arxiv():
    root = ET.fromstring(_request("arxiv"))
    ns = {"a": "http://www.w3.org/2005/Atom"}
    items = []
    for entry in root.findall("a:entry", ns):
        url = _allowed_link(next((link.get("href") for link in entry.findall("a:link", ns) if link.get("rel") == "alternate"), None), {"arxiv.org"})
        if url:
            items.append({"id": f"arxiv:{entry.findtext('a:id', '', ns).rsplit('/', 1)[-1]}", "type": "research", "source": "arXiv", "title": " ".join(entry.findtext("a:title", "", ns).split()), "summary": " ".join(entry.findtext("a:summary", "", ns).split())[:420], "url": url, "published_at": _iso_date(entry.findtext("a:published", "", ns))})
    return items


def _rss():
    root = ET.fromstring(_request("bellingcat_rss"))
    items = []
    for entry in root.findall("./channel/item")[:12]:
        url = entry.findtext("link", "").strip()
        if url.startswith("https://www.bellingcat.com/"):
            items.append({"id": f"bellingcat:{entry.findtext('guid', url)}", "type": "research", "source": "Bellingcat", "title": " ".join(entry.findtext("title", "").split()), "summary": "", "url": url, "published_at": _iso_date(entry.findtext("pubDate", ""))})
    return items


FETCHERS = {"bellingcat_github": _github, "bellingcat_rss": _rss, "arxiv": _arxiv}


def fetch_all():
    items, failed = [], []
    for source_id, fetcher in FETCHERS.items():
        try:
            items.extend(fetcher())
        except (OSError, ValueError, KeyError, json.JSONDecodeError, ET.ParseError, urllib.error.URLError):
            failed.append(source_id)
    unique = {item["id"]: item for item in items}
    return sorted(unique.values(), key=lambda item: item["published_at"], reverse=True)[:30], failed
