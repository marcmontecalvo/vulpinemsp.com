(function () {
    // Global namespace
    var VC = window.VC = window.VC || {};
    VC.state = VC.state || {};
    VC.config = VC.config || {
        ROOT: "/assets/forms/checklists/",
        DEBUG: false,
        ALLOW_ATTACH: true         // show "Attach evidence" buttons
    };

    // --- Debug logging ---
    VC.dlog = function () { if (VC.config.DEBUG && console && console.log) console.log.apply(console, arguments); };
    VC.derr = function () { if (console && console.error) console.error.apply(console, arguments); };
    VC.dwarn = function () { if (console && console.warn) console.warn.apply(console, arguments); };

    // --- Query param: view (client|prospect|tech) ---
    (function () {
        var q = (location.search || "").replace(/^\?/, "").split("&");
        var i, kv, map = {};
        for (i = 0; i < q.length; i++) { kv = q[i].split("="); if (kv[0]) map[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ""); }
        VC.state.view = map.view || "tech";
    })();

    // --- DOM refs ---
    VC.els = {
        type: document.getElementById("checklistSelect"),
        date: document.getElementById("checklistDate"),
        client: document.getElementById("clientName"),
        reviewer: document.getElementById("reviewerName"),
        container: document.getElementById("checklistContainer"),
        toggleCitations: document.getElementById("toggleCitations"),
        // toolbar buttons
        btnRESET: document.getElementById("resetFormBtn"),
        btnFILL: document.getElementById("fillBtn"),
        btnPDF: document.getElementById("exportPdfBtn"),
        btnJSON: document.getElementById("exportJsonBtn"),
        btnTXT: document.getElementById("exportTxtBtn") // unused now, ok if null
    };

    // --- Tiny util helpers ---
    VC.el = function (tag, className, text) {
        var e = document.createElement(tag);
        if (className) e.className = className;
        if (text != null) e.textContent = text;
        return e;
    };

    VC.slug = function (s) {
        return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "section";
    };

    VC.todayISO = function () {
        var d = new Date();
        var m = (d.getMonth() + 1).toString(); if (m.length < 2) m = "0" + m;
        var day = d.getDate().toString(); if (day.length < 2) day = "0" + day;
        return d.getFullYear() + "-" + m + "-" + day;
    };

    VC.safeName = function (s) { return String(s || "").replace(/[^a-z0-9._-]+/gi, "_"); };

    VC.downloadBlob = function (blob, filename) {
        var a = document.createElement("a");
        var url = URL.createObjectURL(blob);
        a.href = url; a.download = filename || "download";
        document.body.appendChild(a); a.click();
        setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
    };

    // --- Status values + styling ---
    VC.STATUS = [
        { v: "", t: "-- select --" },
        { v: "yes", t: "Yes" },
        { v: "no", t: "No" },
        { v: "needs", t: "Needs Work" },
        { v: "na", t: "N/A" },
        { v: "unknown", t: "Unknown" }
    ];

    VC.applyStatusUi = function (sel) {
        if (!sel) return;
        var v = String(sel.value || "").toLowerCase().trim();

        // remove all status classes first
        sel.classList.remove(
            "status-yes",
            "status-no",
            "status-needs",
            "status-na",
            "status-unknown",
            "status-neutral"
        );

        // apply the right one
        switch (v) {
            case "yes": sel.classList.add("status-yes"); break;
            case "no": sel.classList.add("status-no"); break;
            case "needs": sel.classList.add("status-needs"); break;
            case "na": sel.classList.add("status-na"); break;
            case "unknown": sel.classList.add("status-unknown"); break;
            default: sel.classList.add("status-neutral"); break;
        }

        // if a selection is made, clear invalid styling so Bootstrap doesn't override colors
        if (v) sel.classList.remove("is-invalid");
    };

    // --- Evidence vocabulary (simplified/canonical) ---
    VC.EVIDENCE_CANON_MAP = {
        configuration: ['config', 'configuration', 'key_escrow', 'scan'],
        policy: ['policy'],
        procedure: ['workflow', 'process', 'procedure'],
        training: ['training', 'training_record'],
        artifact: ['screenshot', 'report', 'log', 'ticketing_log', 'artifact', 'scan'],
        form: ['form', 'designation_form']
    };

    VC.canonEvidenceKeys = function (arr) {
        var out = {}, i, raw, k, idx = {};
        for (k in VC.EVIDENCE_CANON_MAP) if (Object.prototype.hasOwnProperty.call(VC.EVIDENCE_CANON_MAP, k)) {
            var list = VC.EVIDENCE_CANON_MAP[k]; for (i = 0; i < list.length; i++) idx[list[i]] = k;
        }
        arr = Array.isArray(arr) ? arr : (arr ? [String(arr)] : []);
        for (i = 0; i < arr.length; i++) {
            raw = String(arr[i] || "").toLowerCase().replace(/\s+/g, "_");
            var canon = idx[raw] || raw;
            out[canon] = 1;
        }
        return Object.keys(out);
    };

    VC.evidenceLabel = function (key) {
        var k = String(key || "").toLowerCase();
        var map = {
            configuration: "Configuration",
            policy: "Policy",
            procedure: "Procedure",
            training: "Training",
            artifact: "Artifact",
            form: "Form"
        };
        if (map[k]) return map[k];
        return k.replace(/_/g, " ").replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
    };

    // --- onReady queue ---
    (function () {
        var ready = false, q = [];
        VC.onReady = function (fn) { if (ready) fn(); else q.push(fn); };
        function fire() { if (ready) return; ready = true; for (var i = 0; i < q.length; i++) try { q[i](); } catch (e) { VC.derr(e); } q.length = 0; }
        if (document.readyState !== "loading") fire();
        else document.addEventListener("DOMContentLoaded", fire);
    })();

    // Default date
    VC.onReady(function () {
        if (VC.els.date && !VC.els.date.value) VC.els.date.value = VC.todayISO();
    });

})();
