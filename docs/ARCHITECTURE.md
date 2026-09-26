# Jewellery Commerce Platform: Architecture Foundation

White-label luxury jewellery commerce, built by the agency and re-dressed per client. This document covers the thirteen foundation phases from the brief. For each area it says what the **MVP (v0.1)** implements and what the **full platform** adds.

> MVP = Next.js storefront + Super Admin, running on a typed demo data layer that mirrors the Laravel API. It exists to put a credible, working product in front of prospective clients. The Laravel core is specified here and built next.

---

## Phase 1 · Product requirements

**Primary users**

| User | Needs |
|---|---|
| Shopper (browsing) | Inspiration, trust, understanding of stones/metals, fast discovery |
| Shopper (intent) | Exact configuration, size certainty, delivery date, secure payment |
| Client (post-purchase) | Tracking, certificates, invoices, aftercare, re-ordering |
| Advisor / store staff | Enquiries with context, appointments, client history |
| Merchandiser / catalogue manager | Products, variants, pricing, collections, media |
| Operations / finance | Orders, refunds, inventory, audit |
| Agency sales team | Re-brand the demo for a prospect in minutes |

**Scope by priority** (from the brief, with MVP status)

| Priority | Capability | MVP v0.1 |
|---|---|---|
| P0 | Design system + theme engine | Built: 7 presets, runtime tokens |
| P0 | Home, navigation, collections, PLP, PDP | Built |
| P0 | Cart, checkout (guest), confirmation | Built (demo payment adapter) |
| P0 | Responsive architecture | Built: 320 → 1920+ |
| P0 | Admin foundation, product/category management | Built |
| P1 | Wishlist, customers, orders, inventory | Built (guest wishlist, CRM read, order ops, variant stock) |
| P1 | WhatsApp, appointments, analytics, CMS | Built (deep links + inbox, booking, first-party events, homepage sections) |
| P2 | 3D viewer, try-on, ring sizer, configurator | Built (procedural 3D, manual try-on, 5-method sizer, bespoke configurator) |
| P3 | AI concierge, personalisation, loyalty | Architecture only (below) |

**Non-functional targets:** LCP < 2.0 s on 4G mid-range Android, INP < 200 ms, CLS < 0.05; WCAG 2.2 AA; OWASP ASVS L2; 20,000 SKUs and hundreds of thousands of monthly visitors without redesign.

---

## Phase 2 · Information architecture

```
/                         Editorial home (modular CMS sections)
/shop                     All jewellery (PLP)
/shop/[category]          Category PLP (nested taxonomy: Rings › Engagement …)
/collections              Editorial collections index
/collections/[slug]       Collection PLP
/products/[slug]          PDP (?metal= deep-links a variant)
/configure                Bespoke engagement ring configurator
/search?q=                Search results (natural-language parsing)
/gift-finder              Five-question curation
/ring-size                Sizing tools
/education                4Cs, metals, hallmarking, gemstones, care
/appointments             Booking (?service=&store=&product=)
/stores, /stores/[slug]   Locator + boutique pages
/wishlist, /wishlist/shared
/checkout                 Minimal chrome, 3 steps
/order/[number]           Confirmation + tracking (verified access)
/track                    Order lookup (number + email)
/admin/*                  Super Admin (noindex, RBAC)
```

Navigation: mega menu (categories + services + a featured tile), collections menu, direct links to Bridal, Gifts, Appointments, Boutiques. Mobile gets a full-screen menu with accordions and a WhatsApp CTA. Categories and collections are separate axes: taxonomy drives filters and breadcrumbs; collections drive storytelling and merchandising.

---

## Phase 3 · User flows

