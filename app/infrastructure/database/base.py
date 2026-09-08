"""
MongoDB async engine and initialization using Motor and Beanie.
Delegates to connection manager and seeds Telangana SCCL master records.
"""
from app.infrastructure.database.connection import (
    init_beanie_db,
    get_mongo_client,
    get_redis_client,
    check_redis_connection,
    close_db_connections,
    close_db_connections as close_db,
    _mongo_client as client,
)
from app.infrastructure.database.seeds.telangana_mines import seed_telangana_mines_data


async def init_db():
    """Initializes MongoDB connection and Beanie ODM with Telangana SCCL seed data."""
    return await init_beanie_db(database_name="coal_governance", seed_if_empty=True)
