// ~/functions/api/contact.js

export async function onRequestOptions({ request }) {
    return cors(new Response(null, { status: 204 }), request);
}

export async function onRequestPost(ctx) {
    const { request, env } = ctx;

    // Parse body (JSON or form)
    let data;
    try {
        const ctype = request.headers.get("content-type") || "";
        if (ctype.includes("application/json")) {
            data = await request.json();
        } else if (ctype.includes("application/x-www-form-urlencoded")) {
            const form = await request.formData();
            data = Object.fromEntries(form.entries());
        } else {
            data = await request.json(); // try JSON anyway
        }
    } catch {
        return cors(json({ ok: false, error: "Invalid JSON body" }, 400), request);
    }

    const payload = normalizeData(data);

    // Honeypot
    if (payload.website) return cors(json({ ok: true }), request);

    // Validation
    for (const k of ["firstName", "lastName", "email", "message"]) {
        if (!payload[k]) return cors(json({ ok: false, error: `Missing ${k}` }, 400), request);
    }
    if (!isValidEmail(payload.email)) {
        return cors(json({ ok: false, error: "Invalid email" }, 400), request);
    }

    // Build email (MailChannels)
    const subject = `Website contact: ${payload.firstName} ${payload.lastName}`;
    const textBody = buildTextBody(payload, request);
    const htmlBody = buildHtmlBody(payload, request);

    const mailRequest = {
        personalizations: [{ to: [{ email: env.CONTACT_TO }] }],
        from: { email: env.CONTACT_FROM, name: env.SITE_NAME || "Website" },
        reply_to: { email: payload.email, name: `${payload.firstName} ${payload.lastName}` },
        subject,
        content: [
            { type: "text/plain", value: textBody },
            { type: "text/html", value: htmlBody },
        ],
    };

    // Send with timeout
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);

    let sendRes;
    try {
        sendRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(mailRequest),
            signal: controller.signal,
        });
    } catch {
        clearTimeout(t);
        return cors(json({ ok: false, error: "Upstream email service error" }, 502), request);
    }
    clearTimeout(t);

    if (!sendRes.ok) {
        const detail = await safeText(sendRes);
        return cors(json({ ok: false, error: "Email send failed", detail }, 502), request);
    }

    return cors(json({ ok: true }), request);
}

/** Helpers **/
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

async function safeText(r) {
    try {
        return await r.text();
    } catch {
        return "";
    }
}