1. **Discovery → purchase:** Home hero → collection → PLP (filter) → PDP → configure metal/purity/stone/size/engraving → Add to bag (fly-to-bag) → drawer (gift packaging, complete-the-set) → checkout (contact → delivery or pickup → payment) → server re-prices & verifies payment → order page with timeline.
2. **Uncertain on size:** PDP → Find your size → chart / ring diameter / finger circumference / on-screen card calibration / printable → size saved to profile → pre-selected on every ring.
3. **High-consideration:** PDP → Enquire (WhatsApp with SKU, metal, size, URL prefilled) or Book a viewing (product carried into booking) → advisor confirms in admin.
4. **Bespoke:** /configure → 8 steps with live 3D and price → bag (server re-prices the encoded configuration) → checkout.
5. **Gifting:** Gift finder → curated six → PDP → gift wrap + handwritten card in drawer.
6. **Post-purchase:** order page (made-to-order stages: design confirmed → crafting → stone setting → polishing → QC) → WhatsApp on each status change → aftercare booking.
7. **Sales demo:** /admin/brand-settings → pick preset, rename, set WhatsApp and currency → apply → whole storefront re-dressed. `?previewTheme=` for quick switches.

---

## Phase 4 · Design system

**Tokens (CSS custom properties, injected on `<html>` at SSR, so no theme flash):**
`--background --surface --surface-elevated --foreground --muted --accent --accent-metal --accent-contrast --border --border-strong --stage --font-display --font-body --radius-button --motion-scale --duration-fast|normal|slow --ease-luxury --ease-expo --z-header|drawer|overlay|cursor --container --gutter`.

Tailwind v4 `@theme inline` maps utilities (`bg-bg`, `text-muted`, `border-line`, `font-serif` …) onto these variables. Components never hardcode colours.

**Presets:** Midnight Gold (default `#0B0D0E` + burnished gold), Champagne (light), Platinum, Emerald, Rose (light), Sapphire, Ruby. Any preset takes an accent override.

**Typography:** Cormorant Garamond (display) + DM Sans (UI) by default; Playfair + Inter and Bodoni Moda + Manrope are selectable. All self-hosted (OFL), with no Google Fonts dependency. Licensed Canela / Neue Haas can drop in through the same `--font-display/--font-body` variables. Fluid `clamp()` scale: `display-2xl` (48–116 px), `display-xl`, `display-lg`, `display-md`, `display-sm`, `kicker` (11 px, 0.24em tracking), `lede`, `caption`.

**Grid:** 4 / 8 / 12 columns (`grid-editorial`), 1680 px container, fluid gutter `clamp(1rem, 3.2vw, 3.5rem)`, section rhythm `clamp(4.5rem, 10vw, 10rem)`.

**Components:** buttons (primary / accent / outline, sizes), chips, fields (underline + boxed), dialogs (native `<dialog>`), drawer, bottom sheet, accordion, breadcrumbs, product card, price (animated), wish button, badges, skeletons. Texture: sub-threshold film grain; product imagery sits on a radial "stage".

---

## Phase 5 · Motion language

| Category | Implementation | Timing |
|---|---|---|
| Entrance | Fade-rise on view (`Reveal`) | 1000 ms, expo-out |
| Reveal | Line-mask headline (`MaskText`) | 1100 ms, 90 ms stagger |
| Navigation | Mega menu fade-drop; mobile menu clip-path wipe | 350 / 600 ms |
| Hover | Card image cross-fade to detail render; underline draw | 900 / 420 ms |
| Magnetic | CTA spring toward pointer; cursor ring gravitates to buttons | spring 220/18 |
| Product transition | Variant image cross-fade; digits roll on price change | 450 / 350 ms |
| Scroll narrative | Hero: ring rotates, camera approaches stone, copy layers swap | scroll-linked |
| 3D interaction | Idle rotation, damped orbit, pointer parallax | continuous |
| Cart | Fly-to-bag ghost + bag pulse; drawer slide | 750 / 600 ms |
| Feedback | Wishlist heart spring; form success states | 150–250 ms |

Page transitions: a veil lifts while the next page rises (550 ms), skipped on first paint to protect LCP. `prefers-reduced-motion` or brand motion "off" disables all of it; "subtle" halves amplitudes via `useMotionLevel()`. Everything is legible with animation stopped.

Custom cursor: dot + spring-lagged ring; states come from markup (`data-cursor="view|drag|explore|360|try|zoom"`, links, buttons with magnetic pull). Disabled on coarse pointers, reduced motion, or by brand setting.

**Dependency decisions:** Motion for React covers entrance, layout, gestures and scroll-linked values, so **GSAP was not added** (it can come in for a future campaign timeline that needs it). **Lenis was not added**: native scrolling keeps accessibility, find-in-page and scroll restoration intact, and the scroll narrative works on native scroll.

