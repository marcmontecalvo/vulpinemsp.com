export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check (optional)
    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "contact-worker", ts: new Date().toISOString() });
    }

    // Contact API
    if (url.pathname === "/api/contact") {
      if (request.method === "OPTIONS") {
        return cors(new Response(null, { status: 204 }), request);
      }
      if (request.method !== "POST") {
        return cors(json({ ok: false, error: "Method Not Allowed" }, 405), request);
      }

      let data;
      try {
        // Expect JSON; if not, attempt to parse form
        const ctype = request.headers.get("content-type") || "";
        if (ctype.includes("application/json")) {
          data = await request.json();
        } else if (ctype.includes("application/x-www-form-urlencoded")) {
          const form = await request.formData();
          data = Object.fromEntries(form.entries());
        } else {
          // Try to parse anyway; if fails, respond 400
          data = await request.json();
        }
      } catch (e) {
        return cors(json({ ok: false, error: "Invalid JSON body" }, 400), request);
      }

      // Trim and normalize
      const payload = normalizeData(data);

      // Honeypot: silently accept if hidden field is filled
      if (payload.website) {
        return cors(json({ ok: true }), request);
      }

      // Basic validation
      const required = ["firstName", "lastName", "email", "message"];
      for (const k of required) {
        if (!payload[k]) {
          return cors(json({ ok: false, error: `Missing ${k}` }, 400), request);
        }
      }
      if (!isValidEmail(payload.email)) {
        return cors(json({ ok: false, error: "Invalid email" }, 400), request);
      }

      // Build email via MailChannels
      const subject = `Website contact: ${payload.firstName} ${payload.lastName}`;
      const textBody = buildTextBody(payload, request);
      const htmlBody = buildHtmlBody(payload, request);

      const mailRequest = {
        personalizations: [
          { to: [{ email: env.CONTACT_TO }] }
        ],
        from: {
          email: env.CONTACT_FROM,
          name: env.SITE_NAME || "Website"
        },
        reply_to: {
          email: payload.email,
          name: `${payload.firstName} ${payload.lastName}`
        },
        subject,
        content: [
          { type: "text/plain", value: textBody },
          { type: "text/html", value: htmlBody }
        ]
      };

      // Send with a short timeout to avoid hangs
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      let sendRes;
      try {
        sendRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(mailRequest),
          signal: controller.signal
        });
      } catch (e) {
        clearTimeout(timeout);
        return cors(json({ ok: false, error: "Upstream email service error" }, 502), request);
      }
      clearTimeout(timeout);

      if (!sendRes.ok) {
        const errText = await safeText(sendRes);
        return cors(json({ ok: false, error: "Email send failed", detail: errText }, 502), request);
      }

      return cors(json({ ok: true }), request);
    }

    // Default: static site passthrough
    return fetch(request);
  }
};

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
  // Simple but effective email test
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function buildTextBody(p, request) {
  const meta = requestMeta(request);
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

function buildHtmlBody(p, request) {
  const meta = requestMeta(request);
  const esc = (s) => (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
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

function requestMeta(request) {
  return {
    ip: request.headers.get("cf-connecting-ip") || "",
    ua: request.headers.get("user-agent") || "",
    referer: request.headers.get("referer") || ""
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function cors(res, request) {
  const origin = request.headers.get("origin") || "";
  const headers = new Headers(res.headers);
  // Allow same-origin or any origin (adjust policy if you serve from multiple domains)
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
