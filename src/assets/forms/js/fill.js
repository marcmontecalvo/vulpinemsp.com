(function () {
    var VC = window.VC = window.VC || {};

    // -------- Sample data (ASCII-safe) --------
    var CLIENTS = [
        "Acme Dental Group",
        "BrightCare Pediatrics",
        "Green Valley Family Clinic",
        "Northside Dermatology",
        "Lakeside Orthopedics",
        "Riverside Women’s Health",
        "Summit Eye Center",
        "Pinecrest Family Practice",
        "Southtown Urgent Care",
        "Blue Ridge Cardiology"
    ];

    var REVIEWERS = [
        "Alex Turner",
        "Jordan Lee",
        "Morgan Davis",
        "Casey Nguyen",
        "Riley Thompson",
        "Taylor Brooks",
        "Jamie Patel",
        "Drew Carter",
        "Sydney Morgan",
        "Cameron Ortiz"
    ];

    // -------- Lorem helpers for notes --------
    var LOREM = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
        "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium.",
        "Praesent commodo cursus magna, vel scelerisque nisl consectetur et.",
        "Curabitur blandit tempus porttitor.",
        "Integer posuere erat a ante venenatis dapibus.",
        "Donec id elit non mi porta gravida at eget metus.",
        "Vestibulum id ligula porta felis euismod semper.",
        "Nullam quis risus eget urna mollis ornare vel eu leo.",
        "Maecenas sed diam eget risus varius blandit sit amet non magna.",
        "Morbi leo risus, porta ac consectetur ac, vestibulum at eros.",
        "Etiam porta sem malesuada magna mollis euismod."
    ];

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function makeSentences(n) { var s = [], i; for (i = 0; i < n; i++) s.push(pick(LOREM)); return s.join(" "); }
    function makeParagraph(a, b) { return makeSentences(randInt(a, b)); }

    // kind: "blank" | "short" | "medium" | "long" | "varied"
    function generateNote(kind) {
        if (kind === "blank") return "";
        if (kind === "short") return makeSentences(randInt(1, 2));
        if (kind === "medium") return makeParagraph(3, 5);
        if (kind === "long") {
            var p = randInt(2, 3), i, out = [];
            for (i = 0; i < p; i++) out.push(makeParagraph(4, 6));
            return out.join("\n\n");
        }
        // varied: ~45% blank, ~35% short, ~15% medium, ~5% long
        var r = Math.random();
        if (r < 0.45) return generateNote("blank");
        if (r < 0.80) return generateNote("short");
        if (r < 0.95) return generateNote("medium");
        return generateNote("long");
    }

    // -------- Header fill (Client/Reviewer) --------
    function fillHeaderNames(options) {
        options = options || {};
        var setClient = options.client || pick(CLIENTS);
        var setReviewer = options.reviewer || pick(REVIEWERS);

        if (VC.els.client) VC.els.client.value = setClient;
        if (VC.els.reviewer) VC.els.reviewer.value = setReviewer;
    }

    // -------- Main test fill --------
    // mode: 'cycle' | 'random' | 'yes' | 'no' | 'needs' | 'na' | 'unknown'
    // notesMode: 'blank' | 'short' | 'medium' | 'long' | 'varied' (default)
    // options: { client: "Name", reviewer: "Name" } to override header names
    VC.quickFill = function (mode, notesMode, options) {
        // 1) fill header names first
        fillHeaderNames(options);

        // 2) fill statuses and notes
        var container = VC.els.container || document;
        var selects = container.querySelectorAll(".status-select");
        var notes = container.querySelectorAll(".notes");
        var vals = ["yes", "no", "needs", "na", "unknown"];
        var i, v;

        for (i = 0; i < selects.length; i++) {
            if (mode === "yes") v = "yes";
            else if (mode === "no") v = "no";
            else if (mode === "needs") v = "needs";
            else if (mode === "na") v = "na";
            else if (mode === "unknown") v = "unknown";
            else if (mode === "random") v = vals[Math.floor(Math.random() * vals.length)];
            else v = ["yes", "no", "needs"][i % 3]; // cycle default

            selects[i].value = v;
            VC.applyStatusUi(selects[i]);

            if (notes[i]) {
                var kind = notesMode || "varied";
                notes[i].value = generateNote(kind);
            }
        }
    };

    // expose header-only helper if you need it in console
    VC.quickFillHeaderNames = function (opts) { fillHeaderNames(opts); };

    VC.onReady(function () {
        if (VC.els.btnFILL) {
            VC.els.btnFILL.addEventListener("click", function () {
                // statuses cycle; notes varied; random client/reviewer
                VC.quickFill("cycle", "varied");
            });
        }
    });
})();