---

## Phase 6 · Technical architecture

```
Browser ──► Next.js 16 (App Router, RSC, Server Actions)  ──► Laravel 12 API (domain core)
              │  storefront + admin UI                        │  PostgreSQL · Redis · queues
              │  proxy.ts (theme preview)                     │  Meilisearch · S3/CDN
              │  /api/search, /api/events, /api/products      │  Payment / WhatsApp / Email / SMS adapters
              └─ src/server/repo/* ◄── only seam to data ─────┘
```

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind v4, Motion, Three.js + React Three Fiber + Drei (3D only loads via `next/dynamic` where needed), Zustand for genuinely shared client state (bag, wishlist, profile, UI), zod for validation. No TanStack Query yet: server components and server actions cover data fetching; it comes in with account pages that need client-side caching.
- **Data seam:** `src/server/repo/*` exposes async functions (`listProducts`, `getProduct`, `searchCatalog`, `insertOrder` …) that return the domain types in `src/lib/types.ts`. In the MVP they read an in-process demo store (`src/server/db.ts`). Moving to Laravel replaces those function bodies with API calls, and pages don't change.
- **Backend (target):** Laravel 12 / PHP 8.3, modular domains, Sanctum for SPA auth, Horizon for queues, Scout + Meilisearch, Cashier-style payment adapters, Spatie Permission for RBAC, Spatie Activitylog (or a custom append-only table) for audit.
- **Multi-brand:** every tenant-scoped table carries `brand_id`; brand resolved from the request host. The MVP stores brand settings in a cookie, so each salesperson can dress their own demo.

---

## Phase 7 · Database schema (PostgreSQL)

All tables: `id` (ULID), `created_at`, `updated_at`; tenant tables add `brand_id` FK + index. Soft deletes only on `products`, `categories`, `collections`, `customers`.

