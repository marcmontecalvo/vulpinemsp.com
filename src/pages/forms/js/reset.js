(function () {
    var VC = window.VC = window.VC || {};

    function resetChecklist() {
        var cont = VC.els.container || document;

        // Clear statuses
        var selects = cont.querySelectorAll(".status-select");
        for (var i = 0; i < selects.length; i++) {
            selects[i].value = "";
            if (selects[i].classList) selects[i].classList.remove("is-invalid");
            if (VC.applyStatusUi) VC.applyStatusUi(selects[i]); // returns to neutral look
        }

        // Clear notes
        var notes = cont.querySelectorAll(".notes");
        for (var j = 0; j < notes.length; j++) {
            notes[j].value = "";
            if (notes[j].classList) notes[j].classList.remove("is-invalid");
        }

        // Clear header fields
        if (VC.els.client) { VC.els.client.value = ""; VC.els.client.classList && VC.els.client.classList.remove("is-invalid"); }
        if (VC.els.reviewer) { VC.els.reviewer.value = ""; VC.els.reviewer.classList && VC.els.reviewer.classList.remove("is-invalid"); }

        // Keep the selected checklist and date as-is.
        // Optionally uncheck citation toggle:
        var tog = document.getElementById("toggleCitations");
        if (tog) tog.checked = tog.checked && tog.checked; // no change by default
    }

    // expose for console/testing
    VC.resetChecklist = resetChecklist;

    VC.onReady(function () {
        if (VC.els.btnRESET) {
            VC.els.btnRESET.addEventListener("click", function (e) {
                e.preventDefault();
                resetChecklist();
            });
        }
    });
})();