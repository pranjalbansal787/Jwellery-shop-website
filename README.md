# Solenne · Jewellery Commerce Platform (MVP v0.1)

A white-label luxury jewellery storefront and Super Admin. The demo house "Solenne" is fictional; every product, price, certificate, customer and order is **demo data**.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
# production
npm run build && npm start
```

Node 20+ is required. There's no database to set up: the MVP runs on an in-process demo store that resets when the server restarts.

## Where to click in a client demo

| Show | Go to |
|---|---|
| Cinematic WebGL hero (scroll it) | `/` |
| Filters, facets, load more | `/shop/rings` |
| PDP: variants, 3D, zoom, try-on, ring size, WhatsApp | `/products/elan-solitaire-ring` |
| Bespoke configurator with live 3D + price | `/configure` |
| Natural-language search | search icon → “gold ring under 50000” |
| Gift finder | `/gift-finder` |
| Guest checkout (use code `DIWALI26` over ₹1 lakh) | bag → Checkout |
| Order tracking | after checkout, or `/track` |
| Appointments | `/appointments` |
| **Re-brand the platform for a prospect** | `/admin/brand-settings` |
| Quick theme preview | `/?previewTheme=champagne` (exit with `?previewTheme=off`) |
| Admin dashboard, orders, products, audit | `/admin` |
| Role-based access | switch role in the admin top bar |

## Project map

```
src/app/(store)        storefront routes
src/app/(checkout)     minimal-chrome checkout
src/app/admin          Super Admin
src/components         design system, layout, product, PDP, home, admin, 3D
src/lib                brand/theme engine, types, search parser, configurator, SEO, analytics bus
src/lib/jewels         procedural jewellery models (shared by 3D viewer and render pipeline)
src/server/repo        data access seam (swap to Laravel API here)
src/server/actions     server actions (checkout, appointments, admin) with validation + RBAC + audit
src/data               demo catalogue and operational seed data
public/renders         studio renders generated from the 3D models
scripts/render         headless render pipeline (npm run render:jewellery)
docs/ARCHITECTURE.md   the 13-phase foundation (requirements → roadmap)
```

## Regenerating product imagery

```bash
npx esbuild scripts/render/make-jobs.ts --bundle --platform=node --alias:@=./src --outfile=scripts/render/.make-jobs.cjs && node scripts/render/.make-jobs.cjs
CHROMIUM_PATH=/path/to/chrome FORCE=1 npm run render:jewellery
```

## Deploying a demo

Any Node host works (Vercel, Render, a VM). Set `NEXT_PUBLIC_SITE_URL` for canonical URLs and the sitemap. Because demo state lives in memory, orders placed during a demo persist only while that server instance is running.
# Jwellery-shop-website
# Jwellery-shop-website
