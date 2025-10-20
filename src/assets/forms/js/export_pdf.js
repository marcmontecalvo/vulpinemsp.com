(function () {
    var VC = window.VC = window.VC || {};

    function exportPDF() {
        if (!VC.validate()) return; var d = VC.harvest();
        var jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!jsPDF) { alert('jsPDF not found - exporting JSON instead.'); return (function () { var blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); VC.downloadBlob(blob, VC.safeName(d.title) + '_' + d.date + '_report.json'); })(); }
        var doc = new jsPDF({ unit: 'pt', format: 'letter' });
        var margin = { x: 54, y: 54 }; var w = doc.internal.pageSize.getWidth(); var h = doc.internal.pageSize.getHeight(); var y = margin.y;
        function addPage() { doc.addPage(); y = margin.y; } function ensure(space) { if (y + space > h - margin.y) addPage(); }

        doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(d.title, margin.x, y); y += 20;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text('Client: ' + d.client, margin.x, y); y += 14; doc.text('Reviewer: ' + d.reviewer, margin.x, y); y += 14; doc.text('Date: ' + d.date, margin.x, y); y += 18;

        for (var i = 0; i < d.sections.length; i++) {
            var sec = d.sections[i]; ensure(28); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(sec.title, margin.x, y); y += 16; doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
            for (var j = 0; j < sec.items.length; j++) { var it = sec.items[j]; ensure(40); var t = (it.rule || it.title || it.question || '').toString(); var wrapped = doc.splitTextToSize('- ' + t, w - margin.x * 2); for (var a = 0; a < wrapped.length; a++) { doc.text(wrapped[a], margin.x, y); y += 12; } if (it.status) { doc.text('Status: ' + it.status, margin.x + 14, y); y += 12; } if (it.notes) { var wn = doc.splitTextToSize('Notes: ' + it.notes, w - margin.x * 2 - 14); for (var b = 0; b < wn.length; b++) { doc.text(wn[b], margin.x + 14, y); y += 12; } } y += 6; }
            y += 6;
        }

        // citations
        var cites = []; for (var c = 0; c < d.sections.length; c++) { var s = d.sections[c]; for (var z = 0; z < s.items.length; z++) { var ii = s.items[z]; if (ii.citation) cites.push({ q: ii.question, c: ii.citation }); } }
        if (cites.length) { addPage(); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text('Appendix - Citations', margin.x, y); y += 20; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); for (var k = 0; k < cites.length; k++) { ensure(18); var line = '- ' + cites[k].c + ' - ' + cites[k].q; var wrap = doc.splitTextToSize(line, w - margin.x * 2); for (var q = 0; q < wrap.length; q++) { doc.text(wrap[q], margin.x, y); y += 12; } } }

        doc.save(VC.safeName(d.title) + '_' + d.date + '_report.pdf');
    }

    VC.onReady(function () { if (VC.els.btnPDF) VC.els.btnPDF.addEventListener('click', exportPDF); });
})();