# Problem Statement

## Background

Electrical power grids are the backbone of modern civilization, delivering energy from generation sources to end consumers across vast transmission and distribution networks. As grids age and face increasing demand from electrification, renewable integration, and extreme weather events, the risk of catastrophic asset failures grows exponentially. Power transformers — critical nodes in the grid — operate under thermal, electrical, and mechanical stress that degrades insulation, core integrity, and cooling systems over time.

## The Problem

Grid operators lack real-time, predictive visibility into the health of individual transformer assets across their network. Current monitoring approaches are:

1. **Reactive** — Maintenance occurs after failure symptoms appear (overheating, dissolved gas anomalies, vibration spikes), not before
2. **Fragmented** — SCADA telemetry, weather data, maintenance logs, and incident records live in separate systems with no unified risk model
3. **Subjective** — Risk assessments depend on engineer experience rather than quantitative, reproducible algorithms
4. **Slow** — Manual analysis of 3,600+ daily sensor readings across 20+ assets is infeasible for dispatch teams

This leads to unplanned outages costing utilities millions per event, cascading failures affecting thousands of customers, and safety risks from catastrophic transformer failures (fire, explosion, environmental contamination).

## Who is Affected

- **Grid Operators / Dispatch Centers** — Responsible for real-time reliability across 5+ grid zones, making load-shedding and crew-dispatch decisions with incomplete information
- **Asset Managers** — Planning capital replacement and maintenance budgets without quantitative health indices
- **Field Crews** — Dispatched reactively to emergencies without prioritized action plans or parts kits
- **Regulators & Ratepayers** — Bear the cost of reliability penalties, emergency repairs, and service interruptions

## Why It Matters

- **Average transformer replacement cost**: $2M–$5M per unit
- **Unplanned outage cost**: $100K–$1M+ per hour for industrial customers
- **Cascading failure risk**: Single transformer failure can trigger regional blackouts
- **Aging infrastructure**: 70% of U.S. transformers are >25 years old (design life 30–40 years)

## Why Existing Solutions Fall Short

- **SCADA/EMS systems** provide raw telemetry but no health scoring or failure prediction
- **DGA (Dissolved Gas Analysis)** is periodic (monthly/quarterly), not real-time
- **Asset management platforms** (Maximo, SAP PM) track work orders but don't compute risk from live sensor data
- **Generic ML platforms** require months of data engineering and domain expertise to deploy

GridWatch AI closes this gap by fusing real-time telemetry, weather, and incident history into a live, quantitative Asset Health Index (AHI) with failure probability, time-to-failure estimates, and prioritized dispatch actions — all computed automatically every 60 seconds.