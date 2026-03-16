# Security Guard Management Vertical — ERPNext v1.0

A complete ERPNext customization package for security guard companies (South Africa / PSIRA compliant).

## File Structure

```
security_vertical/
├── doctypes/
│   ├── site_location.json       ← New DocType: client site
│   └── incident_report.json     ← New DocType: daily ops record
├── customizations/
│   ├── custom_fields.json       ← Extends Customer + Employee
│   └── breach_notification.json ← Email alert on Breach incidents
├── client_scripts/
│   └── incident_report.js       ← Site filter + Breach UX logic
├── fixtures/
│   └── seed_demo_data.py        ← 2 customers, 5 guards, 3 sites, 5 incidents
├── setup.sh                     ← One-shot install script
└── README.md
```

---

## Quick Start

```bash
# From your frappe-bench directory:
chmod +x security_vertical/setup.sh
./security_vertical/setup.sh your.site.name
```

Or step-by-step:

```bash
# 1. Create and install the app
bench make-app security_vertical
bench --site your.site install-app security_vertical

# 2. Migrate
bench --site your.site migrate

# 3. Seed demo data
bench --site your.site execute security_vertical.fixtures.seed_demo_data.run

# 4. Restart
bench restart
```

---

## DocTypes

### Site Location

Represents a physical client site. Links a Customer to a named address and assigns a supervising Employee.

| Field | Type | Notes |
|---|---|---|
| `location_name` | Data | Mandatory, used as document name |
| `customer` | Link → Customer | |
| `address` | Small Text | |
| `site_supervisor` | Link → Employee | |
| `emergency_contact` | Data | Phone number |

### Incident Report

The core daily operations record. Auto-numbered (`INC-.YYYY.-.#####`).

| Field | Type | Notes |
|---|---|---|
| `date_time` | Datetime | Defaults to now |
| `incident_type` | Select | Theft / Fire / Breach / Medical / Routine |
| `site` | Link → Site Location | |
| `reporting_guard` | Link → Employee | |
| `description` | Text Editor | |
| `action_taken` | Small Text | |
| `attachments` | Attach Image | Evidence photos |

---

## Custom Fields Added

### Customer

| Field | Type |
|---|---|
| `contract_start_date` | Date |
| `contract_end_date` | Date |
| `service_level_agreement` | Attach (file) |

### Employee (Guard)

| Field | Type | Notes |
|---|---|---|
| `psira_number` | Data | PSIRA Registration Number |
| `weapon_competency` | Check | Boolean checkbox |
| `uniform_size` | Select | XS / S / M / L / XL / XXL / XXXL |

---

## Client Script Behaviour (`incident_report.js`)

1. **Site filter** — When a site is selected, its linked Customer is fetched and shown as an info banner.
2. **Guard filter** — Reporting Guard dropdown is restricted to `status = Active` employees.
3. **Breach UX** — Selecting "Breach" shows a red alert banner and pre-fills `action_taken` with a default response template.
4. **Saved Breach docs** — Re-opening a Breach incident shows a red supervisor-reminder banner.

---

## Breach Notification

A Notification rule fires on new Breach incidents, emailing the site supervisor with:

- Site name and timestamp
- Guard who reported it
- Description and action taken
- Direct link to the Incident Report in ERPNext

Configure the supervisor's email via the linked Employee record.

---

## Dashboard Widgets (Manual Setup in ERPNext)

| Widget | Chart Type | Source |
|---|---|---|
| Incidents by Site (This Month) | Bar | Incident Report → count by site |
| Incidents by Type | Donut | Incident Report → count by incident_type |
| Active Guards on Shift | Count Card | Employee → filter status=Active |
| Contracts Expiring (90 days) | List | Customer → contract_end_date ≤ today+90 |

---

## Demo Checklist

- [ ] Open Site Locations — 3 sites visible, linked to 2 customers
- [ ] Open Employees — PSIRA numbers visible on guard records
- [ ] Create new Incident Report → select site → observe customer banner
- [ ] Set type to Breach → observe red alert + auto-filled action
- [ ] Check inbox → supervisor should receive breach email
- [ ] Open Reports → Incidents by Site bar chart
