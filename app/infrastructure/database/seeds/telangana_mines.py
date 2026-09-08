"""
Telangana Coal Mines Master Seed Data (SCCL)
Operated by The Singareni Collieries Company Limited (SCCL) under Ministry of Coal.
Hierarchical path-based multi-tenancy: /MOC/SCCL/{AREA}/{MINE_SITE}
"""
import uuid
from datetime import date, datetime, timezone, timedelta
from typing import Dict, Any, List
import structlog

logger = structlog.get_logger(__name__)


async def seed_telangana_mines_data(force_reseed: bool = False) -> Dict[str, Any]:
    """
    Seeds database with Telangana coal mines operated by SCCL.
    """
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
        NotificationModel,
        TelemetryGasModel,
        MineCastExtractionModel,
    )
    from app.services.auth_service import hash_password

    if not force_reseed and await TenantModel.count() > 0:
        logger.info("Database already contains tenant data. Skipping automatic seed.")
        return {"status": "skipped", "reason": "data_exists"}

    if force_reseed:
        logger.warning("Force reseed enabled. Clearing existing records...")
        await TenantModel.find_all().delete()
        await UserModel.find_all().delete()
        await MineSiteModel.find_all().delete()
        await MineUndergroundStationModel.find_all().delete()
        await StatutoryRuleModel.find_all().delete()
        await InspectionModel.find_all().delete()
        await ViolationCAPAModel.find_all().delete()
        await ComplianceScheduleModel.find_all().delete()
        await InspectionScheduleModel.find_all().delete()
        await WorkerAttendanceModel.find_all().delete()
        await NotificationModel.find_all().delete()

    logger.info("Seeding Telangana Coal Mines (SCCL) master records...")

    # ─────────────────────────────────────────────────────────────────────────
    # 1. HIERARCHICAL TENANTS (MOC -> SCCL -> AREAS)
    # ─────────────────────────────────────────────────────────────────────────
    ministry = TenantModel(
        id=uuid.UUID("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c01"),
        name="Ministry of Coal (Govt. of India)",
        tier="MINISTRY",
        path="MOC",
        parent_path=None,
    )
    await ministry.insert()

    sccl = TenantModel(
        id=uuid.UUID("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c02"),
        name="The Singareni Collieries Company Limited (SCCL)",
        tier="SUBSIDIARY",
        path="MOC.SCCL",
        parent_path="MOC",
        parent_id=ministry.id,
    )
    await sccl.insert()

    # Areas in Telangana
    rg1_area = TenantModel(
        id=uuid.UUID("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c03"),
        name="Ramagundam Area-1 (Peddapalli)",
        tier="AREA",
        path="MOC.SCCL.RAMAGUNDAM_1",
        parent_path="MOC.SCCL",
        parent_id=sccl.id,
    )
    await rg1_area.insert()

    rg2_area = TenantModel(
        id=uuid.UUID("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c04"),
        name="Ramagundam Area-2 (Peddapalli)",
        tier="AREA",
        path="MOC.SCCL.RAMAGUNDAM_2",
        parent_path="MOC.SCCL",
        parent_id=sccl.id,
    )
    await rg2_area.insert()

    kothagudem_area = TenantModel(
        id=uuid.UUID("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c05"),
        name="Kothagudem Corporate Area",
        tier="AREA",
        path="MOC.SCCL.KOTHAGUDEM",
        parent_path="MOC.SCCL",
        parent_id=sccl.id,
    )
    await kothagudem_area.insert()

    mandamarri_area = TenantModel(
        id=uuid.UUID("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c06"),
        name="Mandamarri Area (Mancherial)",
        tier="AREA",
        path="MOC.SCCL.MANDAMARRI",
        parent_path="MOC.SCCL",
        parent_id=sccl.id,
    )
    await mandamarri_area.insert()

    # ─────────────────────────────────────────────────────────────────────────
    # 2. TELANGANA MINE SITES (4 ACTIVE ZONES)
    # ─────────────────────────────────────────────────────────────────────────
    
    # Mine 1: Godavarikhani No. 11A Incline (Deep & Degree III Gassy Seam)
    mine_gdk11a = MineSiteModel(
        id=uuid.UUID("11111111-1111-4111-a111-111111111111"),
        tenant_id=rg1_area.id,
        name="Godavarikhani No. 11A Incline (GDK-11A)",
        lease_number="ML-SCCL-GDK-11A-2015",
        district="Peddapalli",
        state="Telangana",
        pin_code="505209",
        is_active=True,
        boundary={
            "type": "Polygon",
            "coordinates": [
                [
                    [79.4885, 18.7510],
                    [79.4885, 18.7710],
                    [79.5085, 18.7710],
                    [79.5085, 18.7510],
                    [79.4885, 18.7510],
                ]
            ],
        },
    )
    await mine_gdk11a.insert()

    # Station RFID Beacons for GDK-11A (Underground Incline)
    station_gdk_shaft = MineUndergroundStationModel(
        id=uuid.uuid4(),
        mine_site_id=mine_gdk11a.id,
        station_code="STATION-GDK-SHAFT-BOTTOM",
        description="Level-1 Main Incline Haulage & Shaft Bottom Station",
        depth_meters=380.0,
        is_active=True,
    )
    await station_gdk_shaft.insert()

    station_gdk_seam3 = MineUndergroundStationModel(
        id=uuid.uuid4(),
        mine_site_id=mine_gdk11a.id,
        station_code="STATION-GDK-SEAM3-FACE",
        description="Seam-3 Longwall Face & Telemetric Return Airway Station (RFID-TEL-GDK-01)",
        depth_meters=340.0,
        is_active=True,
    )
    await station_gdk_seam3.insert()

    # Mine 2: Ramagundam Opencast Project-III (RG-OCP 3)
    mine_rg_ocp3 = MineSiteModel(
        id=uuid.UUID("22222222-2222-4222-a222-222222222222"),
        tenant_id=rg2_area.id,
        name="Ramagundam Opencast Project-III (RG-OCP 3)",
        lease_number="ML-SCCL-RG3-OCP-2018",
        district="Peddapalli",
        state="Telangana",
        pin_code="505211",
        is_active=True,
        boundary={
            "type": "Polygon",
            "coordinates": [
                [
                    [79.4934, 18.7362],
                    [79.4934, 18.7762],
                    [79.5334, 18.7762],
                    [79.5334, 18.7362],
                    [79.4934, 18.7362],
                ]
            ],
        },
    )
    await mine_rg_ocp3.insert()

    # Mine 3: Kothagudem Opencast Project (KOCP)
    mine_kocp = MineSiteModel(
        id=uuid.UUID("33333333-3333-4333-a333-333333333333"),
        tenant_id=kothagudem_area.id,
        name="Kothagudem Opencast Project (KOCP)",
        lease_number="ML-SCCL-KOCP-2012",
        district="Bhadradri Kothagudem",
        state="Telangana",
        pin_code="507101",
        is_active=True,
        boundary={
            "type": "Polygon",
            "coordinates": [
                [
                    [80.5989, 17.5318],
                    [80.5989, 17.5718],
                    [80.6389, 17.5718],
                    [80.6389, 17.5318],
                    [80.5989, 17.5318],
                ]
            ],
        },
    )
    await mine_kocp.insert()

    # Mine 4: Kasipet Underground Mine
    mine_kasipet = MineSiteModel(
        id=uuid.UUID("44444444-4444-4444-a444-444444444444"),
        tenant_id=mandamarri_area.id,
        name="Kasipet Underground Mine",
        lease_number="ML-SCCL-KASIPET-UG-2016",
        district="Mancherial",
        state="Telangana",
        pin_code="504231",
        is_active=True,
        boundary={
            "type": "Polygon",
            "coordinates": [
                [
                    [79.4212, 19.0121],
                    [79.4212, 19.0521],
                    [79.4612, 19.0521],
                    [79.4612, 19.0121],
                    [79.4212, 19.0121],
                ]
            ],
        },
    )
    await mine_kasipet.insert()

    station_kasipet_inc1 = MineUndergroundStationModel(
        id=uuid.uuid4(),
        mine_site_id=mine_kasipet.id,
        station_code="STATION-KASIPET-INCLINE-1",
        description="Kasipet Incline No.1 Main Haulage Station (RFID-TEL-KAS-01)",
        depth_meters=180.0,
        is_active=True,
    )
    await station_kasipet_inc1.insert()

    station_kasipet_ret = MineUndergroundStationModel(
        id=uuid.uuid4(),
        mine_site_id=mine_kasipet.id,
        station_code="STATION-KASIPET-RETURN-AIRWAY",
        description="Kasipet Return Airway & Telemetric Monitoring (RFID-TEL-KAS-02)",
        depth_meters=260.0,
        is_active=True,
    )
    await station_kasipet_ret.insert()

    # ─────────────────────────────────────────────────────────────────────────
    # 3. DEMO USERS (SCCL & REGULATORY AUTHORITIES)
    # ─────────────────────────────────────────────────────────────────────────
    demo_users = [
        ("auditor.hq@coal.gov.in", "Dr. R. K. Sharma (MOC Auditor)", "MINISTRY_AUDITOR", ministry.id, "MOC", "+919876543210"),
        ("inspector.dgms@dgms.gov.in", "Er. K. Venkat Rao (DGMS South Central Zone)", "DGMS_INSPECTOR", ministry.id, "MOC", "+919876543211"),
        ("manager.gdk11a@scclmines.com", "N. Ramesh (Colliery Manager - GDK 11A)", "COLLIERY_MANAGER", rg1_area.id, "MOC.SCCL.RAMAGUNDAM_1.GDK_11A", "+919876543212"),
        ("manager.rgocp3@scclmines.com", "Ch. Srinivas (Colliery Manager - RG-OCP 3)", "COLLIERY_MANAGER", rg2_area.id, "MOC.SCCL.RAMAGUNDAM_2.RG_OCP3", "+919876543213"),
        ("manager.kocp@scclmines.com", "B. Venkateswarlu (Manager - KOCP Kothagudem)", "COLLIERY_MANAGER", kothagudem_area.id, "MOC.SCCL.KOTHAGUDEM.KOCP", "+919876543214"),
        ("sirdar.kasipet@scclmines.com", "K. Shankaraiah (Mining Sirdar - Kasipet)", "FIELD_WORKER", mandamarri_area.id, "MOC.SCCL.MANDAMARRI.KASIPET_UG", "+919876543215"),
        ("contractor.singareni@scclmines.com", "T. Rajesh (Singareni HEMM Fleet Operations)", "CONTRACTOR_ADMIN", rg2_area.id, "MOC.SCCL.RAMAGUNDAM_2.RG_OCP3", "+919876543216"),
    ]

    for email, name, role, t_id, t_path, phone in demo_users:
        u = UserModel(
            id=uuid.uuid4(),
            tenant_id=t_id,
            tenant_path=t_path,
            email=email,
            full_name=name,
            role=role,
            phone_number=phone,
            hashed_password=hash_password("demo1234"),
            is_active=True,
        )
        await u.insert()

    # ─────────────────────────────────────────────────────────────────────────
    # 4. STATUTORY RULES (DGMS / CMR 2017 & MoEF&CC)
    # ─────────────────────────────────────────────────────────────────────────
    rule_cmr130 = StatutoryRuleModel(
        id=uuid.UUID("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f01"),
        rule_code="CMR-2017-130",
        title="Haul Road Gradient, Berm & Slope Stability",
        regulatory_body="DGMS",
        category="SurfaceMineSafety",
        description="Mandatory requirement for haul road berm height equal to wheel diameter of largest vehicle.",
        is_active=True,
        effective_from=date(2024, 1, 1),
    )
    await rule_cmr130.insert()

    rule_cmr153 = StatutoryRuleModel(
        id=uuid.UUID("d1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f02"),
        rule_code="CMR-2017-153",
        title="Underground Inflammable & Toxic Gas Precautions",
        regulatory_body="DGMS",
        category="VentilationSafety",
        description="Mandatory methane (<0.75% return, <1.25% general body) and carbon monoxide (<50ppm) monitoring standards.",
        is_active=True,
        effective_from=date(2024, 1, 1),
    )
    await rule_cmr153.insert()

    # ─────────────────────────────────────────────────────────────────────────
    # 5. INITIAL INSPECTIONS & REALISTIC FIELD DOSSIERS
    # ─────────────────────────────────────────────────────────────────────────
    insp_gdk11a = InspectionModel(
        id=uuid.UUID("f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c01"),
        mine_site_id=mine_gdk11a.id,
        inspector_id=uuid.UUID("d81b0803-b7fa-4d06-8b89-ba5a129df5ba"),
        title="Quarterly Degree III Gassy Seam & Continuous Telemetry Audit",
        description="Statutory audit of main return airway and longwall face. Measured CH4 at 0.45%, CO at 8 ppm. Normal limit.",
        location_type="UNDERGROUND_STATION",
        station_id="STATION-GDK-L2-SEAM3",
        is_geofence_breached=False,
        version=1,
        inspection_date=datetime.now(timezone.utc) - timedelta(days=2),
        risk_score=24,
    )
    await insp_gdk11a.insert()

    insp_rgocp3 = InspectionModel(
        id=uuid.UUID("f1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c02"),
        mine_site_id=mine_rg_ocp3.id,
        inspector_id=uuid.UUID("d81b0803-b7fa-4d06-8b89-ba5a129df5ba"),
        title="Highwall Bench Stability & Dust Suppression Audit",
        description="Audit of eastern overburden bench slopes and chemical dust suppressant sprinkler arrays along main haulage ramp.",
        location_type="SURFACE_GPS",
        gps_location="POINT(79.5120 18.7480)",
        is_geofence_breached=False,
        version=1,
        inspection_date=datetime.now(timezone.utc) - timedelta(days=5),
        risk_score=28,
    )
    await insp_rgocp3.insert()

    # ─────────────────────────────────────────────────────────────────────────
    # 6. CAPA WORKFLOW NOTICES
    # ─────────────────────────────────────────────────────────────────────────
    capa_1 = ViolationCAPAModel(
        id=uuid.UUID("c1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c01"),
        inspection_id=insp_rgocp3.id,
        rule_id=rule_cmr130.id,
        capa_state="NOTICE_ISSUED",
        description="Sector 3 overburden haul road safety berm height found at 1.1m (statutory requirement: minimum 1.5m).",
        evidence_urls=["https://storage.singareni.gov.in/evidence/rg3_berm_sector3.jpg"],
        version=1,
    )
    await capa_1.insert()

    # ─────────────────────────────────────────────────────────────────────────
    # 7. COMPLIANCE SCHEDULES & STATUTORY PERMITS
    # ─────────────────────────────────────────────────────────────────────────
    now_date = date.today()
    schedule_1 = ComplianceScheduleModel(
        id=uuid.UUID("e1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c01"),
        mine_site_id=mine_gdk11a.id,
        rule_id=rule_cmr153.id,
        permit_number="DGMS/SCZ/GDK11A/VENT-2024",
        permit_type="DGMS Ventilation & Gas Seam Clearance",
        issued_date=now_date - timedelta(days=330),
        expiry_date=now_date + timedelta(days=35),
        status="ACTIVE",
    )
    await schedule_1.insert()

    schedule_2 = ComplianceScheduleModel(
        id=uuid.UUID("e1a2b3c4-d5e6-4a7b-8c9d-0e1f2a3b4c02"),
        mine_site_id=mine_rg_ocp3.id,
        rule_id=rule_cmr130.id,
        permit_number="SPCB/TS/RG3/CTO-2023",
        permit_type="Consent to Operate (CTO) Air & Water Clearance",
        issued_date=now_date - timedelta(days=350),
        expiry_date=now_date + timedelta(days=14),
        status="EXPIRING_SOON",
    )
    await schedule_2.insert()

    # ─────────────────────────────────────────────────────────────────────────
    # 8. WORKER MUSTER & GAS TELEMETRY
    # ─────────────────────────────────────────────────────────────────────────
    attendance_records = [
        WorkerAttendanceModel(
            worker_id="SCCL-EMP-8921",
            worker_name="K. Shankaraiah",
            mine_site_id=mine_gdk11a.id,
            zone_type="UNDERGROUND",
            station_id="STATION-GDK-L2-SEAM3",
            shift="MORNING",
            gas_level_exposure_ppm=6.5,
            status="ACTIVE_INSIDE",
        ),
        WorkerAttendanceModel(
            worker_id="SCCL-EMP-4312",
            worker_name="B. Thirupathi",
            mine_site_id=mine_gdk11a.id,
            zone_type="UNDERGROUND",
            station_id="STATION-GDK-L1-SHAFT",
            shift="MORNING",
            gas_level_exposure_ppm=4.2,
            status="ACTIVE_INSIDE",
        ),
        WorkerAttendanceModel(
            worker_id="SCCL-EMP-6744",
            worker_name="M. Srinivasulu",
            mine_site_id=mine_rg_ocp3.id,
            zone_type="SURFACE_PIT",
            shift="MORNING",
            gas_level_exposure_ppm=2.0,
            status="ACTIVE_INSIDE",
        ),
    ]
    for att in attendance_records:
        await att.insert()

    # ─────────────────────────────────────────────────────────────────────────
    # 9. ATMOSPHERIC TELEMETRY GAS LOGS (GDK-11A)
    # ─────────────────────────────────────────────────────────────────────────
    telemetry_logs = [
        TelemetryGasModel(
            mine_site_id=mine_gdk11a.id,
            station_id="STATION-GDK-L1",
            station_code="STATION-GDK-L1-SHAFT",
            location_name="Main Intake Airway Shaft #1",
            ch4_percentage=0.18,
            co_ppm=5.2,
            o2_percentage=20.9,
            air_velocity_ms=2.8,
            temperature_celsius=26.5,
            status="APPROVED",
            record_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        ),
        TelemetryGasModel(
            mine_site_id=mine_gdk11a.id,
            station_id="STATION-GDK-L2",
            station_code="STATION-GDK-L2-SEAM3",
            location_name="Return Airway Gallery #4",
            ch4_percentage=0.42,
            co_ppm=14.5,
            o2_percentage=20.7,
            air_velocity_ms=2.2,
            temperature_celsius=28.1,
            status="APPROVED",
            record_hash="4f8e91a27b3c456890d9124e5fa67b8ca59201948baef0129bcfe9182390192a",
        ),
        TelemetryGasModel(
            mine_site_id=mine_gdk11a.id,
            station_id="STATION-GDK-L3",
            station_code="STATION-GDK-L3-VENTILATION",
            location_name="Working Longwall Face 3A Heading",
            ch4_percentage=0.68,
            co_ppm=22.0,
            o2_percentage=20.4,
            air_velocity_ms=1.8,
            temperature_celsius=29.8,
            status="COMMITTED",
            record_hash="7b92f441c0e3a890d9841289cf3011aa5019284baef0129bcfe9182390192b0c",
        ),
    ]
    for t_log in telemetry_logs:
        await t_log.insert()

    # ─────────────────────────────────────────────────────────────────────────
    # 10. MINE CASTS & EXTRACTION LOGS (RG-OCP3 & KOCP)
    # ─────────────────────────────────────────────────────────────────────────
    cast_logs = [
        MineCastExtractionModel(
            mine_site_id=mine_rg_ocp3.id,
            bench_id="BENCH-OCP-B1",
            bench_name="Top Seam Overburden Bench (East Flank)",
            shift="MORNING",
            cast_date=now_date,
            extraction_tonnage=2150.0,
            target_quota_tonnage=2000.0,
            dumper_trips_count=72,
            blasting_clearance_status="CLEARED",
            explosives_used_kg=450.0,
            clearance_engineer_name="Er. K. Venkat Rao (Blasting In-Charge)",
            status="COMMITTED",
            record_hash="9182aefb4c8996fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1",
        ),
        MineCastExtractionModel(
            mine_site_id=mine_rg_ocp3.id,
            bench_id="BENCH-OCP-B2",
            bench_name="Main Coal Seam IV Working Face",
            shift="MORNING",
            cast_date=now_date,
            extraction_tonnage=1820.0,
            target_quota_tonnage=1800.0,
            dumper_trips_count=58,
            blasting_clearance_status="CLEARED",
            explosives_used_kg=320.0,
            clearance_engineer_name="Ch. Srinivas (Colliery Manager)",
            status="COMMITTED",
            record_hash="3ca91024e5fa67b8ca59201948baef0129bcfe9182390192a4f8e91a27b3c456",
        ),
    ]
    for c_log in cast_logs:
        await c_log.insert()

    logger.info("Telangana SCCL Mines database seeding completed successfully!")
    return {
        "status": "success",
        "tenants": 6,
        "mines": 4,
        "stations": 3,
        "users": len(demo_users),
        "rules": 2,
    }
