(function () {
    var VC = window.VC = window.VC || {};

    // ------------- fetch -------------
    function fetchJson(url, cb) {
        VC.dlog("fetchJson ->", url);
        fetch(url, { cache: "no-store" })
            .then(function (res) {
                var ctype = (res.headers && res.headers.get("content-type")) || "";
                if (!res.ok) {
                    return res.text().then(function (t) {
                        throw new Error("HTTP " + res.status + " for " + url + " :: " + t.slice(0, 160));
                    });
                }
                // If server returned HTML (common when path is wrong and SPA serves index.html)
                if (ctype.indexOf("application/json") === -1) {
                    return res.text().then(function (t) {
                        if (t && /^\s*</.test(t)) {
                            throw new Error("Non-JSON response for " + url + " (likely HTML). First chars: " + t.slice(0, 160));
                        }
                        // try to parse anyway
                        try { return JSON.parse(t); } catch (e) {
                            throw new Error("Failed to parse JSON for " + url + " :: " + e.message + " :: " + String(t).slice(0, 160));
                        }
                    });
                }
                return res.json();
            })
            .then(function (json) { cb(null, json); })
            .catch(function (err) {
                VC.derr("fetch error", err);
                alert("Failed to load checklist: " + err.message);
                cb(err);
            });
    }

    // ------------- normalize -------------
    function sanitizeItem(it, fallbackId, catId) {
        if (!it || typeof it !== "object") return { id: fallbackId, item: String(it || ""), category_id: catId || "" };
        return {
            id: it.id || fallbackId,
            item: it.item || it.title || it.question || "",
            citation: it.citation || "",
            responsibility: it.responsibility || "",
            joint_roles: Array.isArray(it.joint_roles) ? it.joint_roles : [],
            show_citation: !!it.show_citation,
            report_include: it.report_include !== false,
            evidence_type: Array.isArray(it.evidence_type) ? it.evidence_type : [],
            frequency: it.frequency || "",
            note: it.note || "",
            category_id: it.category_id || catId || ""
        };
    }

    VC.normalize = function (list) {
        VC.state.ui = list && list.ui ? list.ui : {};

        // Legacy: sections[]
        if (list && Array.isArray(list.sections)) {
            var secs = [];
            for (var i = 0; i < list.sections.length; i++) {
                var sec = list.sections[i];
                var cid = VC.slug(sec.title || ("section-" + (i + 1)));
                var items = [];
                var src = sec.items || [];
                for (var j = 0; j < src.length; j++) {
                    var it = src[j];
                    items.push(typeof it === "string" ? { id: VC.slug(sec.title) + "-" + (j + 1), item: it, category_id: cid } : sanitizeItem(it, VC.slug(sec.title) + "-" + (j + 1), cid));
                }
                secs.push({ title: sec.title || "Section", note: sec.note || sec.subtitle || "", items: items, cid: cid });
            }
            return { title: list.title || "Checklist", description: list.description || "", sections: secs };
        }

        // categories + items
        if (list && Array.isArray(list.categories) && Array.isArray(list.items)) {
            var byId = {}; for (var c = 0; c < list.categories.length; c++) byId[list.categories[c].id] = list.categories[c];
            var grouped = {};
            for (var k = 0; k < list.items.length; k++) {
                var itm = list.items[k];
                var cid = itm.category_id || "uncategorized";
                if (!grouped[cid]) grouped[cid] = [];
                grouped[cid].push(sanitizeItem(itm, cid + "-" + Math.random().toString(36).slice(2, 8), cid));
            }
            var outSecs = [];
            for (var key in grouped) {
                if (!grouped.hasOwnProperty(key)) continue;
                outSecs.push({ title: (byId[key] && byId[key].name) ? byId[key].name : "Section", note: "", items: grouped[key], cid: key });
            }
            return { title: list.title || "Checklist", description: list.description || "", sections: outSecs };
        }

        // items only
        var itemsOnly = [], srcItems = (list && list.items) || [];
        for (var m = 0; m < srcItems.length; m++) {
            var cid = "items";
            itemsOnly.push(typeof srcItems[m] === "string" ? { id: "item-" + (m + 1), item: srcItems[m], category_id: cid } : sanitizeItem(srcItems[m], "item-" + (m + 1), cid));
        }
        return { title: (list && list.title) || "Checklist", description: list && list.description || "", sections: [{ title: "Items", items: itemsOnly, cid: "items" }] };
    };

    // ------------- render -------------
    function renderChecklistDescription(desc) {
        var hostId = "vcChecklistDescription";
        var host = document.getElementById(hostId);
        var parent = VC.els.container && VC.els.container.parentNode;
        if (!parent) return;
        if (!host) {
            host = VC.el("div", "mt-3 text-muted", ""); host.id = hostId;
            parent.insertBefore(host, VC.els.container);
        }
        host.textContent = desc || "";
        host.style.display = desc ? "" : "none";
    }

    VC.render = function (norm) {
        VC.state.norm = norm;
        var cont = VC.els.container; if (!cont) { VC.dwarn("Missing container"); return; }
        cont.innerHTML = "";

        for (var i = 0; i < norm.sections.length; i++) {
            var sec = norm.sections[i];

            var wrap = VC.el("div", "mb-4 vc-section");
            if (sec.cid) wrap.setAttribute("data-cid", sec.cid);

            // header with LEFT fixed-width toggle
            var head = VC.el("div", "d-flex align-items-center gap-2 mb-2");
            var btn = VC.el("button", "btn btn-sm btn-outline-secondary vc-toggle", "Collapse");
            btn.setAttribute("data-collapsed", "0");
            btn.style.minWidth = "110px";

            var h = VC.el("h5", "mb-0", sec.title || ("Section " + (i + 1)));
            head.appendChild(btn);
            head.appendChild(h);
            wrap.appendChild(head);

            var list = VC.el("div", "section-items");
            wrap.appendChild(list);

            // collapse behavior
            (function (b, l) {
                b.addEventListener("click", function () {
                    var isCol = b.getAttribute("data-collapsed") === "1";
                    if (isCol) { l.style.display = ""; b.textContent = "Collapse"; b.setAttribute("data-collapsed", "0"); }
                    else { l.style.display = "none"; b.textContent = "Expand"; b.setAttribute("data-collapsed", "1"); }
                });
            })(btn, list);

            // items
            for (var j = 0; j < (sec.items || []).length; j++) list.appendChild(buildItem(sec.items[j], sec.cid));

            // show *section* note only if provided (not the global description)
            if (sec.note) wrap.appendChild(VC.el("div", "text-muted small mt-1", sec.note));
            cont.appendChild(wrap);
        }

        // Put checklist description once, above sections
        renderChecklistDescription(norm.description || "");

        // Refresh filters after render
        if (VC.Filters && VC.Filters.refreshOptions) VC.Filters.refreshOptions();
    };

    // ------------- build item -------------
    function buildItem(node, sectionCid) {
        var isObj = node && typeof node === "object";
        var text = isObj ? (node.item || node.title || node.question || "") : String(node);

        var card = VC.el("div", "card mb-3 checklist-item");
        var body = VC.el("div", "card-body p-3"); card.appendChild(body);

        // data attributes
        var cid = sectionCid || (isObj && node.category_id) || "";
        card.setAttribute("data-category-id", cid);
        if (isObj) {
            if (node.citation) card.setAttribute("data-citation", node.citation);
            if (node.responsibility) card.setAttribute("data-responsibility", node.responsibility);
            if (node.joint_roles && node.joint_roles.length) card.setAttribute("data-joint-roles", node.joint_roles.join(", "));
            if (node.id) card.setAttribute("data-item-id", node.id);
            if (node.frequency) card.setAttribute("data-frequency", node.frequency);
        }

        // evidence canonicalization
        var evid = (isObj && node.evidence_type && node.evidence_type.length) ? VC.canonEvidenceKeys(node.evidence_type) : [];
        if (evid.length) card.setAttribute("data-evidence", evid.join(", "));

        var title = VC.el("div", "fw-semibold mb-2", text); body.appendChild(title);

        var toggle = VC.els.toggleCitations;
        var citation = (isObj && node.citation) ? node.citation : "";
        var defShow = !!(VC.state.ui && VC.state.ui.show_citations_default && node.show_citation);
        var showNow = (toggle && toggle.checked) || defShow;
        if (citation && showNow) body.appendChild(VC.el("div", "text-muted small", citation));

        // two-column: status + notes
        var row = VC.el("div", "d-flex flex-wrap align-items-start gap-3");
        var statusCol = VC.el("div", "status-col d-flex flex-column");
        var statusLbl = VC.el("div", "text-muted small mb-1", "Status *"); statusCol.appendChild(statusLbl);

        var sel = VC.el("select", "form-select form-select-sm status-select");
        for (var k = 0; k < VC.STATUS.length; k++) { var o = VC.el("option", null, VC.STATUS[k].t); o.value = VC.STATUS[k].v; sel.appendChild(o); }
        statusCol.appendChild(sel);

        var notesCol = VC.el("div", "notes-col flex-grow-1 d-flex flex-column");
        var notesLbl = VC.el("div", "text-muted small mb-1", "Notes"); notesCol.appendChild(notesLbl);
        var notes = VC.el("textarea", "form-control form-control-sm notes"); notes.rows = 2; notes.placeholder = "Add notes (optional)"; notes.style.minWidth = "260px";
        notesCol.appendChild(notes);

        row.appendChild(statusCol); row.appendChild(notesCol); body.appendChild(row);

        // Evidence badges + optional attach (client or globally allowed)
        // Evidence row: attach button on the left, evidence badges to the right
        if (evid.length || VC.config.ALLOW_ATTACH || VC.state.view === "client") {
            var evRow = VC.el("div", "mt-2 d-flex flex-wrap align-items-center gap-3");

            // LEFT - attach evidence
            if (VC.config.ALLOW_ATTACH || VC.state.view === "client") {
                if (!VC.state.attachments) VC.state.attachments = {};
                var itemId = card.getAttribute("data-item-id") || (cid + "-" + Math.random().toString(36).slice(2, 8));
                card.setAttribute("data-item-id", itemId);

                var attachWrap = VC.el("div", "d-flex align-items-center gap-2");
                var btn = VC.el("button", "btn btn-outline-primary btn-sm", "Attach evidence");
                var info = VC.el("span", "text-muted small"); // shows filenames
                var input = VC.el("input"); input.type = "file"; input.multiple = true; input.style.display = "none";

                btn.addEventListener("click", function () { input.click(); });
                input.addEventListener("change", function () {
                    var files = input.files || [];
                    var arr = [];
                    for (var f = 0; f < files.length; f++) {
                        arr.push({ name: files[f].name, type: files[f].type, size: files[f].size, _file: files[f] });
                    }
                    VC.state.attachments[itemId] = arr;
                    var names = arr.map(function (a) { return a.name; }).join(", ");
                    info.textContent = names ? ("Attached: " + names) : "";
                });

                attachWrap.appendChild(btn);
                attachWrap.appendChild(info);
                attachWrap.appendChild(input);
                evRow.appendChild(attachWrap);
            }

            // RIGHT - evidence type badges (human labels)
            if (evid.length) {
                var badgesWrap = VC.el("div", "d-flex flex-wrap align-items-center gap-2");
                for (var e = 0; e < evid.length; e++) {
                    badgesWrap.appendChild(VC.el("span", "badge bg-light text-secondary border", VC.evidenceLabel(evid[e])));
                }
                evRow.appendChild(badgesWrap);
            }

            body.appendChild(evRow);
        }


        sel.addEventListener("change", function () { VC.applyStatusUi(sel); });
        VC.applyStatusUi(sel);

        return card;
    }

    // ------------- harvest + validate -------------
    VC.harvest = function () {
        var out = {
            title: (VC.state.norm && VC.state.norm.title) || "Checklist",
            description: (VC.state.norm && VC.state.norm.description) || "",
            file: VC.state.currentFile || "",
            client: VC.els.client && VC.els.client.value ? String(VC.els.client.value).trim() : "",
            reviewer: VC.els.reviewer && VC.els.reviewer.value ? String(VC.els.reviewer.value).trim() : "",
            date: VC.els.date && VC.els.date.value ? VC.els.date.value : VC.todayISO(),
            sections: []
        };

        var secEls = (VC.els.container || document).querySelectorAll(".vc-section");
        for (var i = 0; i < secEls.length; i++) {
            var sEl = secEls[i];
            var stitle = (sEl.querySelector("h5") && sEl.querySelector("h5").textContent) || "";
            var cid = sEl.getAttribute("data-cid") || "";
            var sec = { cid: cid, title: stitle, items: [] };
            var cards = sEl.querySelectorAll(".checklist-item");
            for (var j = 0; j < cards.length; j++) {
                var card = cards[j];
                var q = (card.querySelector(".fw-semibold") && card.querySelector(".fw-semibold").textContent) || "";
                var status = (card.querySelector(".status-select") && card.querySelector(".status-select").value) || "";
                var notes = (card.querySelector(".notes") && card.querySelector(".notes").value) || "";
                var itemId = card.getAttribute("data-item-id") || "";

                var atts = [];
                if (VC.state.attachments && VC.state.attachments[itemId]) {
                    var arr = VC.state.attachments[itemId];
                    for (var a = 0; a < arr.length; a++) {
                        var meta = { name: arr[a].name, type: arr[a].type, size: arr[a].size };
                        // add base64 later if needed: meta.data = ...
                        atts.push(meta);
                    }
                }

                sec.items.push({
                    id: itemId,
                    question: q,
                    status: status,
                    notes: notes,
                    citation: card.getAttribute("data-citation") || "",
                    responsibility: card.getAttribute("data-responsibility") || (card.getAttribute("data-joint-roles") ? "Joint" : ""),
                    joint_roles: (card.getAttribute("data-joint-roles") || "").split(",").map(function (s) { return s.trim(); }).filter(function (s) { return !!s; }),
                    evidence_type: VC.canonEvidenceKeys(
                        (card.getAttribute("data-evidence") || "")
                            .split(",").map(function (s) { return s.trim(); }).filter(Boolean)
                    ),
                    frequency: (function (v) { v = v || ""; return v ? v : null; })(card.getAttribute("data-frequency") || ""),
                    report_include: true,
                    attachments: atts
                });
            }
            out.sections.push(sec);
        }

        out.ui = VC.state.ui || { group_by: "section" };
        out.generated_at = new Date().toISOString();
        return out;
    };

    VC.validate = function () {
        var ok = true; var first = null;
        var fields = [VC.els.client, VC.els.reviewer];
        for (var i = 0; i < fields.length; i++) {
            var input = fields[i];
            if (!input || !String(input.value || "").trim()) { if (input && input.classList) input.classList.add("is-invalid"); ok = false; if (!first) first = input; }
            else if (input && input.classList) input.classList.remove("is-invalid");
        }
        var selects = (VC.els.container || document).querySelectorAll(".status-select");
        for (var j = 0; j < selects.length; j++) {
            var sel = selects[j];
            if (!sel.value) { if (sel && sel.classList) sel.classList.add("is-invalid"); ok = false; if (!first) first = sel; }
            else if (sel && sel.classList) sel.classList.remove("is-invalid");
        }
        if (!ok && first && first.scrollIntoView) { first.scrollIntoView({ behavior: "smooth", block: "center" }); if (first.focus) first.focus(); }
        return ok;
    };

    // ------------- collapse helpers -------------
    VC.collapseAllSections = function () {
        var secs = (VC.els.container || document).querySelectorAll(".vc-section");
        for (var i = 0; i < secs.length; i++) {
            var list = secs[i].querySelector(".section-items");
            var btn = secs[i].querySelector(".vc-toggle");
            if (list && btn) { list.style.display = "none"; btn.textContent = "Expand"; btn.setAttribute("data-collapsed", "1"); }
        }
    };

    VC.expandAllSections = function () {
        var secs = (VC.els.container || document).querySelectorAll(".vc-section");
        for (var i = 0; i < secs.length; i++) {
            var list = secs[i].querySelector(".section-items");
            var btn = secs[i].querySelector(".vc-toggle");
            if (list && btn) { list.style.display = ""; btn.textContent = "Collapse"; btn.setAttribute("data-collapsed", "0"); }
        }
    };

    // ------------- manifest + load -------------
    VC.loadManifest = function () {
        // Build the manifest URL (keep your existing ROOT if you use it)
        var root = VC.config.ROOT || "";
        if (root && root.slice(-1) !== "/") root += "/";
        var manifestUrl = root + "index.json";

        // Remember where the manifest lives so we can resolve relative file paths
        VC.state.manifestUrl = manifestUrl;
        VC.state.manifestBase = manifestUrl.slice(0, manifestUrl.lastIndexOf("/") + 1);

        fetchJson(manifestUrl, function (err, manifest) {
            if (err) { VC.derr("manifest error", err); alert("Failed to load checklist index."); return; }
            VC.state.manifest = manifest;

            var lists = (manifest && (manifest.lists || manifest.checklists)) || (Array.isArray(manifest) ? manifest : []);
            if (!VC.els.type) { VC.dwarn("Dropdown not found"); return; }
            VC.els.type.innerHTML = "";

            for (var i = 0; i < lists.length; i++) {
                var l = lists[i];
                var opt = VC.el("option");
                opt.value = l.file;                         // keep the raw value from manifest
                opt.textContent = l.name || l.file;
                VC.els.type.appendChild(opt);
            }

            // restore last selection
            var last = null; try { last = localStorage.getItem("vulpine.checklist.lastFile"); } catch (e) { }
            if (last) {
                for (var j = 0; j < VC.els.type.options.length; j++) {
                    if (VC.els.type.options[j].value === last) VC.els.type.selectedIndex = j;
                }
            }

            var initial = VC.els.type.value || (lists[0] && lists[0].file) || "";
            if (initial) VC.loadChecklist(initial);

            VC.els.type.addEventListener("change", function (e) {
                VC.loadChecklist(e.target.value);
            });
        });
    };

    VC.loadChecklist = function (file) {
        // Resolve against the manifest’s base URL, not VC.config.ROOT
        var url;
        if (/^https?:\/\//i.test(file) || file.charAt(0) === "/") {
            url = file;                                  // absolute URL already
        } else {
            var base = VC.state.manifestBase || "";      // e.g. /forms/ or ./checklists/
            url = base + file;                           // resolve relative to where index.json lives
        }

        VC.state.currentFile = file;
        try { localStorage.setItem("vulpine.checklist.lastFile", file); } catch (e) { }

        fetchJson(url, function (err, raw) {
            if (err) { VC.derr("checklist load error", err); alert("Failed to load checklist: " + err.message); return; }
            VC.state.raw = raw;
            var norm = VC.normalize(raw);
            VC.state.norm = norm;
            VC.render(norm);
        });
    };

    VC.onReady(function () { VC.loadManifest(); });

})();
