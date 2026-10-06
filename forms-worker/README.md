# Glanzberg Web Forms

Centralized Cloudflare Worker used by Glanzberg Web client websites to turn contact-form submissions into transactional email.

## Architecture

```text
client website -> Cloudflare Worker -> Brevo -> client inbox
```

Client websites send a public `_site_id`. The Worker maps that ID to a server-side recipient and an allowlist of valid website origins. The browser never controls the destination email address.

The first configured client is:

- `glanzlaw` -> `jack@glanzlaw.com`
- allowed origins: `https://glanzlaw.com`, `https://www.glanzlaw.com`

## Why this scales

Adding a client requires one new entry in `SITES` plus a `siteId` in that client's frontend configuration. Client DNS does not need to change.

The sender identity is owned centrally by Glanzberg Web. Replies use the visitor's email address through the email provider's Reply-To field.

## Provider choice

This prototype uses Brevo's transactional email API. A sender address can be verified through an email confirmation without requiring client DNS changes. Domain authentication can be added later to the Glanzberg Web sender domain for better deliverability without modifying any client's DNS.

## Cloudflare setup

1. Create a Cloudflare account.
2. In **Workers & Pages**, create a Worker named `glanzberg-web-forms`.
3. Deploy this folder with Wrangler, or connect the GitHub repository and set this folder as the Worker root.
4. Add the following Worker environment values:
   - Secret: `BREVO_API_KEY`
   - Variable: `FROM_EMAIL` = the sender email address verified in Brevo
   - Variable: `FROM_NAME` = `Glanzberg Web Forms` (already supplied in `wrangler.jsonc`)
5. Deploy and copy the resulting `workers.dev` URL.

### Wrangler commands

```bash
cd forms-worker
npm install
npx wrangler login
npx wrangler secret put BREVO_API_KEY
npx wrangler deploy
```

Set `FROM_EMAIL` in the Cloudflare Worker dashboard before production use.

## Brevo setup

1. Create a Brevo account.
2. Add a sender under the transactional email / sender settings.
3. Verify the sender using the confirmation email.
4. Create an API key.
5. Store that API key only as the Cloudflare Worker secret `BREVO_API_KEY`.

Never put the Brevo API key in GitHub Pages, `assets/js/config.js`, or any browser-side JavaScript.

## Connect a client website

The frontend configuration should look like:

```js
window.GL_SITE_CONFIG = {
  siteId: "glanzlaw",
  contactEndpoint: "https://YOUR-WORKER.workers.dev"
};
```

The shared frontend JavaScript adds `_site_id` and `_page_url` to the submitted `FormData`.

## Add another client

Add another entry to `SITES`:

```js
aventura_auto: {
  name: "Aventura Auto Specialist",
  recipient: "owner@example.com",
  recipientName: "Owner",
  allowedOrigins: new Set([
    "https://example.com",
    "https://www.example.com"
  ]),
  subjectPrefix: "Website contact request"
}
```

Then set that site's frontend `siteId` to `aventura_auto`.

## Security properties

- Recipient addresses are server-side only.
- Each site ID has a strict origin allowlist.
- Required fields and email format are validated server-side.
- A honeypot field silently drops simple bot submissions.
- Submission size and field lengths are capped.
- Provider credentials live only in Cloudflare secrets.
- Email is sent as the central Glanzberg Web sender, with the visitor placed in Reply-To.
- No form data is intentionally stored by the Worker.

For higher traffic, add Cloudflare Turnstile and/or rate limiting before broad deployment.
