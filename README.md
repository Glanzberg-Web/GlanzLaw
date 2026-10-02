# Glanzberg Law Firm, PLLC — GitHub Pages build

Static HTML/CSS/JavaScript website built for GitHub Pages and the custom domain `glanzlaw.com`.

## What is included

- `index.html` — temporary public “website in progress” landing page
- `jack.html` — full website homepage / preview entry point
- `practice-areas.html` — practice descriptions
- `jack-glanzberg.html` — attorney profile
- `mediation.html` — mediation page
- `representative-matters.html` — published decisions and current public dockets
- `contact.html` — consultation form UI
- `privacy.html` — privacy template
- `404.html` — GitHub Pages 404 page
- `assets/css/site.css` — site styling
- `assets/js/site.js` — responsive navigation + contact form behavior
- `assets/js/config.js` — one-line contact endpoint configuration
- `assets/img/jg-monogram.svg` — original monogram
- `assets/img/jack-placeholder.svg` — temporary headshot placeholder
- `SOURCES.md` — research provenance for public-facing factual claims
- `CONTENT_REVIEW.md` — items to confirm before launch
- `CNAME` — GitHub Pages custom-domain file
- `.nojekyll` — prevents unwanted Jekyll processing


## Temporary launch layout

The root domain (`https://glanzlaw.com/`) intentionally shows a minimal work-in-progress page. The full site is available at `https://glanzlaw.com/jack.html`. All navigation inside the full site returns to `jack.html`, not the temporary root landing page.

When the full site is ready to launch at the root, replace `index.html` with `jack.html` and change internal Home links/canonical metadata back to `/`.

## Deploying to GitHub Pages

Copy the contents of this folder to the repository used by GitHub Pages. If the repository already has a `CNAME` file, confirm that it contains the correct custom domain before replacing it.

For a simple branch-based Pages deployment, place the files in the repository root, commit, and push.

## Contact form

GitHub Pages is static hosting and cannot process form submissions by itself.

The form is already wired for an external form endpoint. Open:

`assets/js/config.js`

and set:

```js
window.GL_SITE_CONFIG = {
  contactEndpoint: "https://formspree.io/f/YOUR_FORM_ID"
};
```

A Formspree, Formspark, Basin, or equivalent endpoint that accepts `POST` + `FormData` and returns an HTTP success response will work with the bundled JavaScript.

Until an endpoint is configured, the page clearly directs visitors to call or email rather than silently losing their submission.

## Replacing Jack's portrait

No third-party photograph is included because a photograph being publicly viewable does not establish permission to republish it commercially.

Once Jack supplies a photograph he owns or has permission to use:

1. Save it in `assets/img/`, for example `jack-glanzberg.jpg`.
2. Replace both occurrences of:

```html
assets/img/jack-placeholder.svg
```

with:

```html
assets/img/jack-glanzberg.jpg
```

Recommended crop: vertical 4:5, at least 1200px tall.

## Updating from Git

On the Raspberry Pi mirror, if you keep one:

```bash
cd /var/www/glanzlaw
git pull --ff-only
```

For GitHub Pages itself, pushing to the configured Pages branch is enough.

## Content caveat

The website copy uses public professional profiles, official New York court decisions, federal public docket summaries, and a public federal filing containing the firm's contact information. Review `CONTENT_REVIEW.md` before publishing.
