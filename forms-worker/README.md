# Glanzberg Web Forms

Centralized Cloudflare Worker for contact forms on Glanzberg Web client sites.

## Architecture

```text
client website -> Cloudflare Worker -> Resend -> client inbox
```

Each website sends a public `_site_id`. The Worker maps that ID to:

- the permitted website origin(s)
- the client's destination inbox
- the authenticated sender address for that client's domain

The browser never controls the destination email address or sender identity.

## DNS model

Each client gets a dedicated sending subdomain, using the convention:

```text
mail.<client-domain>
```

For GlanzLaw:

```text
mail.glanzlaw.com
```

The Worker sends as:

```text
Glanzberg Law Website <website@mail.glanzlaw.com>
```

while setting the visitor's address as Reply-To.

Resend provides the exact DNS records required for domain verification. Add those records alongside the DNS records already used for the client's GitHub Pages site. Do not replace the website's GitHub Pages records.

## First configured client

- site ID: `glanzlaw`
- website: `https://glanzlaw.com`
- recipient: `jack@glanzlaw.com`
- sender domain: `mail.glanzlaw.com`
- sender: `website@mail.glanzlaw.com`

## Why this scales

Adding a client requires:

1. Add/confirm the site's GitHub Pages DNS records.
2. Add `mail.<client-domain>` to Resend.
3. Add the DNS records Resend supplies.
4. Verify the sending domain in Resend.
5. Add one entry to `SITES` in `src/index.js`.
6. Set the client's frontend `siteId`.
7. Deploy the Worker.

One Worker and one Resend integration can route forms for many client websites.

## Cloudflare setup

1. Create a Cloudflare account.
2. In **Workers & Pages**, create a Worker named `glanzberg-web-forms`.
3. Deploy this folder with Wrangler or connect it through your normal deployment workflow.
4. Add a Worker secret named `RESEND_API_KEY`.
5. Deploy and copy the resulting `workers.dev` URL.

### Wrangler commands

```bash
cd forms-worker
npm install
npx wrangler login
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

Never put the Resend API key in GitHub Pages, `assets/js/config.js`, or any browser-side JavaScript.

## Resend setup for GlanzLaw

1. Create/sign in to the Glanzberg Web Resend account.
2. Add the domain `mail.glanzlaw.com`.
3. Resend will display the DNS records required for sending verification.
4. Add those exact records at the DNS provider for `glanzlaw.com`.
5. Wait for Resend to show the sending domain as verified.
6. Create a sending API key.
7. Store that key in Cloudflare as the secret `RESEND_API_KEY`.

The Worker is configured to send GlanzLaw messages from:

```text
website@mail.glanzlaw.com
```

## Connect GlanzLaw

After the Worker is deployed, update:

```text
assets/js/config.js
```

to:

```js
window.GL_SITE_CONFIG = {
  siteId: "glanzlaw",
  contactEndpoint: "https://YOUR-WORKER.workers.dev"
};
```

The frontend already adds `_site_id` and `_page_url` to each submission.

## Add another client

Example:

```js
aventura_auto: {
  name: "Aventura Auto Specialist",
  recipient: "owner@example.com",
  recipientName: "Owner",
  senderName: "Aventura Auto Website",
  senderEmail: "website@mail.example.com",
  allowedOrigins: new Set([
    "https://example.com",
    "https://www.example.com"
  ]),
  subjectPrefix: "Website contact request"
}
```

Then verify `mail.example.com` in Resend and set that website's frontend `siteId` to `aventura_auto`.

## Security properties

- Recipient addresses are server-side only.
- Sender addresses are server-side only.
- Each site ID has a strict origin allowlist.
- Required fields and email format are validated server-side.
- A honeypot silently discards simple bot submissions.
- Field lengths are capped.
- The Resend API key lives only in Cloudflare.
- The visitor is used only as Reply-To, never as the authenticated From sender.
- The Worker does not intentionally persist submission contents.

For broader deployment, add Cloudflare Turnstile and rate limiting.
