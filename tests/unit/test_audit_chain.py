"""
Unit tests — Per-mine-site sharded SHA-256 audit hash chain (Refinement 2).
Tests: hash computation, GENESIS handling, chain verification, tampering detection.
"""
import hashlib
import json
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.audit_service import AuditService, GENESIS_HASH, _compute_hash
from app.domain.enums import AuditEntityType, AuditOperation


# ── Hash Computation Tests ─────────────────────────────────────────────────────

def test_compute_hash_is_deterministic():
    """Same inputs must always produce same SHA-256 hash."""
    mine_id = uuid.uuid4()
    payload = {"field": "value", "number": 42}
    h1 = _compute_hash(mine_id, 1, GENESIS_HASH, payload)
    h2 = _compute_hash(mine_id, 1, GENESIS_HASH, payload)
    assert h1 == h2


def test_compute_hash_sort_keys():
    """Dict key ordering must not affect hash — sort_keys=True enforced."""
    mine_id = uuid.uuid4()
    payload_a = {"b": 2, "a": 1}
    payload_b = {"a": 1, "b": 2}
    h1 = _compute_hash(mine_id, 1, GENESIS_HASH, payload_a)
    h2 = _compute_hash(mine_id, 1, GENESIS_HASH, payload_b)
    assert h1 == h2, "sort_keys=True must make dict ordering irrelevant"


def test_compute_hash_differs_on_different_mine():
    """Different mine_site_id must produce different hash."""
    payload = {"title": "inspection"}
    h1 = _compute_hash(uuid.uuid4(), 1, GENESIS_HASH, payload)
    h2 = _compute_hash(uuid.uuid4(), 1, GENESIS_HASH, payload)
    assert h1 != h2


def test_compute_hash_differs_on_different_sequence():
    mine_id = uuid.uuid4()
    payload = {"title": "inspection"}
    h1 = _compute_hash(mine_id, 1, GENESIS_HASH, payload)
    h2 = _compute_hash(mine_id, 2, GENESIS_HASH, payload)
    assert h1 != h2


def test_compute_hash_differs_on_different_prev_hash():
    mine_id = uuid.uuid4()
    payload = {"title": "inspection"}
    h1 = _compute_hash(mine_id, 2, "aabbcc", payload)
    h2 = _compute_hash(mine_id, 2, "ddeeff", payload)
    assert h1 != h2


def test_hash_is_valid_sha256():
    """Output must be a 64-char hex string (SHA-256)."""
    h = _compute_hash(uuid.uuid4(), 1, GENESIS_HASH, {"x": 1})
    assert len(h) == 64
    assert all(c in "0123456789abcdef" for c in h)


# ── Chain Verification Tests ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_verify_empty_chain():
    """Empty chain (no entries) should return valid."""
    mock_repo = MagicMock()
    mock_repo.get_chain_for_mine = AsyncMock(return_value=[])
    svc = AuditService(mock_repo)

    result = await svc.verify_chain(uuid.uuid4())
    assert result["valid"] is True
    assert result["total_entries"] == 0


@pytest.mark.asyncio
async def test_verify_valid_chain():
    """A correctly chained 3-entry chain should verify as valid."""
    mine_id = uuid.uuid4()
    entity_id = uuid.uuid4()
    actor_id  = uuid.uuid4()

    payloads = [{"seq": i} for i in range(1, 4)]
    entries  = []
    prev_hash = GENESIS_HASH
    for i, payload in enumerate(payloads, start=1):
        rh = _compute_hash(mine_id, i, prev_hash, payload)
        entry = MagicMock()
        entry.mine_site_id    = mine_id
        entry.sequence_number = i
        entry.payload_json    = payload
        entry.prev_hash       = prev_hash
        entry.record_hash     = rh
        entries.append(entry)
        prev_hash = rh

    mock_repo = MagicMock()
    mock_repo.get_chain_for_mine = AsyncMock(return_value=entries)
    svc = AuditService(mock_repo)

    result = await svc.verify_chain(mine_id)
    assert result["valid"] is True
    assert result["broken_at_sequence"] is None
    assert result["total_entries"] == 3


@pytest.mark.asyncio
async def test_verify_detects_content_tampering():
    """Altering payload_json of an entry must be detected."""
    mine_id = uuid.uuid4()
    payload = {"status": "REPORTED"}
    rh = _compute_hash(mine_id, 1, GENESIS_HASH, payload)

    entry = MagicMock()
    entry.mine_site_id    = mine_id
    entry.sequence_number = 1
    entry.payload_json    = {"status": "CLOSED"}   # ← tampered!
    entry.prev_hash       = GENESIS_HASH
    entry.record_hash     = rh                      # hash is stale

    mock_repo = MagicMock()
    mock_repo.get_chain_for_mine = AsyncMock(return_value=[entry])
    svc = AuditService(mock_repo)

    result = await svc.verify_chain(mine_id)
    assert result["valid"] is False
    assert result["broken_at_sequence"] == 1


@pytest.mark.asyncio
async def test_verify_detects_chain_break():
    """Incorrect prev_hash (e.g. deleted middle entry) must be detected."""
    mine_id = uuid.uuid4()
    payload = {"seq": 2}
    # Correct hash would require prev_hash="correct_prev"
    rh = _compute_hash(mine_id, 2, "correct_prev", payload)

    entry = MagicMock()
    entry.mine_site_id    = mine_id
    entry.sequence_number = 2
    entry.payload_json    = payload
    entry.prev_hash       = "wrong_prev_hash"   # ← chain break
    entry.record_hash     = rh

    mock_repo = MagicMock()
    mock_repo.get_chain_for_mine = AsyncMock(return_value=[entry])
    svc = AuditService(mock_repo)

    result = await svc.verify_chain(mine_id)
    assert result["valid"] is False
    assert result["broken_at_sequence"] == 2
