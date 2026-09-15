from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

from .database import SessionLocal, engine
from .models import Asset, Base, Incident, MaintenancePlan, SensorReading, WeatherData
from .services.risk_engine import run_all_predictions


def seed_database(db: Session = None):
    """Populates the database with 20 grid assets (TX-101 to TX-120), 30 days of hourly sensor readings,
    multi-zone weather profiles, 12 scripted grid incidents, and maintenance work orders."""
    owns_session = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        owns_session = True

    try:
        if db.query(Asset).first() is not None:
            print("Database already contains assets. Skipping initial seed.")
            return

        print("Seeding GridWatch database...")

        # -------------------------------------------------------------------
        # 1. Assets Definition (TX-101 through TX-120)
        # -------------------------------------------------------------------
        zones = ["North", "South", "East", "West", "Central"]
        asset_types = ["Substation Transformer", "Step-Up Transformer", "Autotransformer", "Distribution Transformer"]

        base_lat, base_lon = 32.7767, -96.7970  # Texas Grid Center coordinates
        now = datetime.utcnow()

        assets_data = []
        for i in range(1, 21):
            asset_id = f"TX-{100 + i}"
            zone = zones[(i - 1) % len(zones)]
            atype = asset_types[(i - 1) % len(asset_types)]

            # Specific high-risk assets
            if asset_id == "TX-114":
                status = "Critical"
                install_date = now - timedelta(days=365 * 14)
                capacity = 100.0
                name = "North Sector Primary Step-Down Substation"
                zone = "North"
            elif asset_id == "TX-107":
                status = "Degraded"
                install_date = now - timedelta(days=365 * 11)
                capacity = 150.0
                name = "South Industrial Step-Up Transformer"
                zone = "South"
            elif asset_id == "TX-119":
                status = "Degraded"
                install_date = now - timedelta(days=365 * 9)
                capacity = 75.0
                name = "West Feeder Bulk Power Transformer"
                zone = "West"
            else:
                status = "Operational"
                install_date = now - timedelta(days=365 * random.randint(2, 8))
                capacity = random.choice([50.0, 75.0, 100.0, 120.0, 160.0])
                name = f"{zone} Sector {atype} #{i}"

            lat = base_lat + (random.uniform(-0.85, 0.85))
            lon = base_lon + (random.uniform(-0.85, 0.85))

            asset = Asset(
                asset_id=asset_id,
                name=name,
                asset_type=atype,
                latitude=round(lat, 5),
                longitude=round(lon, 5),
                zone=zone,
                installation_date=install_date,
                rated_capacity_mva=capacity,
                status=status,
                created_at=now - timedelta(days=30),
            )
            assets_data.append(asset)
            db.add(asset)

        db.commit()

        # -------------------------------------------------------------------
        # 2. Weather Observations (30 Days across 5 zones)
        # -------------------------------------------------------------------
        weather_objects = []
        # Sample points every 3 hours over 30 days = 240 records per zone
        for zone in zones:
            is_stormy = (zone == "West")
            is_heatwave = (zone == "North")

            for hour_step in range(0, 30 * 24, 4):
                ts = (now - timedelta(days=30)) + timedelta(hours=hour_step)
                ambient = 37.0 + random.uniform(0.0, 4.0) if is_heatwave else 24.0 + random.uniform(-4.0, 8.0)
                wind = 55.0 + random.uniform(5.0, 25.0) if is_stormy else 14.0 + random.uniform(-5.0, 10.0)
                precip = 28.0 + random.uniform(2.0, 18.0) if is_stormy else 0.0
                storm = is_stormy and (hour_step > (25 * 24))

                w = WeatherData(
                    zone=zone,
                    timestamp=ts,
                    ambient_temp_c=round(ambient, 1),
                    humidity_pct=round(random.uniform(35.0, 85.0), 1),
                    wind_speed_kmh=round(wind, 1),
                    precipitation_mm=round(precip, 1),
                    solar_irradiance_wm2=round(random.uniform(150.0, 950.0), 1),
                    storm_alert=storm,
                )
                weather_objects.append(w)

        db.bulk_save_objects(weather_objects)
        db.commit()

        # -------------------------------------------------------------------
        # 3. Sensor Telemetry (30 Days Timeseries for all 20 assets)
        # -------------------------------------------------------------------
        readings_objects = []
        # Sample every 4 hours over 30 days = 180 telemetry points per asset * 20 = 3600 points
        for i in range(1, 21):
            asset_id = f"TX-{100 + i}"
            for hour_step in range(0, 30 * 24, 4):
                ts = (now - timedelta(days=30)) + timedelta(hours=hour_step)

                # Tailored profiles
                if asset_id == "TX-114":
                    # Severe thermal distress, heavy overloading
                    load = min(98.5, 82.0 + (hour_step / (30 * 24)) * 16.0 + random.uniform(-2.0, 3.0))
                    oil_temp = min(106.0, 88.0 + (hour_step / (30 * 24)) * 15.0 + random.uniform(-1.0, 2.5))
                    temp_c = oil_temp + 6.0
                    vibration = 4.2 + random.uniform(-0.3, 0.6)
                    volt = 135.2 + random.uniform(-1.5, 1.5)
                    pf = 0.88 + random.uniform(-0.03, 0.02)
                elif asset_id == "TX-107":
                    # Mechanical vibration distress & medium-high temperature
                    load = 84.0 + random.uniform(-4.0, 5.0)
                    oil_temp = 83.0 + random.uniform(-2.0, 3.0)
                    temp_c = oil_temp + 4.0
                    vibration = min(8.2, 5.5 + (hour_step / (30 * 24)) * 2.2 + random.uniform(-0.4, 0.5))
                    volt = 137.0 + random.uniform(-2.0, 2.0)
                    pf = 0.90 + random.uniform(-0.02, 0.03)
                elif asset_id == "TX-119":
                    # High winding temperature and electrical voltage fluctuation
                    load = 86.0 + random.uniform(-5.0, 5.0)
                    oil_temp = 81.0 + random.uniform(-3.0, 4.0)
                    temp_c = oil_temp + 5.0
                    vibration = 3.6 + random.uniform(-0.2, 0.4)
                    volt = 143.5 + random.uniform(-3.5, 3.0)  # Voltage surge
                    pf = 0.87 + random.uniform(-0.04, 0.02)
                else:
                    # Nominal or slight wear
                    load = random.uniform(45.0, 72.0)
                    oil_temp = random.uniform(55.0, 68.0)
                    temp_c = oil_temp + 3.0
                    vibration = random.uniform(1.8, 2.6)
                    volt = 138.0 + random.uniform(-1.8, 1.8)
                    pf = random.uniform(0.95, 0.99)

                current = (load / 100.0) * 450.0

                r = SensorReading(
                    asset_id=asset_id,
                    timestamp=ts,
                    voltage_kv=round(volt, 2),
                    current_a=round(current, 2),
                    temperature_c=round(temp_c, 2),
                    vibration_hz=round(vibration, 2),
                    power_factor=round(pf, 3),
                    oil_temp_c=round(oil_temp, 2),
                    load_pct=round(load, 2),
                )
                readings_objects.append(r)

        db.bulk_save_objects(readings_objects)
        db.commit()

        # -------------------------------------------------------------------
        # 4. 12 Scripted Grid Incidents
        # -------------------------------------------------------------------
        incidents_data = [
            Incident(
                incident_id="INC-2024-001",
                asset_id="TX-114",
                timestamp=now - timedelta(hours=14),
                severity="Critical",
                incident_type="Thermal Runaway & Oil Degassing",
                description="Top oil temperature exceeded 102°C under sustained 94% load. Buchholz relay detected minor combustible gas accumulation.",
                status="Open",
            ),
            Incident(
                incident_id="INC-2024-002",
                asset_id="TX-114",
                timestamp=now - timedelta(days=2),
                severity="High",
                incident_type="Bushing Partial Discharge Anomaly",
                description="HFCT acoustic sensors detected persistent partial discharge on 138kV H1 bushing.",
                status="Investigating",
            ),
            Incident(
                incident_id="INC-2024-003",
                asset_id="TX-107",
                timestamp=now - timedelta(hours=18),
                severity="High",
                incident_type="Core Vibration Exceedance",
                description="Core vibration sensor crossed 7.2 Hz baseline threshold, indicating mechanical core clamping looseness.",
                status="Investigating",
            ),
            Incident(
                incident_id="INC-2024-004",
                asset_id="TX-107",
                timestamp=now - timedelta(days=4),
                severity="Medium",
                incident_type="Cooling Fan Relay Failure",
                description="Auxiliary radiator fan bank #2 contactor tripped, reducing forced-air cooling capacity by 33%.",
                status="Open",
            ),
            Incident(
                incident_id="INC-2024-005",
                asset_id="TX-119",
                timestamp=now - timedelta(hours=8),
                severity="High",
                incident_type="Lightning Surge Arrester Operation",
                description="Station arrester registered 25kA lightning discharge; primary surge counters advanced by 3 operations.",
                status="Open",
            ),
            Incident(
                incident_id="INC-2024-006",
                asset_id="TX-119",
                timestamp=now - timedelta(days=5),
                severity="Medium",
                incident_type="Secondary Voltage Phase Imbalance",
                description="3.8% phase-to-phase voltage imbalance observed during evening industrial peak.",
                status="Investigating",
            ),
            Incident(
                incident_id="INC-2024-007",
                asset_id="TX-103",
                timestamp=now - timedelta(days=12),
                severity="Medium",
                incident_type="Tap Changer Motor Stiction",
                description="On-load tap changer mechanism delayed step change due to drive linkage friction.",
                status="Resolved",
                resolved_at=now - timedelta(days=11),
            ),
            Incident(
                incident_id="INC-2024-008",
                asset_id="TX-105",
                timestamp=now - timedelta(days=15),
                severity="Low",
                incident_type="Silica Gel Breather Saturation",
                description="Conservator dehumidifying breather desiccant turned pink, indicating 80% moisture saturation.",
                status="Resolved",
                resolved_at=now - timedelta(days=14),
            ),
            Incident(
                incident_id="INC-2024-009",
                asset_id="TX-108",
                timestamp=now - timedelta(days=3),
                severity="High",
                incident_type="Localized Hotspot Detected by DGA",
                description="Dissolved gas analysis indicated elevated ethylene and methane consistent with thermal fault >300°C.",
                status="Investigating",
            ),
            Incident(
                incident_id="INC-2024-010",
                asset_id="TX-112",
                timestamp=now - timedelta(days=20),
                severity="Low",
                incident_type="Radiator Flange Seepage",
                description="Minor dielectric fluid seep at upper radiator isolation valve gasket.",
                status="Resolved",
                resolved_at=now - timedelta(days=19),
            ),
            Incident(
                incident_id="INC-2024-011",
                asset_id="TX-116",
                timestamp=now - timedelta(days=7),
                severity="Medium",
                incident_type="Transient Overvoltage Spike",
                description="Grid feeder capacitor bank switching caused transient 1.25 p.u. voltage overshoot.",
                status="Resolved",
                resolved_at=now - timedelta(days=6),
            ),
            Incident(
                incident_id="INC-2024-012",
                asset_id="TX-120",
                timestamp=now - timedelta(days=25),
                severity="Low",
                incident_type="SCADA RTU Polling Timeout",
                description="Modbus TCP telemetry communication packet drop lasted 180 seconds before automatic retry.",
                status="Resolved",
                resolved_at=now - timedelta(days=25),
            ),
        ]
        db.add_all(incidents_data)
        db.commit()

        # -------------------------------------------------------------------
        # 5. Maintenance Plans for TX-114, TX-107, TX-119
        # -------------------------------------------------------------------
        maintenance_plans = [
            MaintenancePlan(
                plan_id="MP-TX114-01",
                asset_id="TX-114",
                scheduled_date=now + timedelta(hours=2),
                crew_id="CREW-RAPID-01",
                priority="Immediate",
                estimated_duration_hours=6.0,
                description="Emergency mobile degasifier deployment, infrared thermography, and forced load-curtailment verification.",
                parts_required="Vacuum dehydration kit, H1 bushing gasket assembly, 500L mineral oil replacement",
                status="In Progress",
            ),
            MaintenancePlan(
                plan_id="MP-TX107-02",
                asset_id="TX-107",
                scheduled_date=now + timedelta(hours=26),
                crew_id="CREW-FIELD-04",
                priority="Urgent",
                estimated_duration_hours=4.5,
                description="Core clamp re-torquing, vibration damper replacement, and auxiliary fan relay box rebuild.",
                parts_required="Dynamic elastomeric dampers, 40A solid-state contactors, torque calibration set",
                status="Pending",
            ),
            MaintenancePlan(
                plan_id="MP-TX119-03",
                asset_id="TX-119",
                scheduled_date=now + timedelta(hours=48),
                crew_id="CREW-ELEC-02",
                priority="Urgent",
                estimated_duration_hours=5.0,
                description="Surge arrester replacement, secondary bushing insulation resistance test, and Doble power factor testing.",
                parts_required="138kV Station Class MOV Surge Arrester, Megger test leads",
                status="Pending",
            ),
        ]
        db.add_all(maintenance_plans)
        db.commit()

        # -------------------------------------------------------------------
        # 6. Execute Baseline Risk Engine Predictions for all Assets
        # -------------------------------------------------------------------
        print("Computing initial predictive risk matrices...")
        run_all_predictions(db)
        print("GridWatch seed completed successfully: 20 assets, 3600 telemetry points, 12 incidents, 3 work orders.")

    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":
    seed_database()
