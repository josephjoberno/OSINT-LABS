"""Central SQLite store for OSINT Labs.

Aggregates every project and its research in a single database file that lives
on the persistent /data volume, alongside the per-project JSON working files.
It holds the projects registry, discovered findings, scan history and the
annotation board (canvas) notes, so everything is queryable in one place.
"""

import os
import base64
import hashlib
import hmac
import json
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(os.environ.get("OSINT_DB_PATH", os.environ.get("OSINT_DATA_DIR", "/data") + "/osint.db"))

_lock = threading.Lock()
_initialized = False


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db() -> None:
    global _initialized
    with _lock:
        if _initialized:
            return
        with _connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    primary_target TEXT,
                    created_at TEXT,
                    updated_at TEXT
                );

                CREATE TABLE IF NOT EXISTS findings (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    type TEXT,
                    value TEXT,
                    source_tool TEXT,
                    created_at TEXT,
                    UNIQUE(project_id, type, value)
                );

                CREATE TABLE IF NOT EXISTS scans (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    tool_id TEXT,
                    tool_name TEXT,
                    target TEXT,
                    command TEXT,
                    exit_code INTEGER,
                    started_at TEXT
                );

                CREATE TABLE IF NOT EXISTS annotations (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    text TEXT NOT NULL,
                    x REAL NOT NULL DEFAULT 40,
                    y REAL NOT NULL DEFAULT 40,
                    created_at TEXT,
                    updated_at TEXT
                );

                CREATE TABLE IF NOT EXISTS canvas_nodes (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    entity_id TEXT,
                    node_type TEXT NOT NULL DEFAULT 'entity',
                    section TEXT,
                    title TEXT,
                    data_json TEXT NOT NULL DEFAULT '{}',
                    x REAL NOT NULL DEFAULT 40,
                    y REAL NOT NULL DEFAULT 40,
                    width REAL,
                    height REAL,
                    hidden INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT,
                    updated_at TEXT,
                    UNIQUE(project_id, entity_id)
                );

                CREATE TABLE IF NOT EXISTS canvas_edges (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    source_node_id TEXT NOT NULL,
                    target_node_id TEXT NOT NULL,
                    relation TEXT NOT NULL DEFAULT 'related',
                    data_json TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT,
                    UNIQUE(project_id, source_node_id, target_node_id, relation)
                );

                CREATE TABLE IF NOT EXISTS canvas_drawings (
                    project_id TEXT PRIMARY KEY,
                    elements_json TEXT NOT NULL DEFAULT '[]',
                    updated_at TEXT
                );

                CREATE TABLE IF NOT EXISTS ai_settings (
                    project_id TEXT PRIMARY KEY,
                    provider TEXT NOT NULL DEFAULT 'openrouter',
                    model TEXT NOT NULL DEFAULT 'openai/gpt-4.1-mini',
                    api_key_ciphertext TEXT,
                    updated_at TEXT
                );

                CREATE TABLE IF NOT EXISTS chat_messages (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    thread_id TEXT NOT NULL DEFAULT 'default',
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    sources_json TEXT NOT NULL DEFAULT '[]',
                    web_search INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT
                );

                CREATE TABLE IF NOT EXISTS ai_tool_actions (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    thread_id TEXT NOT NULL DEFAULT 'default',
                    tool_id TEXT NOT NULL,
                    target TEXT NOT NULL,
                    rationale TEXT,
                    status TEXT NOT NULL DEFAULT 'proposed',
                    created_at TEXT,
                    confirmed_at TEXT,
                    launched_at TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_findings_project ON findings(project_id);
                CREATE INDEX IF NOT EXISTS idx_scans_project ON scans(project_id);
                CREATE INDEX IF NOT EXISTS idx_annotations_project ON annotations(project_id);
                CREATE INDEX IF NOT EXISTS idx_canvas_nodes_project ON canvas_nodes(project_id);
                CREATE INDEX IF NOT EXISTS idx_canvas_edges_project ON canvas_edges(project_id);
                CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(project_id, thread_id, created_at);
                CREATE INDEX IF NOT EXISTS idx_ai_tool_actions_project ON ai_tool_actions(project_id, created_at);
                """
            )
        _initialized = True


# --- Projects registry -------------------------------------------------------

def sync_project(project: dict) -> None:
    if not project or not project.get("id"):
        return
    init_db()
    now = _now()
    with _lock, _connect() as conn:
        conn.execute(
            """
            INSERT INTO projects (id, name, description, primary_target, created_at, updated_at)
            VALUES (:id, :name, :description, :primary_target, :created_at, :updated_at)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                description=excluded.description,
                primary_target=excluded.primary_target,
                updated_at=excluded.updated_at
            """,
            {
                "id": project["id"],
                "name": project.get("name", "Projet"),
                "description": project.get("description", ""),
                "primary_target": project.get("primary_target", ""),
                "created_at": project.get("created_at", now),
                "updated_at": now,
            },
        )


def delete_project(project_id: str) -> None:
    init_db()
    with _lock, _connect() as conn:
        for table in ("ai_tool_actions", "chat_messages", "ai_settings", "canvas_drawings", "canvas_edges", "canvas_nodes", "annotations", "scans", "findings", "projects"):
            conn.execute(
                f"DELETE FROM {table} WHERE {'id' if table == 'projects' else 'project_id'} = ?",
                (project_id,),
            )


def clear_project_research(project_id: str) -> None:
    """Remove investigation data while preserving the project registry."""
    init_db()
    with _lock, _connect() as conn:
        for table in (
            "ai_tool_actions", "chat_messages", "canvas_drawings", "canvas_edges", "canvas_nodes", "annotations",
            "scans", "findings",
        ):
            conn.execute(f"DELETE FROM {table} WHERE project_id = ?", (project_id,))


def clear_all() -> None:
    """Remove all persisted project data from the central store."""
    init_db()
    with _lock, _connect() as conn:
        for table in (
            "ai_tool_actions", "chat_messages", "ai_settings", "canvas_drawings", "canvas_edges", "canvas_nodes",
            "annotations", "scans", "findings", "projects",
        ):
            conn.execute(f"DELETE FROM {table}")


# --- Findings + scans (aggregated research) ----------------------------------

def record_finding(project_id: str, ftype: str, value: str, source_tool: str = "") -> None:
    if not value:
        return
    init_db()
    with _lock, _connect() as conn:
        conn.execute(
            """
            INSERT INTO findings (id, project_id, type, value, source_tool, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(project_id, type, value) DO NOTHING
            """,
            (str(uuid.uuid4()), project_id, ftype, value, source_tool, _now()),
        )


def get_findings(project_id: str, limit: int = 200) -> list[dict]:
    init_db()
    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT type, value, source_tool, created_at FROM findings WHERE project_id = ? "
            "ORDER BY created_at DESC LIMIT ?", (project_id, limit),
        ).fetchall()
    return [dict(row) for row in rows]


def _derive_keys(secret: str) -> tuple[bytes, bytes]:
    root = hashlib.sha256(secret.encode("utf-8")).digest()
    return hmac.new(root, b"osint-encryption", hashlib.sha256).digest(), hmac.new(root, b"osint-auth", hashlib.sha256).digest()


def protect_secret(value: str, secret: str) -> str:
    """Encrypt a small secret with an HMAC-derived stream and authenticate it.

    This avoids storing provider keys in clear text without adding a runtime
    dependency. Deployments must use a strong, stable FLASK_SECRET_KEY.
    """
    enc_key, auth_key = _derive_keys(secret)
    nonce = os.urandom(16)
    raw = value.encode("utf-8")
    stream = bytearray()
    counter = 0
    while len(stream) < len(raw):
        stream.extend(hmac.new(enc_key, nonce + counter.to_bytes(4, "big"), hashlib.sha256).digest())
        counter += 1
    cipher = bytes(a ^ b for a, b in zip(raw, stream))
    payload = nonce + cipher
    tag = hmac.new(auth_key, payload, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(payload + tag).decode("ascii")


def reveal_secret(token: str, secret: str) -> str:
    enc_key, auth_key = _derive_keys(secret)
    packed = base64.urlsafe_b64decode(token.encode("ascii"))
    if len(packed) < 49:
        raise ValueError("Secret chiffre invalide")
    payload, tag = packed[:-32], packed[-32:]
    if not hmac.compare_digest(tag, hmac.new(auth_key, payload, hashlib.sha256).digest()):
        raise ValueError("Secret chiffre invalide")
    nonce, cipher = payload[:16], payload[16:]
    stream = bytearray()
    counter = 0
    while len(stream) < len(cipher):
        stream.extend(hmac.new(enc_key, nonce + counter.to_bytes(4, "big"), hashlib.sha256).digest())
        counter += 1
    return bytes(a ^ b for a, b in zip(cipher, stream)).decode("utf-8")


def save_ai_settings(project_id: str, model: str, api_key: str | None, secret: str) -> dict:
    init_db()
    with _lock, _connect() as conn:
        current = conn.execute("SELECT api_key_ciphertext FROM ai_settings WHERE project_id = ?", (project_id,)).fetchone()
        ciphertext = current[0] if current else None
        if api_key:
            ciphertext = protect_secret(api_key, secret)
        conn.execute(
            "INSERT INTO ai_settings(project_id, model, api_key_ciphertext, updated_at) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(project_id) DO UPDATE SET model=excluded.model, api_key_ciphertext=excluded.api_key_ciphertext, updated_at=excluded.updated_at",
            (project_id, model, ciphertext, _now()),
        )
    return {"provider": "openrouter", "model": model, "has_api_key": bool(ciphertext)}


def get_ai_settings(project_id: str, secret: str, include_key: bool = False) -> dict:
    init_db()
    with _lock, _connect() as conn:
        row = conn.execute("SELECT * FROM ai_settings WHERE project_id = ?", (project_id,)).fetchone()
    result = {"provider": "openrouter", "model": "openai/gpt-4.1-mini", "has_api_key": False}
    if row:
        result.update({"model": row["model"], "has_api_key": bool(row["api_key_ciphertext"])})
        if include_key and row["api_key_ciphertext"]:
            result["api_key"] = reveal_secret(row["api_key_ciphertext"], secret)
    return result


def add_chat_message(project_id: str, thread_id: str, role: str, content: str, *, sources_json: str = "[]", web_search: bool = False) -> dict:
    message = {"id": str(uuid.uuid4()), "project_id": project_id, "thread_id": thread_id, "role": role, "content": content, "sources_json": sources_json, "web_search": int(web_search), "created_at": _now()}
    with _lock, _connect() as conn:
        conn.execute("INSERT INTO chat_messages(id, project_id, thread_id, role, content, sources_json, web_search, created_at) VALUES (:id,:project_id,:thread_id,:role,:content,:sources_json,:web_search,:created_at)", message)
    return message


def list_chat_messages(project_id: str, thread_id: str = "default", limit: int = 50) -> list[dict]:
    init_db()
    with _lock, _connect() as conn:
        rows = conn.execute("SELECT id, thread_id, role, content, sources_json, web_search, created_at FROM chat_messages WHERE project_id=? AND thread_id=? ORDER BY created_at DESC LIMIT ?", (project_id, thread_id, limit)).fetchall()
    return [dict(row) for row in reversed(rows)]


def propose_ai_tool_action(project_id: str, thread_id: str, tool_id: str, target: str, rationale: str) -> dict:
    action = {
        "id": str(uuid.uuid4()), "project_id": project_id, "thread_id": thread_id,
        "tool_id": tool_id, "target": target, "rationale": rationale,
        "status": "proposed", "created_at": _now(),
    }
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO ai_tool_actions(id,project_id,thread_id,tool_id,target,rationale,status,created_at) "
            "VALUES (:id,:project_id,:thread_id,:tool_id,:target,:rationale,:status,:created_at)", action,
        )
    return action


def confirm_ai_tool_action(project_id: str, action_id: str) -> dict | None:
    now = _now()
    with _lock, _connect() as conn:
        changed = conn.execute(
            "UPDATE ai_tool_actions SET status='confirmed', confirmed_at=? "
            "WHERE id=? AND project_id=? AND status='proposed'", (now, action_id, project_id),
        ).rowcount
        row = conn.execute("SELECT * FROM ai_tool_actions WHERE id=? AND project_id=?", (action_id, project_id)).fetchone()
    return dict(row) if changed and row else None


def consume_ai_tool_action(project_id: str, action_id: str, tool_id: str, target: str) -> bool:
    with _lock, _connect() as conn:
        changed = conn.execute(
            "UPDATE ai_tool_actions SET status='launched', launched_at=? "
            "WHERE id=? AND project_id=? AND tool_id=? AND target=? AND status='confirmed'",
            (_now(), action_id, project_id, tool_id, target),
        ).rowcount
    return changed == 1


def record_scan(project_id: str, scan: dict) -> None:
    init_db()
    with _lock, _connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO scans
                (id, project_id, tool_id, tool_name, target, command, exit_code, started_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                scan.get("id", str(uuid.uuid4())),
                project_id,
                scan.get("tool_id"),
                scan.get("tool_name"),
                scan.get("target"),
                scan.get("command"),
                scan.get("exit_code"),
                scan.get("started_at", _now()),
            ),
        )


def get_canvas_state(project_id: str) -> dict:
    init_db()
    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT entity_id, x, y, hidden FROM canvas_nodes "
            "WHERE project_id = ? AND entity_id IS NOT NULL", (project_id,),
        ).fetchall()
    return {
        "positions": {row["entity_id"]: {"x": row["x"], "y": row["y"]} for row in rows},
        "hidden": [row["entity_id"] for row in rows if row["hidden"]],
    }


def save_canvas_state(project_id: str, positions: dict, hidden: list) -> dict:
    init_db()
    hidden_ids = {str(item)[:120] for item in hidden}
    now = _now()
    with _lock, _connect() as conn:
        conn.execute("UPDATE canvas_nodes SET hidden=0 WHERE project_id=?", (project_id,))
        entity_ids = set(positions) | hidden_ids
        for raw_entity_id in entity_ids:
            entity_id = str(raw_entity_id)[:120]
            position = positions.get(raw_entity_id, {})
            try:
                x, y = float(position.get("x", 40)), float(position.get("y", 40))
            except (AttributeError, TypeError, ValueError):
                x, y = 40.0, 40.0
            conn.execute(
                "INSERT INTO canvas_nodes(id, project_id, entity_id, x, y, hidden, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(project_id, entity_id) DO UPDATE SET "
                "x=excluded.x, y=excluded.y, hidden=excluded.hidden, updated_at=excluded.updated_at",
                (f"{project_id}:entity:{entity_id}", project_id, entity_id, x, y,
                 int(entity_id in hidden_ids), now, now),
            )
    return get_canvas_state(project_id)


def get_canvas_drawings(project_id: str) -> list[dict]:
    init_db()
    with _lock, _connect() as conn:
        row = conn.execute(
            "SELECT elements_json FROM canvas_drawings WHERE project_id = ?", (project_id,),
        ).fetchone()
    if not row:
        return []
    try:
        elements = json.loads(row["elements_json"])
        return elements if isinstance(elements, list) else []
    except (TypeError, ValueError):
        return []


def save_canvas_drawings(project_id: str, elements: list[dict]) -> list[dict]:
    init_db()
    serialized = json.dumps(elements, ensure_ascii=False, separators=(",", ":"))
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO canvas_drawings(project_id, elements_json, updated_at) VALUES (?, ?, ?) "
            "ON CONFLICT(project_id) DO UPDATE SET elements_json=excluded.elements_json, updated_at=excluded.updated_at",
            (project_id, serialized, _now()),
        )
    return elements


# --- Annotations (canvas board) ----------------------------------------------

def list_annotations(project_id: str) -> list[dict]:
    init_db()
    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM annotations WHERE project_id = ? ORDER BY created_at ASC",
            (project_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def add_annotation(project_id: str, text: str, x: float = 40, y: float = 40) -> dict:
    init_db()
    now = _now()
    ann = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "text": text,
        "x": float(x),
        "y": float(y),
        "created_at": now,
        "updated_at": now,
    }
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO annotations (id, project_id, text, x, y, created_at, updated_at) "
            "VALUES (:id, :project_id, :text, :x, :y, :created_at, :updated_at)",
            ann,
        )
    return ann


def update_annotation(project_id: str, ann_id: str, fields: dict) -> dict | None:
    init_db()
    allowed = {k: fields[k] for k in ("text", "x", "y") if k in fields}
    if not allowed:
        return get_annotation(project_id, ann_id)
    allowed["updated_at"] = _now()
    sets = ", ".join(f"{k} = :{k}" for k in allowed)
    allowed.update({"id": ann_id, "project_id": project_id})
    with _lock, _connect() as conn:
        conn.execute(
            f"UPDATE annotations SET {sets} WHERE id = :id AND project_id = :project_id",
            allowed,
        )
    return get_annotation(project_id, ann_id)


def get_annotation(project_id: str, ann_id: str) -> dict | None:
    init_db()
    with _lock, _connect() as conn:
        row = conn.execute(
            "SELECT * FROM annotations WHERE id = ? AND project_id = ?",
            (ann_id, project_id),
        ).fetchone()
    return dict(row) if row else None


def delete_annotation(project_id: str, ann_id: str) -> None:
    init_db()
    with _lock, _connect() as conn:
        conn.execute(
            "DELETE FROM annotations WHERE id = ? AND project_id = ?",
            (ann_id, project_id),
        )
