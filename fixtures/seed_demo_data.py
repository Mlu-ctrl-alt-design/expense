"""
Seed demo data for the Security Guard Management Vertical.

Usage (from your frappe-bench directory):
    bench --site your.site.name execute security_vertical.fixtures.seed_demo_data.run

Creates (idempotent — skips records that already exist):
  - 2 Customers
  - 5 Employees (security guards)
  - 3 Site Locations
  - 5 Incident Reports
"""

import frappe
from frappe.utils import now_datetime, add_days, today


def run():
    frappe.flags.ignore_permissions = True

    _create_customers()
    _create_guards()
    _create_sites()
    _create_incidents()

    frappe.db.commit()
    print("✅  Demo data seeded successfully.")


# ── Customers ─────────────────────────────────────────────────────────────────

def _create_customers():
    customers = [
        {
            "customer_name": "SecureZone Properties",
            "customer_type": "Company",
            "customer_group": "Commercial",
            "territory": "South Africa",
            "contract_start_date": "2024-01-01",
            "contract_end_date": "2025-12-31",
        },
        {
            "customer_name": "Goldfields Mining Ltd",
            "customer_type": "Company",
            "customer_group": "Commercial",
            "territory": "South Africa",
            "contract_start_date": "2023-06-01",
            "contract_end_date": "2025-05-31",
        },
    ]

    for data in customers:
        if frappe.db.exists("Customer", data["customer_name"]):
            print(f"  · Customer '{data['customer_name']}' already exists — skipping.")
            continue
        doc = frappe.get_doc({"doctype": "Customer", **data})
        doc.insert(ignore_permissions=True)
        print(f"  + Created Customer: {data['customer_name']}")


# ── Guards (Employees) ────────────────────────────────────────────────────────

def _create_guards():
    guards = [
        {
            "first_name": "John",
            "last_name": "Dlamini",
            "employee_name": "John Dlamini",
            "gender": "Male",
            "date_of_joining": "2022-03-15",
            "status": "Active",
            "designation": "Security Guard",
            "psira_number": "PSR-001",
            "weapon_competency": 1,
            "uniform_size": "L",
        },
        {
            "first_name": "Sipho",
            "last_name": "Mokoena",
            "employee_name": "Sipho Mokoena",
            "gender": "Male",
            "date_of_joining": "2022-07-01",
            "status": "Active",
            "designation": "Security Guard",
            "psira_number": "PSR-002",
            "weapon_competency": 0,
            "uniform_size": "M",
        },
        {
            "first_name": "Thandi",
            "last_name": "Khumalo",
            "employee_name": "Thandi Khumalo",
            "gender": "Female",
            "date_of_joining": "2021-11-20",
            "status": "Active",
            "designation": "Senior Security Guard",
            "psira_number": "PSR-003",
            "weapon_competency": 1,
            "uniform_size": "S",
        },
        {
            "first_name": "Bongani",
            "last_name": "Nkosi",
            "employee_name": "Bongani Nkosi",
            "gender": "Male",
            "date_of_joining": "2020-05-10",
            "status": "Active",
            "designation": "Site Supervisor",
            "psira_number": "PSR-004",
            "weapon_competency": 1,
            "uniform_size": "XL",
        },
        {
            "first_name": "Zanele",
            "last_name": "Dube",
            "employee_name": "Zanele Dube",
            "gender": "Female",
            "date_of_joining": "2023-02-01",
            "status": "Active",
            "designation": "Security Guard",
            "psira_number": "PSR-005",
            "weapon_competency": 0,
            "uniform_size": "M",
        },
    ]

    for data in guards:
        if frappe.db.exists("Employee", {"employee_name": data["employee_name"]}):
            print(f"  · Employee '{data['employee_name']}' already exists — skipping.")
            continue
        doc = frappe.get_doc({"doctype": "Employee", **data})
        doc.insert(ignore_permissions=True)
        print(f"  + Created Employee: {data['employee_name']} (PSIRA: {data['psira_number']})")


# ── Site Locations ────────────────────────────────────────────────────────────

