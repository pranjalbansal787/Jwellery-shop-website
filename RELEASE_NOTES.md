# Release notes

## v0.1.0 · Client demo MVP · 26 September 2026

**What's in it**

Storefront: editorial homepage built from reorderable sections, with a scroll-driven WebGL ring hero; mega menu and a full-screen mobile menu; category and collection pages with URL-persisted filters, live facet counts and load-more; product pages with metal, purity, stone, size and engraving, animated pricing, hover and full-screen zoom, a real-time 3D viewer, camera or photo try-on, a five-method ring sizer and WhatsApp enquiries prefilled with the exact configuration; a slide-out bag with gift packaging and complete-the-set; a three-step guest checkout with server-side re-pricing, coupons and a demo payment adapter; order confirmation with standard and made-to-order tracking; wishlist with sharing; appointment booking with live slot availability; boutique locator; gift finder; bespoke ring configurator; 4Cs and care guide; custom cursor; page transitions; SEO metadata, JSON-LD, sitemap and robots.

Super Admin: dashboard, orders (status workflow, refunds, notes), products (edit, variant price and stock, new drafts), categories and collections, inventory, customers and segments, appointments, WhatsApp and enquiries inbox, promotions, analytics, homepage section editor, brand and theme presentation mode, roles and permissions, audit log.

White-label: seven theme presets, accent override, three font pairings, button shape, currency, WhatsApp number, hero mode, cursor and motion intensity, all changed from the admin without touching code.

**Known limitations**

Demo data lives in memory and resets on restart. Payments are simulated. WhatsApp uses click-to-chat deep links (the Cloud API adapter is specified, not connected). Try-on uses manual placement; automatic hand and face tracking is planned. Customer accounts, returns, media uploads and the Laravel backend are the next milestones (see docs/ARCHITECTURE.md, Phase 13).

---

**Release notification (ready to send)**

> Solenne jewellery platform v0.1 is ready for client demos. It covers the full journey from a cinematic 3D homepage to checkout and order tracking, plus a Super Admin where the whole storefront can be re-branded for a prospect in about a minute. All content is demo data and payments are simulated. Start at /admin/brand-settings to dress it for your next meeting.
