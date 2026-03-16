// Client Script: Incident Report (Form)
// Security Guard Management Vertical v1.0
//
// Behaviours:
//   1. Site filter  — customer info banner when a site is selected
//   2. Guard filter — restrict Reporting Guard to Active employees
//   3. Breach UX    — red alert banner + pre-fill action_taken on "Breach" selection
//   4. Saved Breach — persistent supervisor-reminder banner when re-opening a saved Breach doc

frappe.ui.form.on("Incident Report", {

  // ── SETUP ──────────────────────────────────────────────────────────────────
  // Runs once when the form is first instantiated.

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

  // ── REFRESH ────────────────────────────────────────────────────────────────
  // Runs on every form load and after saves.

  refresh(frm) {
    // 4. Saved Breach reminder: re-opening a saved Breach shows a permanent
    //    red supervisor-action banner.
    if (!frm.is_new() && frm.doc.incident_type === "Breach") {
      frm.dashboard.add_comment(
        "⚠️ BREACH INCIDENT — Ensure the site supervisor has been notified " +
          "and an email alert has been dispatched. Escalate to management if unresolved.",
        "red",
        true
      );
    }

    // Re-render the customer info banner if a site is already set on load.
    if (frm.doc.site) {
      _show_site_banner(frm, frm.doc.site);
    }
  },

  // ── FIELD CHANGE HANDLERS ─────────────────────────────────────────────────

  // 1. Site filter: fetch linked Customer and display an info banner.
  site(frm) {
    if (frm.doc.site) {
      _show_site_banner(frm, frm.doc.site);
    } else {
      frm.dashboard.clear_headline();
    }
  },

  // 3. Breach UX: show red alert banner + pre-fill action_taken template.
  incident_type(frm) {
    if (frm.doc.incident_type === "Breach") {
      // Prominent red dashboard comment (persistent within the session).
      frm.dashboard.add_comment(
        "🚨 BREACH PROTOCOL ACTIVATED — Follow SOP: " +
          "1) Secure the perimeter. " +
          "2) Contact site supervisor immediately. " +
          "3) Preserve evidence. " +
          "4) Do NOT allow unauthorized access until authorities arrive.",
        "red",
        true
      );

      // Floating red toast alert.
      frappe.show_alert(
        {
          message: __(
            "BREACH selected — supervisor will be emailed on save."
          ),
          indicator: "red",
        },
        8
      );

      // Pre-fill action_taken only when the field is currently empty.
      if (!frm.doc.action_taken) {
        frappe.model.set_value(
          frm.doctype,
          frm.docname,
          "action_taken",
          "1. Perimeter secured.\n" +
            "2. Site supervisor contacted at [TIME].\n" +
            "3. Authorities notified: Yes / No.\n" +
            "4. Personnel on site documented.\n" +
            "5. Evidence preserved: Yes / No.\n" +
            "6. Area access restricted: Yes / No."
        );
      }
    } else {
      // Clear breach banners if user changes incident type away from Breach.
      frm.dashboard.clear_comments();
    }
  },
});

// ── HELPERS ───────────────────────────────────────────────────────────────────

/**
 * Fetch the Site Location document and render an info banner showing
 * the linked customer, supervisor and emergency contact.
 *
 * @param {Object} frm  - ERPNext form object
 * @param {string} site - Site Location name
 */
function _show_site_banner(frm, site) {
  frappe.db
    .get_doc("Site Location", site)
    .then(function (site_doc) {
      if (site_doc && site_doc.customer) {
        frm.dashboard.set_headline(
          `<span class="indicator blue"></span>` +
            `<strong>Client:</strong> ${site_doc.customer} &nbsp;|&nbsp;` +
            `<strong>Supervisor:</strong> ${site_doc.site_supervisor || "Not assigned"} &nbsp;|&nbsp;` +
            `<strong>Emergency Contact:</strong> ${site_doc.emergency_contact || "N/A"}`
        );
      }
    })
    .catch(function () {
      // Silently fail — the banner is non-critical UX.
    });
}
