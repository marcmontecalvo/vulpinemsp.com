'use strict';

/*
 Vulpine Solutions - Checklist App (rebuild, ASCII-safe, ES5)
 - Works with legacy JSON: { title, sections: [{ title, note, items: [string] }] }
 - Works with new JSON:    { title, categories: [...], items: [{ id, item, category_id, citation, responsibility, ...}] }
 - Populates dropdown from checklists/index.json
 - Citations hidden on form, optional Show citations toggle, always included in exports
 - Robust debug logging (URL ?debug=1, localStorage key, or API)
 - No fancy unicode, no optional chaining, no trailing commas, no arrow functions
*/

(function () {
  // ---------------- Config ----------------
  var ROOT = 'checklists/'; // index.json + list files directory

  // ---------------- Debug ----------------
  var state = {
    manifest: null,
    currentFile: null,
    raw: null,
    norm: null,
    ui: {},
    debug: false
  };

  try {
    var urlDebug = (location.search || '').indexOf('debug=1') !== -1 || (location.search || '').indexOf('debug=true') !== -1;
    if (urlDebug) state.debug = true;
    if (localStorage.getItem('vulpine.checklist.debug') === '1') state.debug = true;
  } catch (e) { }

  function dlog() { if (state.debug && window.console && console.log) console.log.apply(console, ['[Checklist]'].concat([].slice.call(arguments))); }
  function dwarn() { if (state.debug && window.console && console.warn) console.warn.apply(console, ['[Checklist]'].concat([].slice.call(arguments))); }
  function derr() { if (state.debug && window.console && console.error) console.error.apply(console, ['[Checklist]'].concat([].slice.call(arguments))); }

  // ---------------- Element helpers ----------------
  function byIds() {
    for (var i = 0; i < arguments.length; i++) {
      var id = arguments[i];
      var el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  var els = {
    type: byIds('checklistSelect', 'checklistType', 'type'),
    client: byIds('clientName', 'client', 'clientField'),
    reviewer: byIds('reviewerName', 'accessorName', 'reviewer'),
    date: byIds('checklistDate', 'date'),
    container: byIds('checklistContainer', 'sections', 'checklistBody'),
    btnPDF: byIds('exportPdfBtn', 'pdfBtn'),
    btnJSON: byIds('exportJsonBtn', 'jsonBtn'),
    btnTXT: byIds('exportTxtBtn', 'txtBtn'),
    toolbar: byIds('checklistToolbar', 'toolbar')
  };

  var STATUS = [
    { v: '', t: 'Select status' },
    { v: 'compliant', t: 'Compliant' },
    { v: 'needs-work', t: 'Needs work' },
    { v: 'not-applicable', t: 'Not applicable' },
    { v: 'unknown', t: 'Unknown' }
  ];

  // ---------------- Utils ----------------
  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1); if (m.length < 2) m = '0' + m;
    var day = String(d.getDate()); if (day.length < 2) day = '0' + day;
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function slug(s) {
    s = String(s || 'x').toLowerCase();
    s = s.replace(/[^a-z0-9]+/g, '-');
    s = s.replace(/(^-|-$)/g, '');
    return s;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function fetchJson(url, cb) {
    dlog('fetchJson ->', url);
    fetch(url, { cache: 'no-store' })
      .then(function (res) { dlog('fetch status', res.status); if (!res.ok) throw new Error('Fetch failed ' + url + ': ' + res.status); return res.json(); })
      .then(function (json) { dlog('fetch keys', Object.keys(json || {})); cb(null, json); })
      .catch(function (err) { derr('fetch error', err); cb(err); });
  }

  // ---------------- Normalization ----------------
  function sanitizeItem(it, fallbackId) {
    if (!it || typeof it !== 'object') return { id: fallbackId, item: String(it || '') };
    return {
      id: it.id || fallbackId,
      item: it.item || it.title || it.question || '',
      citation: it.citation || '',
      responsibility: it.responsibility || '',
      joint_roles: Array.isArray(it.joint_roles) ? it.joint_roles : [],
      show_citation: !!it.show_citation,
      report_include: it.report_include !== false,
      evidence_type: Array.isArray(it.evidence_type) ? it.evidence_type : [],
      frequency: it.frequency || '',
      note: it.note || ''
    };
  }

  function normalize(list) {
    state.ui = list && list.ui ? list.ui : {};
    dlog('normalize ui', state.ui);

    // Legacy shape
    if (list && Array.isArray(list.sections)) {
      dlog('normalize legacy sections path');
      var secs = [];
      for (var i = 0; i < list.sections.length; i++) {
        var sec = list.sections[i];
        var items = [];
        var srcItems = sec.items || [];
        for (var j = 0; j < srcItems.length; j++) {
          var it = srcItems[j];
          items.push(typeof it === 'string' ? { id: slug(sec.title) + '-' + (j + 1), item: it } : sanitizeItem(it, slug(sec.title) + '-' + (j + 1)));
        }
        secs.push({ title: sec.title || 'Section', note: sec.note || sec.subtitle || (list.description || ''), items: items });
      }
      return { title: list.title || 'Checklist', sections: secs };
    }

    // New shape
    if (list && Array.isArray(list.categories) && Array.isArray(list.items)) {
      dlog('normalize categories path', 'categories=' + list.categories.length, 'items=' + list.items.length);
      var byId = {};
      for (var c = 0; c < list.categories.length; c++) byId[list.categories[c].id] = list.categories[c];
      var grouped = {};
      for (var k = 0; k < list.items.length; k++) {
        var itm = list.items[k];
        var cid = itm.category_id || 'uncategorized';
        if (!grouped[cid]) grouped[cid] = [];
        grouped[cid].push(sanitizeItem(itm, cid + '-' + Math.random().toString(36).slice(2, 8)));
      }
      var outSecs = [];
      for (var key in grouped) {
        if (!grouped.hasOwnProperty(key)) continue;
        outSecs.push({ title: (byId[key] && byId[key].name) ? byId[key].name : 'Section', note: list.description || '', items: grouped[key] });
      }
      return { title: list.title || 'Checklist', sections: outSecs };
    }

    dlog('normalize fallback');
    var itemsOnly = [];
    var src = (list && list.items) || [];
    for (var m = 0; m < src.length; m++) {
      var ii = src[m];
      itemsOnly.push(typeof ii === 'string' ? { id: 'item-' + (m + 1), item: ii } : sanitizeItem(ii, 'item-' + (m + 1)));
    }
    return { title: (list && list.title) || 'Checklist', sections: [{ title: 'Items', items: itemsOnly }] };
  }

  // ---------------- Render ----------------
  function render(norm) {
    state.norm = norm;
    if (!els.container) { dwarn('Missing container element'); return; }
    els.container.innerHTML = '';

    for (var i = 0; i < norm.sections.length; i++) {
      var sec = norm.sections[i];
      var wrap = el('div', 'mb-4 section');
      var h = el('h5', 'mb-2', sec.title || ('Section ' + (i + 1))); wrap.appendChild(h);
      if (sec.note) wrap.appendChild(el('div', 'text-muted small mb-2', sec.note));
      var list = el('div', 'section-items');
      for (var j = 0; j < (sec.items || []).length; j++) list.appendChild(buildItem(sec.items[j], j));
      wrap.appendChild(list);
      els.container.appendChild(wrap);
    }
    dlog('render complete: sections', norm.sections.length);
  }

  function buildItem(node, idx) {
    var isObj = node && typeof node === 'object';
    var text = isObj ? (node.item || node.title || node.question || '') : String(node);

    var card = el('div', 'card mb-3 checklist-item');
    var body = el('div', 'card-body p-3'); card.appendChild(body);

    if (isObj) {
      if (node.citation) card.dataset.citation = node.citation;
      if (node.responsibility) card.dataset.responsibility = node.responsibility;
      if (node.joint_roles && node.joint_roles.length) card.dataset.jointRoles = node.joint_roles.join(', ');
      if (node.id) card.dataset.itemId = node.id;
      if (node.evidence_type && node.evidence_type.length) card.dataset.evidence = node.evidence_type.join(', ');
      if (node.frequency) card.dataset.frequency = node.frequency;
    }

    var title = el('div', 'fw-semibold mb-2', text); body.appendChild(title);

    var toggle = document.getElementById('toggleCitations');
    var citation = (isObj && node.citation) ? node.citation : '';
    var defShow = !!(state.ui && state.ui.show_citations_default && node.show_citation);
    var showNow = (toggle && toggle.checked) || defShow;
    if (citation && showNow) body.appendChild(el('div', 'text-muted small', citation));

    var row = el('div', 'd-flex flex-wrap gap-2 align-items-start');

    var sel = el('select', 'form-select form-select-sm status-select');
    for (var i = 0; i < STATUS.length; i++) {
      var o = el('option', null, STATUS[i].t);
      o.value = STATUS[i].v;
      sel.appendChild(o);
    }
    row.appendChild(sel);

    var notes = el('textarea', 'form-control form-control-sm notes');
    notes.rows = 2; notes.placeholder = 'Notes...'; notes.style.minWidth = '260px';
    row.appendChild(notes);

    body.appendChild(row);
    return card;
  }

  // ---------------- Harvest / Export ----------------
  function harvest() {
    var out = {
      title: (state.norm && state.norm.title) || 'Checklist',
      file: state.currentFile || '',
      client: (els.client && els.client.value) ? String(els.client.value).trim() : '',
      reviewer: (els.reviewer && els.reviewer.value) ? String(els.reviewer.value).trim() : '',
      date: (els.date && els.date.value) ? els.date.value : todayISO(),
      sections: []
    };

    var secEls = (els.container || document).querySelectorAll('.section');
    for (var i = 0; i < secEls.length; i++) {
      var sEl = secEls[i];
      var stitle = (sEl.querySelector('h5') && sEl.querySelector('h5').textContent) || '';
      var sec = { title: stitle, items: [] };
      var cards = sEl.querySelectorAll('.checklist-item');
      for (var j = 0; j < cards.length; j++) {
        var card = cards[j];
        var q = (card.querySelector('.fw-semibold') && card.querySelector('.fw-semibold').textContent) || '';
        var status = (card.querySelector('.status-select') && card.querySelector('.status-select').value) || '';
        var notes = (card.querySelector('.notes') && card.querySelector('.notes').value) || '';
        sec.items.push({
          question: q,
          status: status,
          notes: notes,
          citation: card.dataset.citation || '',
          responsibility: card.dataset.responsibility || (card.dataset.jointRoles ? 'Joint' : ''),
          joint_roles: (card.dataset.jointRoles || '').split(',').map(function (s) { return s.trim(); }).filter(function (s) { return !!s; }),
          id: card.dataset.itemId || '',
          evidence: (card.dataset.evidence || '').split(',').map(function (s) { return s.trim(); }).filter(function (s) { return !!s; }),
          frequency: card.dataset.frequency || ''
        });
      }
      out.sections.push(sec);
    }

    out.ui = state.ui || {};
    out.generated_at = new Date().toISOString();
    dlog('harvest payload', out);
    return out;
  }

  function collectCitations(d) {
    var arr = [];
    for (var i = 0; i < d.sections.length; i++) {
      var sec = d.sections[i];
      for (var j = 0; j < sec.items.length; j++) {
        var it = sec.items[j];
        if (it.citation) arr.push({ section: sec.title, question: it.question, citation: it.citation });
      }
    }
    return arr;
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = el('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  }

  function safeName(s) { return String(s || 'report').replace(/[^a-z0-9-_]+/gi, '_'); }

  function exportJSON() {
    if (!validate()) return;
    var d = harvest();
    downloadBlob(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }), safeName(d.title) + '_' + d.date + '_report.json');
  }

  function exportTXT() {
    if (!validate()) return;
    var d = harvest();
    var lines = [];
    lines.push('# ' + d.title);
    lines.push('Client: ' + d.client);
    lines.push('Reviewer: ' + d.reviewer);
    lines.push('Date: ' + d.date);
    lines.push('');
    for (var i = 0; i < d.sections.length; i++) {
      var sec = d.sections[i];
      lines.push('## ' + sec.title);
      for (var j = 0; j < sec.items.length; j++) {
        var it = sec.items[j];
        lines.push('- [' + (it.status || ' ') + '] ' + it.question);
        if (it.notes) lines.push('    Notes: ' + it.notes);
        if (it.citation) lines.push('    Ref: ' + it.citation);
      }
      lines.push('');
    }
    var cites = collectCitations(d);
    if (cites.length) {
      lines.push('---');
      lines.push('Appendix - Citations');
      for (var k = 0; k < cites.length; k++) lines.push('- ' + cites[k].citation + ' - ' + cites[k].question);
    }
    downloadBlob(new Blob([lines.join('\n')], { type: 'text/plain' }), safeName(d.title) + '_' + d.date + '_report.txt');
  }

  function exportPDF() {
    if (!validate()) return;
    var d = harvest();
    var jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDF) { alert('jsPDF not found - exporting JSON instead.'); return exportJSON(); }
    var doc = new jsPDF({ unit: 'pt', format: 'letter' });
    var margin = { x: 54, y: 54 };
    var pageW = doc.internal.pageSize.getWidth();
    var pageH = doc.internal.pageSize.getHeight();
    var y = margin.y;

    function addPage() { doc.addPage(); y = margin.y; }
    function ensure(space) { if (y + space > pageH - margin.y) addPage(); }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16); doc.text(d.title, margin.x, y); y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Client: ' + d.client, margin.x, y); y += 14;
    doc.text('Reviewer: ' + d.reviewer, margin.x, y); y += 14;
    doc.text('Date: ' + d.date, margin.x, y); y += 18;

    for (var i = 0; i < d.sections.length; i++) {
      var sec = d.sections[i];
      ensure(28); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(sec.title, margin.x, y); y += 16;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      for (var j = 0; j < sec.items.length; j++) {
        var it = sec.items[j];
        ensure(40);
        var t = (it.rule || it.title || it.question || '').toString();
        var wrapped = doc.splitTextToSize('- ' + t, pageW - margin.x * 2);
        for (var a = 0; a < wrapped.length; a++) { doc.text(wrapped[a], margin.x, y); y += 12; }
        if (it.status) { doc.text('Status: ' + it.status, margin.x + 14, y); y += 12; }
        if (it.notes) {
          var wn = doc.splitTextToSize('Notes: ' + it.notes, pageW - margin.x * 2 - 14);
          for (var b = 0; b < wn.length; b++) { doc.text(wn[b], margin.x + 14, y); y += 12; }
        }
        y += 6;
      }
      y += 6;
    }

    var cites = collectCitations(d);
    if (cites.length) {
      addPage();
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text('Appendix - Citations', margin.x, y); y += 20;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      for (var c = 0; c < cites.length; c++) {
        ensure(18);
        var line = '- ' + cites[c].citation + ' - ' + cites[c].question;
        var wrap = doc.splitTextToSize(line, pageW - margin.x * 2);
        for (var w = 0; w < wrap.length; w++) { doc.text(wrap[w], margin.x, y); y += 12; }
      }
    }

    doc.save(safeName(d.title) + '_' + d.date + '_report.pdf');
  }

  // ---------------- Validation ----------------
  function validate() {
    var ok = true; var first = null;
    var fields = [els.client, els.reviewer];
    for (var i = 0; i < fields.length; i++) {
      var input = fields[i];
      if (!input || !String(input.value || '').trim()) { if (input && input.classList) input.classList.add('is-invalid'); ok = false; if (!first) first = input; }
      else if (input && input.classList) input.classList.remove('is-invalid');
    }
    var selects = (els.container || document).querySelectorAll('.status-select');
    for (var j = 0; j < selects.length; j++) {
      var sel = selects[j];
      if (!sel.value) { if (sel && sel.classList) sel.classList.add('is-invalid'); ok = false; if (!first) first = sel; }
      else if (sel && sel.classList) sel.classList.remove('is-invalid');
    }
    if (!ok && first && first.scrollIntoView) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (first.focus) first.focus(); }
    return ok;
  }

  // ---------------- Manifest & Loaders ----------------
  function loadManifest() {
    var url = ROOT + 'index.json';
    dlog('loadManifest', url);
    fetchJson(url, function (err, manifest) {
      if (err) { derr('manifest error', err); alert('Failed to load checklist index.'); return; }
      state.manifest = manifest;
      var lists = (manifest && (manifest.lists || manifest.checklists)) || (Array.isArray(manifest) ? manifest : []);
      dlog('manifest lists', lists.length, lists);

      if (!els.type) { dwarn('Dropdown element not found'); return; }
      els.type.innerHTML = '';
      for (var i = 0; i < lists.length; i++) {
        var l = lists[i];
        var opt = el('option');
        opt.value = l.file; // keep raw file path
        opt.textContent = l.name || l.file;
        els.type.appendChild(opt);
      }

      var last = null;
      try { last = localStorage.getItem('vulpine.checklist.lastFile'); } catch (e) { }
      if (last) {
        for (var j = 0; j < els.type.options.length; j++) if (els.type.options[j].value === last) els.type.selectedIndex = j;
      }

      var initial = els.type.value || (lists[0] && lists[0].file) || '';
      if (initial) { dlog('initial load', initial); loadChecklist(initial); }

      els.type.addEventListener('change', function (e) { loadChecklist(e.target.value); });
      mountToggleIfMissing();
    });
  }

  function loadChecklist(file) {
    var url = file;
    if (!(url.indexOf('http://') === 0 || url.indexOf('https://') === 0 || url.indexOf('/') === 0 || url.indexOf(ROOT) === 0)) {
      url = ROOT + file;
    }
    state.currentFile = file;
    try { localStorage.setItem('vulpine.checklist.lastFile', file); } catch (e) { }

    dlog('loadChecklist', file, '=>', url);
    fetchJson(url, function (err, raw) {
      if (err) { derr('checklist load error', err); alert('Failed to load checklist: ' + err.message); return; }
      state.raw = raw;
      var norm = normalize(raw);
      state.norm = norm;
      render(norm);
    });
  }

  // ---------------- Toggle Citations ----------------
  function mountToggleIfMissing() {
    if (document.getElementById('toggleCitations')) { dlog('toggle exists'); return; }
    if (!els.type) { dwarn('toggle mount skipped - no dropdown'); return; }
    var label = el('label', 'form-check ms-2');
    var input = el('input', 'form-check-input'); input.type = 'checkbox'; input.id = 'toggleCitations';
    var span = el('span', 'form-check-label', 'Show citations on form');
    label.appendChild(input); label.appendChild(span);
    var parent = els.toolbar || els.type.parentElement || document.body;
    parent.appendChild(label);
    input.addEventListener('change', function () { if (state.norm) render(state.norm); });
    dlog('toggle mounted');
  }

  // ---------------- Buttons ----------------
  function wireButtons() {
    if (els.btnPDF) els.btnPDF.addEventListener('click', exportPDF);
    if (els.btnJSON) els.btnJSON.addEventListener('click', exportJSON);
    if (els.btnTXT) els.btnTXT.addEventListener('click', exportTXT);
    dlog('buttons wired', { pdf: !!els.btnPDF, json: !!els.btnJSON, txt: !!els.btnTXT });
  }

  // ---------------- Boot ----------------
  document.addEventListener('DOMContentLoaded', function () {
    dlog('boot elements', els);
    if (els.date && !els.date.value) els.date.value = todayISO();
    wireButtons();
    loadManifest();

    window.VulpineChecklist = {
      loadChecklist: loadChecklist,
      harvest: harvest,
      state: state,
      renderCurrent: function () { if (state.norm) render(state.norm); },
      setDebug: function (v) { state.debug = !!v; try { localStorage.setItem('vulpine.checklist.debug', state.debug ? '1' : '0'); } catch (e) { } dlog('debug set', state.debug); }
    };

    dlog('boot complete');
  });
})();
