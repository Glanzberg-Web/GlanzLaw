const SITES = {
  glanzlaw: {
    name: "Glanzberg Law Firm, PLLC",
    recipient: "jack@glanzlaw.com",
    recipientName: "Jack Glanzberg",
    allowedOrigins: new Set(["https://glanzlaw.com", "https://www.glanzlaw.com"]),
    subjectPrefix: "Website consultation request"
  }
};

function headers(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Vary": "Origin",
    "Cache-Control": "no-store"
  };
}

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers(origin) }
  });
}

async function sendEmail(env, site, fields) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: env.FROM_NAME || "Glanzberg Web Forms",
        email: env.FROM_EMAIL
      },
      to: [{ email: site.recipient, name: site.recipientName }],
      replyTo: { email: fields.email, name: fields.name },
      subject: `${site.subjectPrefix} — ${fields.name.replace(/[\r\n]+/g, " ")}`,
      textContent: [
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
        `Submitted: ${new Date().toISOString()}`,
        `Source page: ${fields.pageUrl || "Not provided"}`
      ].join("\n")
    })
  });

  if (!response.ok) {
    console.error("Brevo error", response.status, (await response.text()).slice(0, 400));
    throw new Error("Email delivery failed");
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      const site = SITES[url.searchParams.get("site")];
      if (!site || !site.allowedOrigins.has(origin)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: headers(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ ok: false, error: "Invalid form submission." }, 400, origin);
    }

    const site = SITES[clean(form.get("_site_id"), 80)];
    if (!site || !site.allowedOrigins.has(origin)) {
      return json({ ok: false, error: "Forbidden." }, 403, origin);
    }

    if (clean(form.get("website"), 200)) return json({ ok: true }, 200, origin);

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

    if (!fields.name || !fields.email || !fields.message || fields.acknowledgment !== "yes") {
      return json({ ok: false, error: "Please complete all required fields." }, 400, origin);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      return json({ ok: false, error: "Please enter a valid email address." }, 400, origin);
    }

    if (!env.BREVO_API_KEY || !env.FROM_EMAIL) {
      return json({ ok: false, error: "Form service is not configured." }, 503, origin);
    }

    try {
      await sendEmail(env, site, fields);
      return json({ ok: true }, 200, origin);
    } catch (error) {
      console.error(error);
      return json({ ok: false, error: "We could not send your request. Please contact the firm directly." }, 502, origin);
    }
  }
};
