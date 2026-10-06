const SITES = {
  glanzlaw: {
    name: "Glanzberg Law Firm, PLLC",
    recipient: "jack@glanzlaw.com",
    recipientName: "Jack Glanzberg",
    senderName: "Glanzberg Law Website",
    senderEmail: "website@mail.glanzlaw.com",
    allowedOrigins: new Set([
      "https://glanzlaw.com",
      "https://www.glanzlaw.com"
    ]),
    subjectPrefix: "Website consultation request"
  }
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Vary": "Origin"
  };
}

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function json(data, status, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? corsHeaders(origin) : {})
    }
  });
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeHeader(value) {
  return clean(value, 120).replace(/[\r\n]+/g, " ");
}

function formatMessage(site, fields) {
  return [
    `New contact-form submission for ${site.name}`,
    "",
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    `Phone: ${fields.phone || "Not provided"}`,
    `Matter type: ${fields.matterType || "Not specified"}`,
    `Opposing party / insurer: ${fields.opposingParty || "Not provided"}`,
    "",
    "Brief non-confidential description:",
    fields.message,
    "",
    `Acknowledgment: ${fields.acknowledgment === "yes" ? "Accepted" : "Not accepted"}`,
    `Submitted: ${new Date().toISOString()}`,
    `Source page: ${fields.pageUrl || "Not provided"}`
  ].join("\n");
}

async function sendWithResend(env, site, fields) {
  if (!env.RESEND_API_KEY) {
    throw new Error("Resend is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: `${site.senderName} <${site.senderEmail}>`,
      to: [site.recipient],
      reply_to: fields.email,
      subject: `${site.subjectPrefix} — ${safeHeader(fields.name)}`,
      text: formatMessage(site, fields)
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend send failed", response.status, detail.slice(0, 500));
    throw new Error("Email delivery failed.");
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      const site = SITES[url.searchParams.get("site")];
      if (!site || !site.allowedOrigins.has(origin)) {
        return new Response(null, { status: 403 });
      }

      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed." }, 405);
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ ok: false, error: "Invalid form submission." }, 400);
    }

    const site = SITES[clean(form.get("_site_id"), 80)];

    if (!site || !site.allowedOrigins.has(origin)) {
      return json({ ok: false, error: "Forbidden." }, 403, origin);
    }

    // Honeypot: silently accept obvious bot submissions.
    if (clean(form.get("website"), 200)) {
      return json({ ok: true }, 200, origin);
    }

    const fields = {
      name: clean(form.get("name"), 150),
      email: clean(form.get("email"), 254),
      phone: clean(form.get("phone"), 60),
      matterType: clean(form.get("matter_type"), 200),
      opposingParty: clean(form.get("opposing_party"), 300),
      message: clean(form.get("message"), 5000),
      acknowledgment: clean(form.get("acknowledgment"), 20),
      pageUrl: clean(form.get("_page_url"), 500)
    };

    if (
      !fields.name ||
      !fields.email ||
      !fields.message ||
      fields.acknowledgment !== "yes"
    ) {
      return json(
        { ok: false, error: "Please complete all required fields." },
        400,
        origin
      );
    }

    if (!validEmail(fields.email)) {
      return json(
        { ok: false, error: "Please enter a valid email address." },
        400,
        origin
      );
    }

    try {
      await sendWithResend(env, site, fields);
      return json({ ok: true }, 200, origin);
    } catch (error) {
      console.error("Contact form delivery error", error?.message || error);
      return json(
        {
          ok: false,
          error: "We could not send your request. Please contact the firm directly."
        },
        502,
        origin
      );
    }
  }
};
