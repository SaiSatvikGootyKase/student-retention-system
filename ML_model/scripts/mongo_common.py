"""Shared MongoDB URI from Spring application.properties (local instance only)."""

from __future__ import annotations

from pathlib import Path

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConfigurationError


def project_root() -> Path:
    # ML_model/scripts/mongo_common.py -> student-retention-system
    return Path(__file__).resolve().parents[2]


def _read_prop_value(props_text: str, key: str) -> str | None:
    for raw in props_text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith(key):
            val = line.split("=", 1)[1].strip()
            if " #" in val:
                val = val.split(" #", 1)[0].strip()
            return val
    return None


def read_spring_mongodb_uri(root: Path | None = None) -> str:
    root = root or project_root()
    props = root / "src" / "main" / "resources" / "application.properties"
    if not props.is_file():
        raise FileNotFoundError(f"Missing {props}")
    text = props.read_text(encoding="utf-8")
    for key in ("spring.mongodb.uri=", "spring.data.mongodb.uri="):
        v = _read_prop_value(text, key)
        if v:
            return v
    raise RuntimeError("spring.mongodb.uri= (or legacy spring.data.mongodb.uri=) not found in application.properties")


def read_spring_mongodb_database(root: Path | None = None) -> str:
    """Database name from application.properties, or 'student' if unset."""
    root = root or project_root()
    props = root / "src" / "main" / "resources" / "application.properties"
    if not props.is_file():
        return "student"
    text = props.read_text(encoding="utf-8")
    for key in ("spring.mongodb.database=", "spring.data.mongodb.database="):
        v = _read_prop_value(text, key)
        if v:
            return v
    return "student"


def get_mongo_uri() -> str:
    uri = read_spring_mongodb_uri().strip()
    if uri.lower().startswith("mongodb+srv"):
        raise RuntimeError(
            "This project is configured for local MongoDB only (mongodb://localhost:27017/). "
            "Remove mongodb+srv Atlas URIs from src/main/resources/application.properties."
        )
    return uri


def get_mongo_client(**kwargs) -> MongoClient:
    return MongoClient(get_mongo_uri(), **kwargs)


def get_lms_database(client: MongoClient | None = None) -> Database:
    c = client or get_mongo_client()
    name = read_spring_mongodb_database()
    if name:
        return c[name]
    try:
        db = c.get_default_database()
        if db is not None and db.name is not None:
            return db
    except ConfigurationError:
        pass
    return c["student"]
