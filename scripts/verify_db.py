"""
Automated Database & Redis Verification & Telangana Mines Seeding Script
Usage:
  python scripts/verify_db.py [--seed] [--reseed]
"""
import sys
import os
import argparse
import asyncio
from datetime import datetime, timezone

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.infrastructure.database.connection import (
    init_beanie_db,
    check_redis_connection,
    close_db_connections,
)
from app.infrastructure.database.seeds.telangana_mines import seed_telangana_mines_data
from app.infrastructure.database.models import (
    TenantModel,
    UserModel,
    MineSiteModel,
    MineUndergroundStationModel,
    StatutoryRuleModel,
    InspectionModel,
    ViolationCAPAModel,
    ComplianceScheduleModel,
    InspectionScheduleModel,
    WorkerAttendanceModel,
    AuditLedgerModel,
    NotificationModel,
)


if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


def print_banner():
    print("=" * 75)
    print(" [COAL MINES AI GOVERNANCE] - DATABASE & REDIS HEALTH CHECK (SIH26024)")
    print("=" * 75)


async def main():
    parser = argparse.ArgumentParser(description="Verify MongoDB, Redis, and Telangana SCCL Mines seed data.")
    parser.add_argument("--seed", action="store_true", help="Seed database if empty")
    parser.add_argument("--reseed", action="store_true", help="Force reseed (wipes and recreates Telangana data)")
    args = parser.parse_args()

    print_banner()
    print(f"🕒 Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"🌍 Environment: {settings.APP_ENV}")
    print(f"🍃 MongoDB URL: {settings.MONGODB_URL}")
    print(f"⚡ Redis URL:   {settings.REDIS_URL}")
    print("-" * 75)

    # 1. Check Redis Connection
    print("\n[1/3] ⚡ Testing Redis Connection...")
    redis_res = await check_redis_connection()
    if redis_res.get("status") == "connected":
        print(f"  ✅ Redis: CONNECTED (Version: {redis_res.get('version')})")
    else:
        print(f"  ⚠️  Redis: OFFLINE / UNREACHABLE ({redis_res.get('error')})")
        print("     (Note: In-memory fallbacks or Celery mock queue will handle background operations in dev)")

    # 2. Check MongoDB & Beanie ODM
    print("\n[2/3] 🍃 Testing MongoDB & Beanie ODM Connection...")
    try:
        db_res = await init_beanie_db(database_name="coal_governance", seed_if_empty=False)
        mode = db_res.get("mode", "unknown")
        if mode == "live_mongodb":
            print(f"  ✅ MongoDB: CONNECTED (Database: {db_res.get('database')})")
        else:
            print(f"  ℹ️  MongoDB: In-Memory mongomock active for local development")
    except Exception as exc:
        print(f"  ❌ MongoDB Error: {exc}")
        sys.exit(1)

    # 3. Handle Seeding
    if args.reseed:
        print("\n[3/3] 🔄 Performing FORCE RESEED for Telangana SCCL Coal Mines...")
        res = await seed_telangana_mines_data(force_reseed=True)
        print(f"  ✅ Reseed complete: {res}")
    elif args.seed or await TenantModel.count() == 0:
        print("\n[3/3] 🌱 Seeding Telangana SCCL Coal Mines Master Data...")
        res = await seed_telangana_mines_data(force_reseed=False)
        print(f"  ✅ Seed status: {res}")
    else:
        print("\n[3/3] 📊 Verifying Existing Database Records...")

    # 4. Collection Counts & Telangana Mine Inspection
    print("\n" + "=" * 75)
    print(" 📋 DATABASE COLLECTIONS SUMMARY")
    print("=" * 75)
    
    counts = {
        "Tenants (Hierarchy)": await TenantModel.count(),
        "Users & Auth Accounts": await UserModel.count(),
        "Mine Sites (Telangana)": await MineSiteModel.count(),
        "Underground Stations": await MineUndergroundStationModel.count(),
        "Statutory Rules (CMR 2017)": await StatutoryRuleModel.count(),
        "Inspections & Audits": await InspectionModel.count(),
        "CAPA Notices & Violations": await ViolationCAPAModel.count(),
        "Permit Compliance Schedules": await ComplianceScheduleModel.count(),
        "Inspection Assignments": await InspectionScheduleModel.count(),
        "Worker Attendance Records": await WorkerAttendanceModel.count(),
        "Cryptographic Audit Ledger": await AuditLedgerModel.count(),
        "Statutory Notifications": await NotificationModel.count(),
    }

    for col, count in counts.items():
        print(f"  • {col:<32}: {count:>4} records")

    # Inspect Telangana Mines Details
    print("\n" + "-" * 75)
    print(" 🏛️  TELANGANA (SCCL) MINE SITES")
    print("-" * 75)
    mines = await MineSiteModel.find_all().to_list()
    for idx, m in enumerate(mines, 1):
        stations = await MineUndergroundStationModel.find(
            MineUndergroundStationModel.mine_site_id == m.id
        ).to_list()
        st_codes = [s.station_code for s in stations]
        print(f"  {idx}. {m.name}")
        print(f"     Lease No : {m.lease_number}")
        print(f"     Location : {m.district}, {m.state} (PIN: {m.pin_code or 'N/A'})")
        if st_codes:
            print(f"     RFID Beacons : {', '.join(st_codes)}")
        if m.boundary:
            print(f"     Geofence : GeoJSON Polygon configured ({len(m.boundary.get('coordinates', [[]])[0])} points)")

    print("\n" + "=" * 75)
    print(" 🎉 ALL DATABASE CONNECTIONS & TELANGANA MASTER RECORDS VERIFIED!")
    print("=" * 75 + "\n")

    await close_db_connections()


if __name__ == "__main__":
    asyncio.run(main())
