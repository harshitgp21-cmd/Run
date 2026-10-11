# Alex Rivera — Portfolio Website

A minimalist, professional portfolio site for a web developer. Four pages, no
frameworks, no build step — just hand-written HTML, CSS and vanilla JavaScript.

---

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Landing page — hero, trust strip, services preview, stats, featured work, process, testimonials, CTA |
| `services.html` | Four detailed services, engagement models with pricing, process, FAQ |
| `projects.html` | Filterable case-study grid (All / Front-end / Full-stack / Performance / Commerce) + results band |
| `contact.html` | Validated enquiry form, direct contact details, "what happens next", FAQ |
| `404.html` | Friendly not-found page with routes back into the site |

## Project structure

```
.
├── index.html
├── services.html
├── projects.html
├── contact.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── package.json          # dev-only: `npm test`
├── assets/
│   └── favicon.svg
├── css/
│   └── styles.css        # design tokens + components + responsive rules
├── js/
│   └── main.js           # all shared behaviour
└── tests/
    └── smoke.test.js     # jsdom smoke tests for the interactions
```

## Running it locally

There is nothing to install. Any static server works:

```bash
# Python
python3 -m http.server 8000

# or Node
npx serve .
```

Then open <http://localhost:8000>.

You can also just double-click `index.html` — every path in the project is
relative, so it works straight from the filesystem.

## Features

- **Responsive** from 320px phones up to ultrawide displays.
- **Dark / light theme** with a toggle, `localStorage` persistence and a
  `prefers-color-scheme` default. An inline script sets the theme before first
  paint so there is no flash of the wrong palette.
- **Accessible**: semantic landmarks, a skip link, visible focus rings,
  `aria-current` on the active nav item, `aria-pressed` on filter buttons,
  `aria-live` project count, keyboard-operable mobile menu, and full support for
  `prefers-reduced-motion`.
- **Progressive enhancement**: with JavaScript disabled every page is still
  readable and navigable; the reveal animations simply don't run.
- **Interactive touches**: scroll-progress bar, sticky header shadow, animated
  stat counters, scroll-reveal via `IntersectionObserver`, back-to-top button,
  project filtering, and `?service=` deep links that pre-select the contact
  form dropdown.
- **Client-side form validation** with inline error messages, `aria-invalid`
  states and a success confirmation.

## Testing

A smoke-test suite drives the real `js/main.js` against every page using jsdom.
It exercises the theme toggle, mobile nav, scroll-reveal fallback, stat counters,
project filtering, form validation and the `?service=` deep link.

```bash
npm install     # installs jsdom, the only dev dependency
npm test
```

Expected output: `77 passed, 0 failed`.

## Customising

Almost everything visual is driven by custom properties at the top of
`css/styles.css`. To re-brand the site, change the tokens rather than the rules:

```css
:root {
  --accent: #2f5cf5;   /* brand colour            */
  --bg:     #ffffff;   /* page background         */
  --ink:    #0c0e12;   /* headings                */
  --radius-lg: 20px;   /* large corner radius     */
  --container: 1140px; /* max content width       */
}
```

Dark-mode values live in the `:root[data-theme="dark"]` block directly below.

### Replacing the placeholder content

- **Name / brand** — search for `Alex Rivera` and `A<span>R</span>` across the
  HTML files, plus `assets/favicon.svg`.
- **Contact details** — `hello@alexrivera.dev` and `+44 113 496 0000` appear in
  `contact.html` and the footer of every page.
- **Canonical URLs** — replace `https://example.com/` in the `<link rel="canonical">`
  and Open Graph tags, plus `robots.txt` and `sitemap.xml`.
- **Project thumbnails** — the cards currently use CSS-generated `.thumb`
  placeholders. Swap in real screenshots by replacing the `<div class="thumb">`
  with an `<img>`:

  ```html
  <div class="project__media">
    <img src="assets/projects/kestrel.png"
         alt="Kestrel Analytics dashboard showing a live event stream"
         width="1280" height="800" loading="lazy">
  </div>
  ```

## Wiring up the contact form

The form is front-end only — it validates input and then shows a success
message. To make it send real email, either:

1. **Point it at a form service** (Formspree, Basin, Netlify Forms). Add the
   `action` and `method` attributes to the `<form>` tag and delete the
   `e.preventDefault()` branch in `js/main.js`:

   ```html
   <form class="form" data-validate action="https://formspree.io/f/xxxx" method="POST">
   ```

2. **Post it to your own endpoint** inside the submit handler in `js/main.js`,
   replacing the `window.setTimeout(...)` simulation with a `fetch()` call.

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). Uses
`color-mix()`, CSS nesting-free custom properties, `backdrop-filter`,
`IntersectionObserver` and `aspect-ratio`, all of which are widely supported.
Layouts degrade gracefully where a feature is missing.

## Deployment

Upload the repository as-is to any static host — GitHub Pages, Netlify, Vercel,
Cloudflare Pages or plain shared hosting. No build command, no output directory.

For GitHub Pages: **Settings → Pages → Source: Deploy from a branch**, then pick
your branch and `/ (root)`.

## Licence

The code is yours to use and adapt. Replace the placeholder copy, name, project
descriptions and testimonials with your own before publishing.
