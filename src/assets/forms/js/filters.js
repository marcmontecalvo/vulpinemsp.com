(function () {
    var VC = window.VC = window.VC || {};
    VC.Filters = VC.Filters || {};
    var F = VC.Filters;

    F.els = { bar: null, cat: null, resp: null, evid: null, clear: null, collapseAll: null, expandAll: null };
    F._observed = false;

    function uniqueStrings(arr) {
        var seen = {}, out = [], i, v;
        for (i = 0; i < arr.length; i++) {
            v = arr[i]; if (v == null || v === "") continue;
            if (!Object.prototype.hasOwnProperty.call(seen, v)) { seen[v] = 1; out.push(v); }
        }
        return out.sort();
    }

    function optionize(sel, arr, labelAll) {
        if (!sel) return;
        var current = sel.value;
        sel.innerHTML = "";
        var optAll = VC.el("option", null, labelAll || "All"); optAll.value = "";
        sel.appendChild(optAll);
        for (var i = 0; i < arr.length; i++) {
            var row = arr[i], text, val;
            if (row && typeof row === "object" && ("v" in row || "t" in row)) { val = row.v || row.t || ""; text = row.t || row.v || ""; }
            else { val = String(row); text = val; }
            var o = VC.el("option", null, text);
            o.value = val;
            sel.appendChild(o);
        }
        if (current && Array.prototype.some.call(sel.options, function (o) { return o.value === current; })) sel.value = current;
    }

    function ensureBar() {
        if (F.els.bar) return;
        var host = VC.el("div", "mt-3"); host.id = "vcFilterBar";
        var row = VC.el("div", "row g-2 align-items-end"); host.appendChild(row);

        var cCol = VC.el("div", "col-12 col-md-4");
        var cLbl = VC.el("label", "form-label", "Filter - Category"); cLbl.htmlFor = "vcFilterCat";
        var cSel = VC.el("select", "form-select"); cSel.id = "vcFilterCat";
        cCol.appendChild(cLbl); cCol.appendChild(cSel); row.appendChild(cCol);

        var rCol = VC.el("div", "col-12 col-md-4");
        var rLbl = VC.el("label", "form-label", "Filter - Responsibility"); rLbl.htmlFor = "vcFilterResp";
        var rSel = VC.el("select", "form-select"); rSel.id = "vcFilterResp";
        rCol.appendChild(rLbl); rCol.appendChild(rSel); row.appendChild(rCol);

        var eCol = VC.el("div", "col-12 col-md-4");
        var eLbl = VC.el("label", "form-label", "Filter - Evidence Type"); eLbl.htmlFor = "vcFilterEvid";
        var eSel = VC.el("select", "form-select"); eSel.id = "vcFilterEvid";
        eCol.appendChild(eLbl); eCol.appendChild(eSel); row.appendChild(eCol);

        var ctrl = VC.el("div", "mt-2 d-flex gap-2");
        var clearBtn = VC.el("button", "btn btn-outline-secondary btn-sm", "Clear filters");
        var collapseBtn = VC.el("button", "btn btn-outline-secondary btn-sm", "Collapse all");
        var expandBtn = VC.el("button", "btn btn-outline-secondary btn-sm", "Expand all");
        ctrl.appendChild(clearBtn); ctrl.appendChild(collapseBtn); ctrl.appendChild(expandBtn); host.appendChild(ctrl);

        var container = VC.els.container;
        if (container && container.parentNode) container.parentNode.insertBefore(host, container);

        F.els.bar = host; F.els.cat = cSel; F.els.resp = rSel; F.els.evid = eSel;
        F.els.clear = clearBtn; F.els.collapseAll = collapseBtn; F.els.expandAll = expandBtn;

        cSel.addEventListener("change", onFacetChange);
        rSel.addEventListener("change", onFacetChange);
        eSel.addEventListener("change", onFacetChange);
        clearBtn.addEventListener("click", function (e) { e.preventDefault(); resetFilters(); applyFilters(); recomputeOptions(); });
        collapseBtn.addEventListener("click", function (e) { e.preventDefault(); if (VC.collapseAllSections) VC.collapseAllSections(); });
        expandBtn.addEventListener("click", function (e) { e.preventDefault(); if (VC.expandAllSections) VC.expandAllSections(); });
    }

    function resetFilters() {
        if (F.els.cat) F.els.cat.value = "";
        if (F.els.resp) F.els.resp.value = "";
        if (F.els.evid) F.els.evid.value = "";
    }

    function categoriesFromDom() {
        var cont = VC.els.container || document;
        var secs = cont.querySelectorAll(".vc-section, .section");
        var seen = {}, out = [];
        for (var i = 0; i < secs.length; i++) {
            var cid = secs[i].getAttribute("data-cid") || "";
            if (!cid) continue;
            var titleEl = secs[i].querySelector("h5");
            var title = titleEl ? titleEl.textContent : "Section";
            if (!Object.prototype.hasOwnProperty.call(seen, cid)) { seen[cid] = 1; out.push({ v: cid, t: title }); }
        }
        out.sort(function (a, b) { return a.t.localeCompare(b.t); });
        return out;
    }

    function tagDomCategories() {
        var cont = VC.els.container || document;
        var secs = cont.querySelectorAll(".vc-section, .section");
        for (var i = 0; i < secs.length; i++) {
            var sec = secs[i];
            var cid = sec.getAttribute("data-cid");
            if (!cid) {
                var h = sec.querySelector("h5");
                cid = (VC.slug ? VC.slug(h ? h.textContent : ("section-" + (i + 1))) : "section-" + (i + 1));
                sec.setAttribute("data-cid", cid);
            }
            var cards = sec.querySelectorAll(".checklist-item");
            for (var j = 0; j < cards.length; j++) {
                if (!cards[j].getAttribute("data-category-id")) cards[j].setAttribute("data-category-id", cid);
            }
        }
    }

    function applyFilters() {
        var catSel = (F.els.cat && F.els.cat.value) || "";
        var respSel = (F.els.resp && F.els.resp.value) || "";
        var evidSel = (F.els.evid && F.els.evid.value) || "";

        var cont = VC.els.container || document;
        var sections = cont.querySelectorAll(".vc-section, .section");
        for (var s = 0; s < sections.length; s++) {
            var section = sections[s]; if (!section || !section.querySelector) continue;
            var anyVisible = false;
            var cards = section.querySelectorAll(".checklist-item");
            for (var i = 0; i < cards.length; i++) {
                var card = cards[i]; if (!card) continue;
                var cardCat = card.getAttribute("data-category-id") || "";
                var cardResp = card.getAttribute("data-responsibility") || (card.getAttribute("data-joint-roles") ? "Joint" : "");
                var rawEv = card.getAttribute("data-evidence") || "";
                var cardEvid = rawEv ? rawEv.split(",").map(function (x) { return (x || "").trim(); }) : [];

                var ok = true;
                if (catSel && cardCat !== catSel) ok = false;
                if (ok && respSel && cardResp !== respSel) ok = false;
                if (ok && evidSel && cardEvid.indexOf(evidSel) === -1) ok = false;

                if (card.style) card.style.display = ok ? "" : "none";
                if (ok) anyVisible = true;
            }
            if (section.style) section.style.display = anyVisible ? "" : "none";
        }
    }

    function recomputeOptions() {
        var activeCat = (F.els.cat && F.els.cat.value) || "";
        var activeResp = (F.els.resp && F.els.resp.value) || "";
        var activeEvid = (F.els.evid && F.els.evid.value) || "";

        var cont = VC.els.container || document;
        var cards = cont.querySelectorAll(".checklist-item");

        var cats = {}, resps = {}, evids = {};

        for (var i = 0; i < cards.length; i++) {
            var c = cards[i];
            var cat = c.getAttribute("data-category-id") || "";
            var resp = c.getAttribute("data-responsibility") || (c.getAttribute("data-joint-roles") ? "Joint" : "");
            var evs = (c.getAttribute("data-evidence") || "").split(",").map(function (s) { return (s || "").trim(); }).filter(Boolean);

            // For Category options
            var passForCat = true;
            if (activeResp && resp !== activeResp) passForCat = false;
            if (passForCat && activeEvid && evs.indexOf(activeEvid) === -1) passForCat = false;
            if (passForCat && cat) cats[cat] = 1;

            // For Responsibility options
            var passForResp = true;
            if (activeCat && cat !== activeCat) passForResp = false;
            if (passForResp && activeEvid && evs.indexOf(activeEvid) === -1) passForResp = false;
            if (passForResp && resp) resps[resp] = 1;

            // For Evidence options
            var passForEvid = true;
            if (activeCat && cat !== activeCat) passForEvid = false;
            if (passForEvid && activeResp && resp !== activeResp) passForEvid = false;
            if (passForEvid) for (var e = 0; e < evs.length; e++) evids[evs[e]] = 1;
        }

        var catsArr = categoriesFromDom().filter(function (x) { return Object.prototype.hasOwnProperty.call(cats, x.v); });
        var respsArr = uniqueStrings(Object.keys(resps));
        var evidArr = uniqueStrings(Object.keys(evids)).map(function (k) { return { v: k, t: VC.evidenceLabel(k) }; });

        optionize(F.els.cat, catsArr, "All categories");
        optionize(F.els.resp, respsArr, "All responsibilities");
        optionize(F.els.evid, evidArr, "All evidence types");
    }

    function onFacetChange() {
        applyFilters();
        recomputeOptions();
    }

    F.refreshOptions = function () {
        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensureBar);
        else ensureBar();

        tagDomCategories();
        optionize(F.els.cat, categoriesFromDom(), "All categories");

        recomputeOptions();
        observeContainerOnce();
    };

    function observeContainerOnce() {
        if (F._observed) return;
        var cont = VC.els.container || document.getElementById("checklistContainer");
        if (!cont || !window.MutationObserver) return;
        var obs = new MutationObserver(function () { tagDomCategories(); F.refreshOptions(); });
        obs.observe(cont, { childList: true, subtree: true });
        F._observed = true;
    }

    if (document.readyState !== "loading") ensureBar();
    else if (VC.onReady) VC.onReady(ensureBar);
    else document.addEventListener("DOMContentLoaded", ensureBar);

    F.apply = function () { applyFilters(); recomputeOptions(); };
    F.reset = function () { resetFilters(); applyFilters(); recomputeOptions(); };

})();