```sql
brands(id, name, domain UNIQUE, theme JSONB, currency, locale, whatsapp, contact JSONB, payments JSONB, analytics JSONB)
users(id, brand_id, name, email UNIQUE, password, mfa_secret NULL, last_login_at)          -- staff
roles / permissions / model_has_roles / role_has_permissions                              -- spatie
customers(id, brand_id, user_id NULL, name, email, phone, preferred_store_id NULL, ring_size NULL,
          marketing_consent BOOL, whatsapp_consent BOOL, loyalty_tier NULL, important_dates JSONB NULL)
  UNIQUE(brand_id, email)
addresses(id, customer_id FK, label, name, line1, line2, city, state, pincode, country, phone, is_default)
categories(id, brand_id, parent_id NULL FK self, slug, name, description, position, published, seo JSONB)
  UNIQUE(brand_id, slug), INDEX(parent_id, position)
collections(id, brand_id, slug, name, kicker, description, hero_media_id, position, published, starts_at, ends_at)
products(id, brand_id, slug, sku, name, subtitle, description, story, category_id FK, gender, occasions TEXT[],
         design_key, hallmark, visibility ENUM(draft,scheduled,published,archived), publish_at NULL,
         status ENUM(in_stock,low_stock,made_to_order,preorder,out_of_stock,discontinued),
         engravable BOOL, seo JSONB, is_demo BOOL)
  UNIQUE(brand_id, slug), UNIQUE(brand_id, sku), INDEX(category_id, visibility), GIN(occasions)
product_categories(product_id, category_id) PK(product_id, category_id)                  -- secondary placements
collection_products(collection_id, product_id, position) PK(collection_id, product_id)
product_variants(id, product_id FK, sku UNIQUE, metal, purity, gem, shape, carat NUMERIC(5,2),
                 price_minor BIGINT, compare_at_minor NULL, weight_grams NUMERIC(6,2), lead_days, active)
  INDEX(product_id, metal, purity, gem)
diamond_specs(id, variant_id FK UNIQUE, carat, cut, colour, clarity, shape, fluorescence, origin,
              dimensions, certificate_lab, certificate_no)
product_media(id, product_id, variant_id NULL, kind ENUM(image,video,spin360), url, width, height, alt, position)
product_3d_assets(id, product_id, variant_id NULL, glb_url, draco BOOL, ktx2 BOOL, lod_urls JSONB, bytes, poster_url, status)
inventory_locations(id, brand_id, type ENUM(store,warehouse), store_id NULL, name)
inventory(id, variant_id FK, location_id FK, on_hand, reserved, low_threshold) UNIQUE(variant_id, location_id)
carts(id, brand_id, customer_id NULL, token UNIQUE, currency, coupon_code NULL, gift JSONB, expires_at)
cart_items(id, cart_id FK, variant_id NULL, config JSONB NULL, size, engraving, qty, unit_price_minor)
orders(id, brand_id, number UNIQUE, customer_id NULL, email, phone, status, payment_status,
       subtotal_minor, discount_minor, shipping_minor, tax_minor, total_minor, currency,
       shipping_address JSONB, fulfilment ENUM(delivery,pickup), store_id NULL, gift JSONB, made_to_order BOOL)
  INDEX(brand_id, created_at DESC), INDEX(status)
order_items(id, order_id FK, variant_id NULL, config JSONB NULL, name, sku, size, engraving, qty, unit_price_minor)
order_events(id, order_id FK, status, note, actor_id NULL, at)
payments(id, order_id FK, provider, provider_ref UNIQUE, method, amount_minor, status, raw JSONB)
refunds(id, payment_id FK, amount_minor, reason, provider_ref, status, actor_id)
shipments(id, order_id FK, carrier, tracking_no, status, dispatched_at, delivered_at)
wishlists(id, customer_id FK UNIQUE, share_token UNIQUE)
wishlist_items(id, wishlist_id FK, product_id, variant_id NULL, notify_price BOOL, notify_stock BOOL)
stores(id, brand_id, slug, name, city, address, lat, lng, phone, whatsapp, hours JSONB, services TEXT[])
appointments(id, brand_id, service, store_id NULL, advisor_id NULL, customer_id NULL, name, email, phone,
             starts_at, duration_min, status, notes, product_id NULL)  INDEX(store_id, starts_at)
advisor_availability(id, advisor_id, store_id, weekday, start_time, end_time)
promotions(id, brand_id, type, value, scope JSONB, min_order_minor, starts_at, ends_at, usage_limit, used, active)
coupons(id, promotion_id FK, code, usage_limit, used) UNIQUE(code)
gift_cards(id, brand_id, code_hash UNIQUE, balance_minor, currency, expires_at)
reviews(id, product_id, customer_id, rating SMALLINT, body, status, verified_purchase BOOL)
enquiries(id, brand_id, channel, customer_id NULL, name, phone, subject, message, product_id NULL, order_id NULL, status, assignee_id NULL)
whatsapp_conversations(id, brand_id, wa_id, customer_id NULL, status, assignee_id NULL, last_message_at, unread)
whatsapp_messages(id, conversation_id FK, direction, template NULL, body, wa_message_id UNIQUE, status, at)
notifications(id, channel, recipient, template, payload JSONB, status, sent_at)
cms_pages(id, brand_id, slug, title, seo JSONB, published)
cms_sections(id, page_id FK, type, position, enabled, props JSONB)
analytics_events(id, brand_id, name, session_id, customer_id NULL, props JSONB, at)  -- partitioned by month
audit_logs(id, brand_id, actor_id, action, resource_type, resource_id, before JSONB, after JSONB, ip INET, user_agent, at)
```

Money is stored as integer minor units. No EAV: variant options are explicit columns; genuinely open-ended attributes live in typed JSONB on `diamond_specs` or `products.seo`.

---

## Phase 8 · API architecture

REST, versioned (`/api/v1`), JSON:API-style resources, cursor pagination, ETags on catalogue reads.

**Storefront (public / customer):**
`GET /brand` · `GET /categories` · `GET /collections[/:slug]` · `GET /products?filter[category]=&filter[metal][]=&filter[price]=&sort=&cursor=` (includes facet counts) · `GET /products/:slug` · `GET /search?q=` (parsed intent + results) · `POST /carts` · `PATCH /carts/:token` · `POST /carts/:token/items` · `POST /checkout/quote` · `POST /checkout` → payment intent · `POST /payments/:provider/webhook` (signature-verified) · `GET /orders/:number` (signed or authenticated) · `POST /appointments` · `GET /availability?store=&date=` · `POST /enquiries` · `POST /events` · `GET|POST /wishlist` · `POST /auth/*` (Sanctum).

