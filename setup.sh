#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Security Guard Management Vertical — ERPNext v1.0
# One-shot install script.
#
# Usage (from your frappe-bench directory):
#   chmod +x security_vertical/setup.sh
#   ./security_vertical/setup.sh your.site.name
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SITE="${1:?Error: site name required. Usage: ./setup.sh <site-name>}"

echo "========================================"
echo " Security Guard Management Vertical"
echo " Installing on site: $SITE"
echo "========================================"

# 1. Scaffold the Frappe app (skipped if it already exists in apps/)
if [ ! -d "apps/security_vertical" ]; then
  echo ""
  echo "Step 1/5 — Creating Frappe app scaffold..."
  bench make-app security_vertical
else
  echo ""
  echo "Step 1/5 — App scaffold already exists, skipping bench make-app."
fi

# 2. Install the app on the target site
echo ""
echo "Step 2/5 — Installing app on site '$SITE'..."
bench --site "$SITE" install-app security_vertical

# 3. Run database migrations to register the new DocTypes
echo ""
echo "Step 3/5 — Running migrations..."
bench --site "$SITE" migrate

# 4. Seed demo data (2 customers, 5 guards, 3 sites, 5 incidents)
echo ""
echo "Step 4/5 — Seeding demo data..."
bench --site "$SITE" execute security_vertical.fixtures.seed_demo_data.run

# 5. Restart bench workers and web server
echo ""
echo "Step 5/5 — Restarting bench..."
bench restart

echo ""
echo "✅  Installation complete!"
echo ""
echo "Quick-start checklist:"
echo "  [ ] Open Site Locations — 3 sites should be visible"
echo "  [ ] Open Employees — PSIRA numbers visible on guard records"
echo "  [ ] Create a new Incident Report → select a site → check customer banner"
echo "  [ ] Set type to Breach → observe red alert + auto-filled action"
echo "  [ ] Check inbox → supervisor should receive breach email"
