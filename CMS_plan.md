# CMS Plan – dodawanie nowych bukietów

## Option 1: Decap CMS (formerly Netlify CMS) — recommended
**"Real admin panel, no backend"**

- Adds a `/admin` page with a proper UI (forms, image upload, rich text)
- Products stored as JSON/markdown files in a Git repo
- Saving in the admin auto-deploys the site (Netlify rebuild takes ~30 sec)
- Completely free
- **Catch:** requires setting up a GitHub repo (one-time, ~15 min)

This is the closest to a "real CMS" with zero backend complexity.

---

## Option 2: Netlify Blobs + custom admin page
**"No Git, custom UI"**

- Products stored in Netlify's built-in key-value storage (free)
- Simple password-protected `/admin.html` — Ada fills a form, hits Save
- Two small Netlify Functions: read-products + save-products
- Shop page renders products from the blob dynamically (JS fetch on load)
- **Catch:** photo upload still needs a solution (e.g. Cloudinary free tier — Ada uploads photo there, pastes the URL)

About 1–2 days of dev work.

---

## Option 3: HTML snippet generator (zero backend)
**"Simplest possible"**

- `/admin.html` — Ada fills a form (name, desc, sizes/prices, image URL)
- Page generates the HTML snippet for the product card
- Ada copy-pastes it into `sklep.html` and `index.html`
- No server, no storage, nothing to configure
- **Catch:** not fully automated — still requires touching HTML files manually

---

## Recommendation

- **Option 1** if willing to spend 15 min setting up a GitHub repo — gives Ada a proper admin experience and photos just work.
- **Option 2** if you want to avoid Git entirely.
- **Option 3** if you want something done in under an hour with zero risk.