**Admin:** `/admin/v1/*` mirrors the modules below; every write checks a Policy and emits an audit event.

**MVP mapping:** Next.js server actions (`src/server/actions/*`) and route handlers (`/api/search`, `/api/events`, `/api/products`) play these roles today and carry the same validation schemas (zod ↔ Laravel Form Requests).

**Laravel module layout:**
```
app/Domain/{Catalog,Inventory,Pricing,Cart,Checkout,Orders,Customers,Promotions,Payments,
            Fulfilment,Appointments,Messaging,CMS,Stores,Media,Analytics,Identity}/
   Actions/  (PlaceOrder, ReserveStock, ApplyCoupon, BookAppointment …)
   Data/     (spatie/laravel-data DTOs)
   Enums/    Events/  Listeners/  Jobs/  Policies/  Models/
app/Http/Controllers/Api/V1/* (thin) · app/Http/Requests/* · app/Http/Resources/*
```
Queued jobs: emails, WhatsApp templates, SMS, image derivatives (AVIF/WebP), 3D optimisation (gltf-transform: Draco + KTX2 + LOD), invoice PDFs, search indexing, analytics roll-ups, reminders.

---

## Phase 9 · Admin architecture

| Module | MVP v0.1 |
|---|---|
| Dashboard | Revenue today/MTD/YTD/30d with trend, orders, AOV, conversion, abandoned checkouts, return rate, daily revenue chart, top products & collections, inventory warnings, recent orders, upcoming appointments, clienteling |
| Orders | List with status groups + search; detail with items, customer, payment, allowed status transitions, refunds (permission-gated), internal notes, audit trail |
| Products | List/filter/search; edit copy, category, collections, badges, visibility, availability; per-variant price & stock (separately permissioned); create draft from template |
| Categories & collections | Nested tree, reorder, publish/unpublish; collection visibility |
| Inventory | Variant-level stock with low/out/MTO filters and inline adjustment |
| Customers | Segments (VIP, Repeat, High Intent, Bridal, Dormant, Appointment Lead), LTV, AOV, consent; profile with orders and appointments |
| Appointments | Day-grouped agenda, confirm/cancel/complete |
| Enquiries & WhatsApp | Unified inbox, product/order context, assign/resolve, template replies |
| Promotions | Coupons with thresholds, windows, limits; pause/activate |
| Analytics | Funnel, engagement (wishlist, 3D, try-on, WhatsApp), search terms incl. no-result, live event stream |
| Homepage content | Drag-and-drop section order + visibility, publish |
| Brand & theme | Client presentation mode with live preview |
| Users & roles | Permission matrix; demo role switcher |
| Audit log | Actor, action, resource, before/after, IP, UA |

Roadmap modules (shown as such in the sidebar): Returns, Shipping, Gift cards, Media & 3D assets, Reviews, SEO, Pages.

---

## Phase 10 · 3D / AR strategy

- **Source of truth:** a jewellery model (GLB) per design, with metal/gem variants as material swaps rather than separate files.
- **MVP:** procedural parametric models (`src/lib/jewels/builders.ts`) for 14 designs. The same code drives the live R3F viewer/hero and an offline render pipeline (`npm run render:jewellery`: headless Chromium → transparent WebP studio shots), so photos, 3D and variants always agree. Gems use a faceted geometry with a dedicated high-contrast "sparkle" environment and an internal back-face layer for depth; metals use PBR with a studio softbox environment.
- **Production pipeline:** CAD (Matrix/Rhino) → glTF → `gltf-transform` (Draco geometry, KTX2/Basis textures, 3 LODs) → S3 → CDN. Viewer loads a poster first, then LOD2 on interaction, then LOD0 on zoom. Upgrade gem shading to a refraction shader (e.g. Drei `MeshRefractionMaterial`) on capable GPUs.
- **Loading rules:** 3D never ships in the initial bundle; it loads via `next/dynamic` on intent (tab click) or proximity (IntersectionObserver). The hero respects Save-Data, WebGL availability and the brand's hero mode, with a server-rendered poster as LCP.
- **Try-on abstraction:** `TryOnProvider` implementations: `ManualOverlayProvider` (MVP: camera or photo, drag/scale/rotate, capture, share, add exact configuration to bag), `MediaPipeHandsProvider` (rings/bracelets on hand landmarks), `FaceMeshProvider` (earrings/necklaces), `CommercialArProvider` (third-party SDK). Includes a permission flow, privacy copy ("processed on device"), capability detection, a denied state and a photo fallback.

