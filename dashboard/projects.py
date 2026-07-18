"""Gestion des projets OSINT Labs."""

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from investigation import default_context, save_context

PROJECTS_ROOT_NAME = "projects"
META_FILE = "meta.json"
HISTORY_FILE = "history.json"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def projects_root(data_dir: Path) -> Path:
    root = data_dir / PROJECTS_ROOT_NAME
    root.mkdir(parents=True, exist_ok=True)
    return root


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower().strip())
    slug = slug.strip("-")[:48] or "projet"
    return slug


def project_dir(data_dir: Path, project_id: str) -> Path:
    return projects_root(data_dir) / project_id


def list_projects(data_dir: Path) -> list[dict]:
    root = projects_root(data_dir)
    items: list[dict] = []
    for path in sorted(root.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if not path.is_dir():
            continue
        meta_path = path / META_FILE
        if not meta_path.exists():
            continue
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            meta["id"] = path.name
            items.append(meta)
        except (json.JSONDecodeError, OSError):
            continue
    return items


def get_project(data_dir: Path, project_id: str) -> dict | None:
    meta_path = project_dir(data_dir, project_id) / META_FILE
    if not meta_path.exists():
        return None
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        meta["id"] = project_id
        return meta
    except (json.JSONDecodeError, OSError):
        return None


def create_project(
    data_dir: Path,
    name: str,
    description: str = "",
    *,
    subject_name: str = "",
    primary_target: str = "",
) -> dict:
    name = name.strip()
    description = description.strip()
    if not name:
        raise ValueError("Le nom du projet est obligatoire")
    if len(name) > 120:
        raise ValueError("Nom trop long (max 120 caracteres)")
    if len(description) > 2000:
        raise ValueError("Description trop longue (max 2000 caracteres)")

    project_id = f"{slugify(name)}-{uuid.uuid4().hex[:8]}"
    root = project_dir(data_dir, project_id)
    root.mkdir(parents=True, exist_ok=False)
    (root / "exports").mkdir(exist_ok=True)
    (root / "uploads").mkdir(exist_ok=True)
    (root / "notes").mkdir(exist_ok=True)

    now = _utc_now()
    meta = {
        "id": project_id,
        "name": name,
        "description": description,
        "created_at": now,
        "updated_at": now,
    }
    (root / META_FILE).write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    (root / HISTORY_FILE).write_text("[]", encoding="utf-8")
    ctx = default_context(subject_name or name, primary_target)
    save_context(root, ctx)
    return meta


def delete_project(data_dir: Path, project_id: str) -> None:
    import shutil

    path = project_dir(data_dir, project_id)
    if not path.exists():
        raise ValueError("Projet introuvable")
    shutil.rmtree(path)


def touch_project(data_dir: Path, project_id: str) -> None:
    meta = get_project(data_dir, project_id)
    if not meta:
        return
    meta["updated_at"] = _utc_now()
    (project_dir(data_dir, project_id) / META_FILE).write_text(
        json.dumps(meta, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def project_history_file(data_dir: Path, project_id: str) -> Path:
    return project_dir(data_dir, project_id) / HISTORY_FILE


def project_workdir(data_dir: Path, project_id: str) -> Path:
    path = project_dir(data_dir, project_id)
    if not path.exists():
        raise ValueError("Projet introuvable")
    return path