def _get_employee_name(employee_name):
    """Return the Employee document name (ID) for the given employee_name value."""
    return frappe.db.get_value("Employee", {"employee_name": employee_name}, "name")


def _create_sites():
    sites = [
        {
            "location_name": "Sandton Office Park",
            "customer": "SecureZone Properties",
            "address": "123 Sandton Drive, Sandton, Johannesburg, 2196",
            "site_supervisor_name": "John Dlamini",
            "emergency_contact": "+27 11 000 0001",
        },
        {
            "location_name": "Goldfields Shaft No.3",
            "customer": "Goldfields Mining Ltd",
            "address": "Shaft Road, Carletonville, Gauteng, 2500",
            "site_supervisor_name": "Bongani Nkosi",
            "emergency_contact": "+27 18 000 0002",
        },
        {
            "location_name": "Rosebank Mall Entrance",
            "customer": "SecureZone Properties",
            "address": "50 Bath Ave, Rosebank, Johannesburg, 2196",
            "site_supervisor_name": "Thandi Khumalo",
            "emergency_contact": "+27 11 000 0003",
        },
    ]

    for data in sites:
        if frappe.db.exists("Site Location", data["location_name"]):
            print(f"  · Site '{data['location_name']}' already exists — skipping.")
            continue

        supervisor_id = _get_employee_name(data.pop("site_supervisor_name"))
        doc = frappe.get_doc({
            "doctype": "Site Location",
            "site_supervisor": supervisor_id,
            **data,
        })
        doc.insert(ignore_permissions=True)
        print(f"  + Created Site: {doc.location_name}")


# ── Incident Reports ──────────────────────────────────────────────────────────

def _get_guard_id(employee_name):
    return frappe.db.get_value("Employee", {"employee_name": employee_name}, "name")


def _create_incidents():
    incidents = [
        {
            "date_time": add_days(now_datetime(), -1),
            "incident_type": "Routine",
            "site": "Sandton Office Park",
            "reporting_guard_name": "Sipho Mokoena",
            "description": "Standard overnight patrol completed. All access points secure.",
            "action_taken": "Patrol log signed. No anomalies found.",
        },
        {
            "date_time": add_days(now_datetime(), -3),
            "incident_type": "Fire",
            "site": "Goldfields Shaft No.3",
            "reporting_guard_name": "Bongani Nkosi",
            "description": "Fire alarm triggered in generator room. Smoke detected from electrical panel.",
            "action_taken": "Fire suppression activated. Electrical team notified. Emergency services called. Area evacuated.",
        },
        {
            "date_time": add_days(now_datetime(), -2),
            "incident_type": "Breach",
            "site": "Rosebank Mall Entrance",
            "reporting_guard_name": "Thandi Khumalo",
            "description": "Unauthorised individual gained access via staff entrance using a cloned access card. Individual apprehended in corridor B.",
            "action_taken": "Supervisor notified. Site secured. Authorities contacted if required.",
        },
        {
            "date_time": add_days(now_datetime(), -5),
            "incident_type": "Medical",
            "site": "Sandton Office Park",
            "reporting_guard_name": "John Dlamini",
            "description": "Visitor collapsed near reception area. Possible cardiac event.",
            "action_taken": "First aid administered. Emergency services (10177) contacted. Paramedics arrived within 8 minutes.",
        },
        {
            "date_time": add_days(now_datetime(), -7),
            "incident_type": "Theft",
            "site": "Goldfields Shaft No.3",
            "reporting_guard_name": "Zanele Dube",
            "description": "Mining equipment reported missing from storage yard. CCTV footage under review.",
            "action_taken": "SAPS case number obtained (CAS 123/01/2025). Management and HR notified. Equipment list documented.",
        },
    ]

    for data in incidents:
        guard_id = _get_guard_id(data.pop("reporting_guard_name"))
        doc = frappe.get_doc({
            "doctype": "Incident Report",
            "reporting_guard": guard_id,
            **data,
        })
        doc.insert(ignore_permissions=True)
        print(f"  + Created Incident Report: {doc.name} ({doc.incident_type} @ {doc.site})")