---

## Phase 11 · Performance plan

- RSC by default. Client components are only interactive leaves; listing cards receive a minimal projection (`toCard`).
- Images: `next/image` with AVIF/WebP, responsive `sizes`, eager/high priority only for the LCP image, immutable cache headers on renders.
- Fonts: self-hosted variable WOFF2; only the active pair preloads.
- Code splitting: Three.js/R3F isolated in dynamic chunks; the 3D hero mounts after the poster paints and pauses its frame loop off-screen.
- Filtering: `useTransition` + `router.replace(scroll:false)` keeps the old results visible and dimmed while new ones stream.
- Scale: Meilisearch for PLP/search at 20k SKUs; Redis cache for catalogue reads; CDN edge caching of anonymous PLP/PDP HTML with brand-keyed cache tags and revalidation on publish; DB indexes as listed in Phase 7.

## Phase 12 · Security model

- **Pricing is server-authoritative:** checkout re-prices every line from the catalogue, including bespoke configurations decoded and priced on the server.
- **Payments:** hosted provider UI; webhook signature verification; no card data touches our servers (PCI SAQ-A).
- **Validation:** zod on every action/route (Laravel Form Requests in the API).
- **CSRF:** Next server actions enforce same-origin; Laravel uses Sanctum CSRF for the SPA.
- **XSS:** React escaping; JSON-LD serialised with `<` escaped; no `dangerouslySetInnerHTML` elsewhere.
- **Headers:** `nosniff`, `Referrer-Policy`, `X-Frame-Options`, a scoped `Permissions-Policy` (camera=self for try-on). A strict CSP follows once third-party analytics are fixed.
- **Order privacy:** order pages require the placing browser's HttpOnly cookie, or number + email verification.
- **RBAC:** permission names (`product.update`, `pricing.modify`, `inventory.modify`, `order.refund`, `brand.manage` …) are checked server-side in every admin action and mirrored in the UI.
- **Audit:** price, stock, status, refund, brand, content and taxonomy changes are recorded with before/after, actor, IP and UA.
- **Rate limiting:** events endpoint limited per IP (MVP in-memory; production Redis sliding window). Login/OTP/checkout endpoints get stricter limits.
- **To add with auth:** MFA for staff, session rotation, admin IP allow-list, signed S3 upload URLs with MIME/size checks and AV scanning.

## Phase 13 · Implementation roadmap

| Phase | Deliverables |
|---|---|
| **v0.1 (this MVP)** | Storefront, Super Admin, theme engine, 3D/try-on/sizer/configurator, demo data |
| **v0.2 · Laravel core (4–5 wks)** | Catalog, Inventory, Pricing, Orders, Customers, Identity; seeders from `src/data`; swap `src/server/repo` to API; Postgres, Redis, Horizon |
| **v0.3 · Payments & messaging (3 wks)** | Razorpay/Cashfree adapters + webhooks, invoices, WhatsApp Cloud API (templates, inbox sync), email/SMS, appointment reminders |
| **v0.4 · Accounts (3 wks)** | Customer login (OTP), account dashboard (orders, certificates, invoices, sizes, addresses, appointments), server wishlist with alerts |
| **v0.5 · Media & search (3 wks)** | S3 uploads, derivative pipeline, GLB pipeline, Meilisearch, CMS section editing, SEO module |
| **v0.6 · Scale & hardening** | CSP, load tests, CDN caching, multi-brand host routing, observability |
| **P3** | AI concierge (RAG over catalogue/policy; commercial facts only via tool calls to the API: never generated), personalisation, loyalty tiers, recommendations |
