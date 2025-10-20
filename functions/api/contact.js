// ~/functions/api/contact.js
// Uses Resend email API instead of MailChannels.
// Ensure RESEND_API_KEY is defined in Cloudflare Pages settings.

export async function onRequestOptions({ request }) {
    return cors(new Response(null, { status: 204 }), request);
}

export async function onRequestPost(ctx) {
    const { request, env } = ctx;

    // Parse JSON body
    let data;
    try {
        data = await request.json();
    } catch {
        return cors(json({ ok: false, error: "Invalid JSON body" }, 400), request);
    }

    const payload = normalizeData(data);
    if (payload.website) return cors(json({ ok: true }), request); // honeypot

    // Validation
    for (const k of ["firstName", "lastName", "email", "message"]) {
        if (!payload[k]) return cors(json({ ok: false, error: `Missing ${k}` }, 400), request);
    }
    if (!isValidEmail(payload.email)) {
        return cors(json({ ok: false, error: "Invalid email" }, 400), request);
    }

    // Build email
    const subject = `Website contact: ${payload.firstName} ${payload.lastName}`;
    const textBody = buildTextBody(payload, request);
    const htmlBody = buildHtmlBody(payload, request);

    const email = {
        from: env.CONTACT_FROM || "noreply@vulpinemsp.com",
        to: env.CONTACT_TO || "contact@vulpinemsp.com",
        subject,
        reply_to: `${payload.firstName} ${payload.lastName} <${payload.email}>`,
        text: textBody,
        html: htmlBody,
    };

    try {
        const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(email),
        });

        const respText = await r.text();
        console.log("RESEND status", r.status, respText,
            (env.RESEND_API_KEY || "").slice(0, 7));
        return cors(json({ ok: r.ok, status: r.status, body: respText }), request);
        
    } catch (err) {
        return cors(json({ ok: false, error: "Upstream send error", detail: err.message }, 502), request);
    }
}

/** ---------- Helpers ---------- */
function normalizeData(d = {}) {
    const get = (k) => (d[k] ?? "").toString().trim();
    return {
        firstName: get("firstName"),
        lastName: get("lastName"),
        email: get("email").toLowerCase(),
        company: get("company"),
        phone: get("phone"),
        extension: get("extension"),
        message: get("message"),
        website: get("website"), // honeypot
    };
}

function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function requestMeta(req) {
    return {
        ip: req.headers.get("cf-connecting-ip") || "",
        ua: req.headers.get("user-agent") || "",
        referer: req.headers.get("referer") || "",
    };
}

function buildTextBody(p, req) {
    const meta = requestMeta(req);
    return `Name: ${p.firstName} ${p.lastName}
Email: ${p.email}
Company: ${p.company || "-"}
Phone: ${p.phone || "-"}${p.extension ? " ext " + p.extension : ""}

Message:
${p.message}

---
IP: ${meta.ip}
UA: ${meta.ua}
Referer: ${meta.referer || "-"}
Time: ${new Date().toISOString()}
`;
}

function buildHtmlBody(p, req) {
    const meta = requestMeta(req);
    const esc = (s) =>
        (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    return `
  <div>
    <p><strong>Name:</strong> ${esc(p.firstName)} ${esc(p.lastName)}</p>
    <p><strong>Email:</strong> ${esc(p.email)}</p>
    <p><strong>Company:</strong> ${esc(p.company) || "-"}</p>
    <p><strong>Phone:</strong> ${esc(p.phone) || "-"}${p.extension ? " ext " + esc(p.extension) : ""}</p>
    <p><strong>Message:</strong><br>${esc(p.message).replace(/\n/g, "<br>")}</p>
    <hr>
    <p style="color:#666"><small>
      IP: ${esc(meta.ip)}<br>
      UA: ${esc(meta.ua)}<br>
      Referer: ${esc(meta.referer) || "-"}<br>
      Time: ${new Date().toISOString()}
    </small></p>
  </div>`;
}

function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
}

function cors(res, req) {
    const origin = req.headers.get("origin") || "";
    const headers = new Headers(res.headers);
    headers.set("access-control-allow-origin", origin || "*");
    headers.set("access-control-allow-methods", "POST, OPTIONS");
    headers.set("access-control-allow-headers", "content-type");
    headers.set("vary", "origin");
    return new Response(res.body, { status: res.status, headers });
}