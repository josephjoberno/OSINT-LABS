"""Contexte d'investigation partage entre outils d'un meme projet."""

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

CONTEXT_FILE = "context.json"

ENTITY_TYPES = (
    "person",
    "username",
    "email",
    "phone",
    "domain",
    "url",
    "ip",
    "other",
)

CATEGORY_PREFERRED_TYPE = {
    "username": "username",
    "email": "email",
    "google": "email",
    "breach": "email",
    "phone": "phone",
    "domain": "domain",
    "web": "url",
    "network": "domain",
    "secrets": "url",
    "metadata": "other",
}

ENTITY_DEFAULT_TOOLS: dict[str, dict | None] = {
    "username": {"id": "sherlock", "name": "Sherlock"},
    "email": {"id": "holehe", "name": "Holehe"},
    "phone": {"id": "phoneinfoga", "name": "PhoneInfoga"},
    "domain": {"id": "subfinder", "name": "Subfinder"},
    "url": {"id": "httpx", "name": "httpx"},
    "ip": {"id": "nmap", "name": "Nmap"},
    "person": {"id": "maigret", "name": "Maigret"},
    "other": None,
}

GRAPH_MAX_NODES = 24

EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
URL_RE = re.compile(r"https?://[^\s\]>\"']+", re.I)
IP_RE = re.compile(r"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\b")
PHONE_RE = re.compile(r"(?<!\w)(?:\+?\d[\d\s().-]{8,}\d)(?!\w)")
DOMAIN_LIKE_RE = re.compile(
    r"\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b",
    re.I,
)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def default_context(subject_name: str = "", primary_target: str = "") -> dict:
    ctx = {
        "subject_name": subject_name.strip(),
        "primary": {
            "person": subject_name.strip() or None,
            "username": None,
            "email": None,
            "phone": None,
            "domain": None,
            "url": None,
        },
        "entities": [],
        "links": [],
        "updated_at": _utc_now(),
    }
    if primary_target.strip():
        etype = guess_entity_type(primary_target)
        ctx["primary"][etype] = primary_target.strip()
        add_entity(ctx, etype, primary_target.strip(), source_tool="project", relation="primary")
    return ctx


def context_path(project_dir: Path) -> Path:
    return project_dir / CONTEXT_FILE


def load_context(project_dir: Path) -> dict:
    path = context_path(project_dir)
    if not path.exists():
        return default_context()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        data.setdefault("primary", {})
        data.setdefault("entities", [])
        data.setdefault("links", [])
        return data
    except (json.JSONDecodeError, OSError):
        return default_context()


