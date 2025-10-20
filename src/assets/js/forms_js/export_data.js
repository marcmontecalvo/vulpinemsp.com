(function () {
    var VC = window.VC = window.VC || {};

    function tally(d) {
        var counts = { yes: 0, no: 0, needs: 0, na: 0, unknown: 0 };
        for (var i = 0; i < d.sections.length; i++) {
            var sec = d.sections[i];
            for (var j = 0; j < sec.items.length; j++) {
                var v = String(sec.items[j].status || "").toLowerCase();
                if (counts.hasOwnProperty(v)) counts[v]++;
            }
        }
        var denom = counts.yes + counts.no + counts.needs;
        var score = denom ? Math.round((counts.yes / denom) * 100) : 0;
        return { counts: counts, score: score };
    }

    function buildCanonical() {
        if (!VC.validate()) return null;
        var raw = VC.harvest();

        // Clean fields
        for (var i = 0; i < raw.sections.length; i++) {
            var sec = raw.sections[i];
            for (var j = 0; j < sec.items.length; j++) {
                var it = sec.items[j];
                if (it.frequency === "") it.frequency = null;
                if (!Array.isArray(it.evidence_type)) it.evidence_type = [];
                if (!Array.isArray(it.joint_roles)) it.joint_roles = [];
                if (!Array.isArray(it.attachments)) it.attachments = [];
            }
        }

        var t = tally(raw);
        var out = {
            schema: "v1",
            template: {
                id: VC.state.currentFile || "",
                name: raw.title || "",
                version: new Date().toISOString().slice(0, 10)
            },
            client: { id: "", name: raw.client || "" },
            session: {
                mode: VC.state.view || "tech",
                submitted_by: raw.reviewer || "",
                submitted_at: new Date().toISOString(),
                source_url: location.href,
                viewer_role: ""
            },
            summary: { totals: t.counts, score_pct: t.score, top_gaps: [] },
            sections: raw.sections,
            ui: { group_by: "section" },
            generated_at: raw.generated_at || new Date().toISOString(),
            description: raw.description || ""
        };
        return out;
    }

    function exportJSON() {
        var d = buildCanonical(); if (!d) return;
        VC.downloadBlob(
            new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }),
            VC.safeName(d.template.name || d.title || "checklist") + "_" + (d.generated_at || "").slice(0, 10) + "_report.json"
        );
    }

    VC.onReady(function () {
        if (VC.els.btnJSON) VC.els.btnJSON.addEventListener("click", exportJSON);
    });
})();
