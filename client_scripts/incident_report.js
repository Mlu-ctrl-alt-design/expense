// Client Script: Incident Report
// Handles site filtering, guard filtering, Breach UX banners, and saved-Breach reminders.

frappe.ui.form.on("Incident Report", {
  // ── Setup ──────────────────────────────────────────────────────────────────

  setup(frm) {
    // 2. Guard filter: restrict Reporting Guard to Active employees only.
    frm.set_query("reporting_guard", function () {
      return {
        filters: {
          status: "Active",
        },
      };
    });
  },

  // ── On load / refresh ─────────────────────────────────────────────────────

  refresh(frm) {
    // 4. Saved Breach reminder: re-opening a saved Breach shows a persistent
    //    red supervisor-action banner.
    if (!frm.is_new() && frm.doc.incident_type === "Breach") {
      frm.dashboard.set_headline_alert(
        `<div style="color:#c0392b; font-weight:bold;">
          &#9888; BREACH — Supervisor action required. Ensure this incident
          has been escalated and documented with authorities if applicable.
        </div>`,
        "red"
      );
    }

    // Re-render the customer info banner if a site is already set.
    if (frm.doc.site) {
      _show_customer_banner(frm, frm.doc.site);
    }
  },

  // ── Field change handlers ──────────────────────────────────────────────────

  // 1. Site filter: fetch linked Customer and display an info banner.
  site(frm) {
    if (frm.doc.site) {
      _show_customer_banner(frm, frm.doc.site);
    } else {
      frm.dashboard.clear_headline();
    }
  },

  // 3. Breach UX: show red alert + pre-fill action_taken template.
  incident_type(frm) {
    if (frm.doc.incident_type === "Breach") {
      frappe.show_alert(
        {
          message: __("BREACH selected — supervisor notification will be sent on save."),
          indicator: "red",
        },
        8
      );

      // Red inline banner on the form dashboard.
      frm.dashboard.set_headline_alert(
        `<div style="color:#c0392b; font-weight:bold;">
          &#9888; BREACH INCIDENT — Please complete all fields and save immediately.
          The site supervisor will be notified by email.
        </div>`,
        "red"
      );

      // Pre-fill action_taken only when empty to avoid overwriting existing content.
      if (!frm.doc.action_taken) {
        frm.set_value(
          "action_taken",
          "Supervisor notified. Site secured. Authorities contacted if required."
        );
      }
    } else {
      frm.dashboard.clear_headline();
    }
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch the Customer linked to the selected Site Location and render
 * an informational banner at the top of the form.
 *
 * @param {Object} frm   - The current form object.
 * @param {string} site  - The selected Site Location name.
 */
function _show_customer_banner(frm, site) {
  frappe.db.get_value("Site Location", site, "customer", function (data) {
    if (data && data.customer) {
      frm.dashboard.set_headline_alert(
        `<div style="color:#1a5276;">
          <strong>Client:</strong> ${data.customer}
        </div>`,
        "blue"
      );
    } else {
      frm.dashboard.clear_headline();
    }
  });
}