def save_context(project_dir: Path, context: dict) -> None:
    context["updated_at"] = _utc_now()
    context_path(project_dir).write_text(
        json.dumps(context, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def guess_entity_type(value: str) -> str:
    value = value.strip()
    if not value:
        return "other"
    if EMAIL_RE.fullmatch(value) or ("@" in value and EMAIL_RE.search(value)):
        return "email"
    if value.startswith(("http://", "https://")):
        return "url"
    if IP_RE.fullmatch(value):
        return "ip"
    if PHONE_RE.fullmatch(value) and sum(ch.isdigit() for ch in value) >= 8:
        return "phone"
    if DOMAIN_LIKE_RE.fullmatch(value) and "@" not in value:
        return "domain"
    if re.fullmatch(r"[A-Za-z0-9._-]{2,64}", value):
        return "username"
    return "other"


def _entity_id() -> str:
    return uuid.uuid4().hex[:12]


def find_entity(context: dict, etype: str, value: str) -> dict | None:
    norm = value.strip().lower()
    for entity in context["entities"]:
        if entity["type"] == etype and entity["value"].strip().lower() == norm:
            return entity
    return None


def add_entity(
    context: dict,
    etype: str,
    value: str,
    *,
    source_tool: str = "manual",
    relation: str = "related",
    link_to: str | None = None,
) -> dict:
    value = value.strip()
    if not value or len(value) > 512:
        return {}
    if etype not in ENTITY_TYPES:
        etype = guess_entity_type(value)

    existing = find_entity(context, etype, value)
    if existing:
        entity = existing
        if source_tool not in entity.get("sources", []):
            entity.setdefault("sources", [])
            if entity.get("source_tool"):
                entity["sources"].append(entity["source_tool"])
            if source_tool not in entity["sources"]:
                entity["sources"].append(source_tool)
    else:
        entity = {
            "id": _entity_id(),
            "type": etype,
            "value": value,
            "source_tool": source_tool,
            "sources": [source_tool],
            "created_at": _utc_now(),
        }
        context["entities"].append(entity)

    if link_to:
        add_link(context, link_to, entity["id"], relation)

    primary = context.setdefault("primary", {})
    if relation == "primary" or (not primary.get(etype) and etype in primary):
        primary[etype] = value

    return entity


def add_link(context: dict, from_id: str, to_id: str, relation: str = "related") -> None:
    if from_id == to_id:
        return
    for link in context["links"]:
        if link["from"] == from_id and link["to"] == to_id and link["relation"] == relation:
            return
    context["links"].append({"from": from_id, "to": to_id, "relation": relation})


def suggest_for_tool(context: dict, tool: dict) -> str:
    category = tool.get("category", "")
    preferred = CATEGORY_PREFERRED_TYPE.get(category, "other")
    primary = context.get("primary") or {}

    if primary.get(preferred):
        return primary[preferred]

    for entity in reversed(context.get("entities", [])):
        if entity["type"] == preferred:
            return entity["value"]

    for key in ("username", "email", "domain", "phone", "url", "person"):
        if primary.get(key):
            return primary[key]

    if context.get("entities"):
        return context["entities"][-1]["value"]
    return ""


def autocomplete(context: dict, query: str = "", limit: int = 20) -> list[dict]:
    q = query.strip().lower()
    results: list[dict] = []
    seen: set[str] = set()
    for entity in context.get("entities", []):
        val = entity["value"]
        key = f"{entity['type']}:{val.lower()}"
        if key in seen:
            continue
        if q and q not in val.lower() and q not in entity["type"]:
            continue
        seen.add(key)
        results.append(
            {
                "id": entity["id"],
                "type": entity["type"],
                "value": val,
                "source_tool": entity.get("source_tool"),
            }
        )
        if len(results) >= limit:
            break
    return results


def extract_entities_from_text(text: str) -> list[tuple[str, str]]:
    found: list[tuple[str, str]] = []
    seen: set[str] = set()

    def push(etype: str, val: str) -> None:
        val = val.strip().rstrip(".,;:)")
        if not val or len(val) > 512:
            return
        key = f"{etype}:{val.lower()}"
        if key in seen:
            return
        seen.add(key)
        found.append((etype, val))

    for match in EMAIL_RE.finditer(text):
        push("email", match.group(0))
    for match in URL_RE.finditer(text):
        push("url", match.group(0))
    for match in IP_RE.finditer(text):
        push("ip", match.group(0))
    for match in PHONE_RE.finditer(text):
        digits = sum(ch.isdigit() for ch in match.group(0))
        if digits >= 9:
            push("phone", match.group(0))
    for match in DOMAIN_LIKE_RE.finditer(text):
        val = match.group(0)
        if val.count(".") >= 1 and not val.startswith("www.") and len(val) > 3:
            if not any(val in e for e, _ in found if e == "email"):
                push("domain", val)
    return found


def ingest_scan_result(
    context: dict,
    *,
    tool_id: str,
    tool_name: str,
    target: str,
    output: str,
) -> dict:
    target_type = guess_entity_type(target)
    target_entity = add_entity(
        context,
        target_type,
        target,
        source_tool=tool_id,
        relation="scan_target",
    )
    target_id = target_entity.get("id")

    if target_type == "username" and not context.get("subject_name"):
        context["subject_name"] = target

    primary = context.setdefault("primary", {})
    if target_type in primary and not primary.get(target_type):
        primary[target_type] = target

    discovered = 0
    discovered_entities: list[dict] = []
    for etype, value in extract_entities_from_text(output):
        if value.lower() == target.lower():
            continue
        entity = add_entity(
            context,
            etype,
            value,
            source_tool=tool_id,
            relation="discovered",
            link_to=target_id,
        )
        discovered += 1
        if entity:
            discovered_entities.append(
                {"id": entity.get("id"), "type": entity.get("type"), "value": entity.get("value")}
            )

    return {
        "target_entity_id": target_id,
        "discovered_count": discovered,
        "entity_count": len(context.get("entities", [])),
        "target_type": target_type,
        "discovered_entities": discovered_entities,
    }


def suggested_tool_for_type(etype: str) -> dict | None:
    return ENTITY_DEFAULT_TOOLS.get(etype) or ENTITY_DEFAULT_TOOLS.get("other")


def enrich_entity(entity: dict) -> dict:
    enriched = dict(entity)
    tool = suggested_tool_for_type(entity.get("type", "other"))
    if tool:
        enriched["suggested_tool"] = tool
    return enriched


def build_graph(context: dict, max_nodes: int = GRAPH_MAX_NODES) -> dict:
    entities = context.get("entities", [])
    if not entities:
        return {"nodes": [], "edges": []}

    selected = entities[-max_nodes:]
    entity_ids = {entity["id"] for entity in selected}
    nodes = []
    for entity in selected:
        label = entity["value"]
        if len(label) > 20:
            label = f"{label[:17]}..."
        tool = suggested_tool_for_type(entity.get("type", "other"))
        nodes.append(
            {
                "id": entity["id"],
                "label": label,
                "value": entity["value"],
                "type": entity.get("type", "other"),
                "tool": tool,
            }
        )

    edges = [
        {
            "from": link["from"],
            "to": link["to"],
            "relation": link.get("relation", "related"),
        }
        for link in context.get("links", [])
        if link.get("from") in entity_ids and link.get("to") in entity_ids
    ]
    return {"nodes": nodes, "edges": edges}


def context_summary(context: dict) -> dict:
    primary = context.get("primary") or {}
    entities = context.get("entities", [])
    recent = [enrich_entity(entity) for entity in entities[-30:]]
    graph = build_graph(context)
    return {
        "subject_name": context.get("subject_name", ""),
        "primary": primary,
        "entity_count": len(entities),
        "link_count": len(context.get("links", [])),
        "top_entities": recent,
        "entities": recent,
        "graph": graph,
        "entity_tools": {
            key: value for key, value in ENTITY_DEFAULT_TOOLS.items() if value
        },
    }
