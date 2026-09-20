# Cleanup Execution Checklist

**Created:** 2025-01-20  
**Target:** حبيب الحبايب (Egyptian Supermarket)  
**Total Phases:** 8 (Phases 1–5 core, 6–8 future)  
**Estimated Duration:** 3–4 weeks (Phases 1–6)

---

## ⚠️ PRE-FLIGHT (Before Phase 1)

- [ ] Review `ARCHITECTURE_AUDIT.md` — full context
- [ ] Review `ARCHITECTURE_SUMMARY.md` — quick reference
- [ ] Confirm no redesign/rewrite in scope
- [ ] Confirm no framework changes needed
- [ ] Prepare Egyptian supermarket product data (groceries, bakery, etc.)
- [ ] Backup current codebase (git branch or tag)
- [ ] Create task/issue for tracking cleanup phases

---

## 🔴 PHASE 1: CUSTOMER AUTH REMOVAL (Week 1)

**Goal:** Remove login/register/account pages; keep admin auth  
**Duration:** ~1 day  
**Effort:** EASY  
**Risk:** NONE  
**Files Affected:** 9

### 1.1 Delete Pages

- [ ] Delete `/app/(store)/auth/login/page.tsx`
- [ ] Delete `/app/(store)/auth/register/page.tsx`
- [ ] Delete `/app/(store)/auth/forgot-password/page.tsx`
- [ ] Delete `/app/(store)/auth/layout.tsx`
- [ ] Delete `/app/(store)/account/page.tsx`
- [ ] Delete `/app/(store)/account/addresses/page.tsx`
- [ ] Delete `/app/(store)/account/orders/page.tsx`
- [ ] Delete `/app/(store)/account/settings/page.tsx`
- [ ] Delete `/app/(store)/account/layout.tsx`
- [ ] Delete `/app/(store)/auth/` directory (empty)
- [ ] Delete `/app/(store)/account/` directory (empty)
- [ ] Delete `src/components/auth/auth-card-layout.tsx`

### 1.2 Update Header Component

- [ ] Edit `src/components/layout/header.tsx`
  - [ ] Remove `import { useAuthStore } from "@/store/auth"`
  - [ ] Remove `const user = useAuthStore((s) => s.user)`
  - [ ] Remove `const isAuthenticated = useAuthStore((s) => s.isAuthenticated)`
  - [ ] Remove `const logout = useAuthStore((s) => s.logout)`
  - [ ] Remove user avatar dropdown menu (lines ~150–180)
  - [ ] Remove wishlist link (desktop only link to `/wishlist`)
  - [ ] Remove login button (User icon link to `/auth/login`)
  - [ ] Verify cart button still works
  - [ ] Verify search button still works

### 1.3 Update Navigation

- [ ] Edit `src/lib/navigation.ts`
  - [ ] Remove `accountLinks` array
  - [ ] Remove `accountLinks` from `mobileMenuSections`

### 1.4 Update Sitemap

- [ ] Edit `src/app/sitemap.ts`
  - [ ] Remove `/auth/*` routes
  - [ ] Remove `/account/*` routes

### 1.5 Verify

- [ ] No broken imports in header
- [ ] Header renders without auth UI
- [ ] Cart icon still visible + functional
- [ ] Search button still visible + functional
- [ ] Homepage renders without errors
- [ ] `/admin` still protected (admin guard works)
- [ ] Checkout still works (no login required)
- [ ] No TypeScript errors in `npm run build`

### 1.6 Commit

```bash
git add -A
git commit -m "refactor: Remove customer authentication system

- Delete /auth (login, register, forgot-password)
- Delete /account (profile, addresses, orders, settings)
- Remove auth store from header
- Remove user menu, wishlist, login button
- Keep admin auth guard for /admin protection
- Reason: No customer accounts required per spec
"
```

---

## 🟡 PHASE 2: WISHLIST REMOVAL (Week 1)

**Goal:** Remove wishlist feature  
**Duration:** ~0.5 day  
**Effort:** EASY  
**Risk:** NONE  
**Files Affected:** 5

### 2.1 Delete Pages & Routes

- [ ] Delete `/app/(store)/wishlist/page.tsx`
- [ ] Delete `/app/(store)/wishlist/layout.tsx`
- [ ] Delete `/app/(store)/wishlist/` directory (empty)

### 2.2 Delete Stores

- [ ] Delete `src/store/wishlist.ts`

### 2.3 Update Product Card

- [ ] Edit `src/components/products/product-card.tsx`
  - [ ] Remove `import { useWishlistStore } from "@/store/wishlist"`
  - [ ] Remove `const wishlistItems = useWishlistStore((s) => s.items)`
  - [ ] Remove `const addItem = useWishlistStore((s) => s.addItem)`
  - [ ] Remove `const removeItem = useWishlistStore((s) => s.removeItem)`
  - [ ] Remove `const [mounted, setMounted] = useState(false)` (if only used for wishlist)
  - [ ] Remove `useEffect(() => setMounted(true), [])` (if only used for wishlist)
  - [ ] Remove `const isWishlisted = ...` logic
  - [ ] Remove `handleWishlist` function
  - [ ] Remove heart icon button (entire <button> element with Heart icon)
  - [ ] Verify product card still renders with image + title + price

### 2.4 Update Navigation

- [ ] Edit `src/lib/navigation.ts`
  - [ ] Remove `{ name: "Wishlist", href: "/wishlist" }` from `accountLinks` (if not already removed in Phase 1)

### 2.5 Update Header (if not done in Phase 1)

- [ ] Edit `src/components/layout/header.tsx`
  - [ ] Verify wishlist link is removed (should be gone if Phase 1 done)

### 2.6 Verify

- [ ] Product cards render without heart icon
- [ ] No broken imports
- [ ] ProductCard still shows image, title, price
- [ ] Homepage renders correctly
- [ ] Product detail page renders correctly
- [ ] No TypeScript errors in `npm run build`

### 2.7 Commit

```bash
git add -A
git commit -m "refactor: Remove wishlist feature

- Delete /wishlist page
- Delete useWishlistStore
- Remove heart icon from product cards
- Reason: Not in supermarket spec
"
```

---

## 🟡 PHASE 3: BLOG, BRANDS, PAGES REMOVAL (Week 1)

**Goal:** Remove template content systems  
**Duration:** ~1 day  
**Effort:** EASY  
**Risk:** NONE  
**Files Affected:** 12

### 3.1 Delete Pages & Routes

- [ ] Delete `/app/(store)/blog/page.tsx` (blog listing)
- [ ] Delete `/app/(store)/blog/[slug]/page.tsx` (blog post)
- [ ] Delete `/app/(store)/blog/` directory (empty)
- [ ] Delete `/app/(store)/brands/page.tsx`
- [ ] Delete `/app/(store)/about/page.tsx`
- [ ] Delete `/app/(store)/contact/page.tsx`
- [ ] Delete `/app/(store)/faq/page.tsx`
- [ ] Delete `/app/(store)/pages/page.tsx` (CMS pages listing)
- [ ] Delete `/app/(store)/pages/[slug]/page.tsx` (CMS page detail)
- [ ] Delete `/app/(store)/pages/` directory (empty)

### 3.2 Delete Repositories & Data

- [ ] Delete `src/lib/repositories/json-blog-repository.ts`
- [ ] Delete `src/lib/repositories/json-brand-repository.ts`
- [ ] Delete `src/lib/repositories/json-page-repository.ts`
- [ ] Delete `src/data/blog.json`
- [ ] Delete or prune `src/data/pages.json` (keep only if policies are there)

### 3.3 Update Repository Exports

- [ ] Edit `src/lib/repositories/index.ts`
  - [ ] Remove `export { jsonBlogRepository as blogRepository } from "./json-blog-repository"`
  - [ ] Remove `export { jsonBrandRepository as brandRepository } from "./json-brand-repository"`
  - [ ] Remove `export { jsonPageRepository as pageRepository } from "./json-page-repository"`

### 3.4 Update Footer

- [ ] Edit `src/components/layout/footer.tsx`
  - [ ] In `footerLinks`, remove:
    - [ ] `{ name: "All Brands", href: "/brands" }`
    - [ ] `{ name: "Blog", href: "/blog" }`
    - [ ] `{ name: "Contact", href: "/contact" }`
    - [ ] `{ name: "FAQ", href: "/faq" }`
    - [ ] `{ name: "About", href: "/about" }`
    - [ ] `{ name: "Pages", href: "/pages" }`
  - [ ] KEEP:
    - [ ] `{ name: "Shipping Policy", href: "/policies/shipping" }`
    - [ ] `{ name: "Returns & Refunds", href: "/policies/returns" }`
    - [ ] `{ name: "Privacy Policy", href: "/policies/privacy" }`
    - [ ] `{ name: "Terms of Service", href: "/policies/terms" }`

### 3.5 Update Sitemap

- [ ] Edit `src/app/sitemap.ts`
  - [ ] Remove `/blog/*` routes
  - [ ] Remove `/brands` routes
  - [ ] Remove `/about` route
  - [ ] Remove `/contact` route
  - [ ] Remove `/faq` route
  - [ ] Remove `/pages/*` routes (keep `/policies/*`)

### 3.6 Update Navigation (if not done in earlier phases)

- [ ] Edit `src/lib/navigation.ts`
  - [ ] Verify no references to deleted pages

### 3.7 Verify

- [ ] No broken imports in footer
- [ ] No broken imports in repositories index
- [ ] Footer shows only Shop + Legal sections (with cleaned links)
- [ ] Homepage renders correctly
- [ ] Policies pages still accessible (`/policies/shipping`, etc.)
- [ ] 404 on deleted routes (try `/blog`, `/brands`, etc.)
- [ ] No TypeScript errors in `npm run build`

### 3.8 Commit

```bash
git add -A
git commit -m "refactor: Remove blog, brands, and CMS pages

- Delete /blog, /brands, /about, /contact, /faq, /pages
- Delete json-blog, json-brand, json-page repositories
- Remove demo data: blog.json, pages.json
- Update footer links to remove deleted pages
- Keep policies pages (/shipping, /returns, /privacy, /terms)
- Reason: Template content, not supermarket focus
"
```

---

## 🟢 PHASE 4: OPTIONAL UI CLEANUP (Week 2)

**Goal:** Remove demo-only UI clutter  
**Duration:** ~0.5 day  
**Effort:** TRIVIAL  
**Risk:** NONE  
**Files Affected:** 4

### 4.1 Remove Newsletter Section from Homepage

- [ ] Edit `src/app/(store)/page.tsx`
  - [ ] Comment out or delete the entire "Newsletter CTA" section (search for `{/* Newsletter CTA */}`)
  - [ ] This includes:
    - [ ] `<section className="bg-neutral-900 text-white">` block
    - [ ] `<NewsletterForm />` import line

### 4.2 Delete Newsletter Component

- [ ] Delete `src/components/layout/newsletter-form.tsx`

### 4.3 Disable Announcement Bar

- [ ] Option A (Recommended): Edit `src/lib/config.ts`
  - [ ] Change `announcement: "Free shipping on all orders over $75 — Shop now!"` 
  - [ ] To: `announcement: ""`
- [ ] OR Option B: Comment out in layout
  - [ ] Edit `src/app/(store)/layout.tsx`
  - [ ] Comment out `<AnnouncementBar />`

### 4.4 Remove Recently Viewed

- [ ] Edit `src/app/(store)/[slug]/product-detail-view.tsx`
  - [ ] Remove `import { RecentlyViewed } from "@/components/products/recently-viewed"`
  - [ ] Comment out or remove `<RecentlyViewed excludeProductId={...} />`
- [ ] Delete `src/store/recently-viewed.ts`
- [ ] Delete `src/components/products/recently-viewed.tsx`

### 4.5 Remove Developer CTA from Homepage

- [ ] Edit `src/app/(store)/page.tsx`
  - [ ] Comment out or delete the entire "Developer CTA" section (search for `{/* Developer CTA */}`)
  - [ ] This includes the "Need help building your store?" section with GitHub + "Hire a Developer" buttons

### 4.6 Remove or Update Social Icons

- [ ] Option A: Remove from footer
  - [ ] Edit `src/components/layout/footer.tsx`
  - [ ] Remove social media icons section (Twitter, Instagram, Facebook, YouTube, TikTok)
- [ ] Option B: Populate with real accounts (for later)
  - [ ] Edit `src/lib/config.ts`
  - [ ] Update `social` object with real URLs instead of empty strings

### 4.7 Verify

- [ ] Homepage renders without newsletter section
- [ ] Homepage renders without developer CTA
- [ ] No broken imports
- [ ] Announcement bar is hidden (or disabled)
- [ ] Product detail page has no recently-viewed carousel
- [ ] Footer looks cleaner (no social icons, or icons point to real accounts)
- [ ] No TypeScript errors in `npm run build`

### 4.8 Commit

```bash
git add -A
git commit -m "refactor: Remove demo UI elements

- Remove newsletter form and CTA section from homepage
- Remove developer CTA from homepage
- Disable announcement bar (set to empty string)
- Remove recently-viewed carousel from product detail
- Remove or hide social media icons in footer
- Reason: Demo-only UI, not needed for supermarket
"
```

---

## 🟢 PHASE 5: LOCALIZATION ADJUSTMENT (Week 2)

**Goal:** Simplify or prepare for Arabic  
**Duration:** ~0.5 day  
**Effort:** TRIVIAL  
**Risk:** NONE  
**Files Affected:** 2

### 5.1 Option A: English Only (Simplest)

- [ ] Edit `src/i18n/config.ts`
  - [ ] Change `export const locales = ["en", "es"] as const`
  - [ ] To: `export const locales = ["en"] as const`
- [ ] Delete `messages/es.json` (optional; can keep for archive)
- [ ] Verify routes become `/shop` instead of `/en/shop`

### 5.2 Option B: Keep i18n Framework for Arabic (Recommended)

- [ ] SKIP Phase 5.1
- [ ] Keep `src/i18n/config.ts` as is
- [ ] Keep `messages/en.json`
- [ ] Delete `messages/es.json`
- [ ] Plan Arabic support for Phase 6+ (when ready)
- [ ] Document in ROADMAP.md

### 5.3 Verify

- [ ] Routes work without locale prefix (or with `/en`)
- [ ] No locale switching errors
- [ ] Checkout still works
- [ ] No TypeScript errors in `npm run build`

### 5.4 Commit

```bash
git add -A
git commit -m "refactor: Simplify localization (English only for Phase 1)

- Disable Spanish locale (keep i18n framework for Arabic)
- Delete messages/es.json
- Set locales = [\"en\"] in config
- Reason: Focus on English first; Arabic roadmap for Phase 6+
"
```

---

## 🔵 PHASE 6: EGYPTIANIZE DATA (Week 2–3)

**Goal:** Replace demo data with Egyptian supermarket  
**Duration:** ~2 days  
**Effort:** MODERATE (content, not code)  
**Risk:** NONE  
**Files Affected:** 3

### 6.1 Replace Product Data

- [ ] Edit `src/data/products.json`
  - [ ] Replace 46 demo products with Egyptian supermarket catalog
  - [ ] Categories:
    - [ ] Groceries (grains, flour, rice, legumes, etc.)
    - [ ] Bakery (bread, pastries, etc.)
    - [ ] Dairy (milk, cheese, yogurt, butter, etc.)
    - [ ] Produce (vegetables, fruits, etc.)
    - [ ] Household (cleaning, toiletries, etc.)
    - [ ] Beverages (water, juice, etc.)
  - [ ] Add realistic Egyptian product names (Arabic + English)
  - [ ] Keep JSON structure identical (same fields work)
  - [ ] Update prices to EGP
  - [ ] Update category slugs to match
  - [ ] Verify JSON is valid (use JSON validator)

### 6.2 Update Store Config

- [ ] Edit `src/lib/config.ts`
  - [ ] Change `name: "Next.js Ecommerce Starter"` → Egyptian store name
  - [ ] Change `tagline:` → Egyptian store tagline
  - [ ] Change `description:` → Egyptian store description
  - [ ] Change `contact.email` → Egyptian contact
  - [ ] Change `contact.phone` → Egyptian phone
  - [ ] Change `contact.address` → Egyptian address
  - [ ] Change `currency: "USD"` → `"EGP"` (or appropriate)
  - [ ] Change `locale: "en-US"` → `"en-EG"` or `"ar-EG"` (for later)
  - [ ] Update `freeShippingThreshold` to Egyptian context (e.g., 500 EGP)
  - [ ] Update `taxRate` if needed
  - [ ] Update `social` links to Egyptian accounts (if any)

### 6.3 Update English Messages (Optional)

- [ ] Edit `messages/en.json`
  - [ ] Keep generic strings as is ("Add to Cart", "Checkout", etc.)
  - [ ] Add store-specific strings if needed (e.g., "Grocery Delivery" instead of "Shop Now")
  - [ ] Verify no Spanish strings remain

### 6.4 Plan Arabic Translations (Future)

- [ ] Create `messages/ar.json` (copy from `en.json` structure)
- [ ] Translate to Arabic
- [ ] Update `src/i18n/config.ts` to include `"ar"`
- [ ] Test locale switching

### 6.5 Verify

- [ ] Homepage shows Egyptian supermarket products
- [ ] Product categories load correctly
- [ ] Prices display in EGP
- [ ] Store name appears correct in header/footer
- [ ] Contact info is correct
- [ ] No 404s on category pages
- [ ] Search works with new data
- [ ] Checkout displays Egyptian address format
- [ ] No TypeScript errors in `npm run build`

### 6.6 Commit

```bash
git add -A
git commit -m "data: Egyptianize store data and configuration

- Replace 46 demo products with Egyptian supermarket catalog
- Add categories: Groceries, Bakery, Dairy, Produce, Household, Beverages
- Update config: store name, contact, currency (EGP), address
- Update product prices to EGP
- Prepare for Arabic translations (Phase 6+)
- Reason: Localize for Egyptian market
"
```

---

## 🔵 PHASE 7: ADMIN SCAFFOLD EXPANSION (Week 3–4)

**Goal:** Prepare admin for product/order management  
**Duration:** ~1 week  
**Effort:** MODERATE (new code)  
**Risk:** LOW  
**Files Affected:** 4+

### 7.1 Design Admin UI (Out of Scope - Plan Phase)

- [ ] Stakeholder review of admin requirements
- [ ] Design product management UI
- [ ] Design order management UI
- [ ] Design inventory management UI
- [ ] Plan database schema (products, orders, inventory)

### 7.2 Build Product Management (Scaffolding)

- [ ] Create `/app/(admin)/admin/products/page.tsx`
- [ ] Create `/app/(admin)/admin/products/new/page.tsx` (add product)
- [ ] Create `/app/(admin)/admin/products/[id]/page.tsx` (edit product)
- [ ] Add basic CRUD UI (list, create, update, delete)
- [ ] Connect to database (replace JSON repository)

### 7.3 Build Order Management

- [ ] Create `/app/(admin)/admin/orders/page.tsx` (already exists)
- [ ] Add order listing with filters
- [ ] Add order detail page
- [ ] Add order status updates
- [ ] Connect to database

### 7.4 Update Admin Navigation

- [ ] Edit `/app/(admin)/admin/layout.tsx`
  - [ ] Add Products link to sidebar
  - [ ] Verify Orders link exists

### 7.5 Verify

- [ ] Admin dashboard loads (protected by auth guard)
- [ ] Product management UI works
- [ ] Order management UI works
- [ ] Database integration works (CRUD operations)
- [ ] No TypeScript errors in `npm run build`

### 7.6 Commit

```bash
git add -A
git commit -m "feat: Expand admin scaffold for product/order management

- Create /admin/products (list, create, update, delete)
- Create /admin/orders detail page
- Connect to database (replace JSON)
- Add inventory tracking
- Reason: Prepare for live product management
"
```

---

## 🟣 PHASE 8: PAYMENT INTEGRATION (Future, 2–3 weeks)

**Goal:** Replace demo checkout with real payment processor  
**Duration:** ~2–3 weeks  
**Effort:** COMPLEX (external service integration)  
**Risk:** LOW (isolated to checkout provider)  
**Files Affected:** 2

### 8.1 Choose Payment Provider

- [ ] Decide between Stripe, PayMob, Fawry (Egyptian-friendly)
- [ ] Get API keys
- [ ] Read documentation

### 8.2 Implement Payment Provider

- [ ] Create `src/lib/checkout/stripe-provider.ts` (or paypal, etc.)
- [ ] Implement `CheckoutProvider` interface
- [ ] Add webhook handlers
- [ ] Add error handling

### 8.3 Update Checkout Page

- [ ] Edit `src/app/(store)/checkout/page.tsx`
  - [ ] Replace demo payment section with real payment form
  - [ ] Add payment element (Stripe, PayMob, etc.)
  - [ ] Add error handling
  - [ ] Add loading states

### 8.4 Switch Active Provider

- [ ] Edit `src/lib/checkout/index.ts`
  - [ ] Change `export { demoCheckoutProvider }` 
  - [ ] To: `export { stripeCheckoutProvider }` (or chosen provider)

### 8.5 Test

- [ ] Test with sandbox credentials
- [ ] Test successful payment
- [ ] Test failed payment
- [ ] Test webhook handling

### 8.6 Deploy

- [ ] Set production API keys
- [ ] Deploy to production
- [ ] Monitor for errors

### 8.7 Commit

```bash
git add -A
git commit -m "feat: Integrate real payment processor (Stripe/PayMob)

- Replace demo checkout provider with [Provider] API
- Add payment form to checkout page
- Add webhook handlers for payment confirmation
- Move orders to database
- Reason: Enable real customer transactions
"
```

---

## ✅ VERIFICATION CHECKLIST (After Each Phase)

### After Every Phase:

- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
- [ ] No TypeScript errors
- [ ] Homepage loads and displays correctly
- [ ] Products display correctly
- [ ] Cart works (add, remove, view)
- [ ] Checkout works (no login required)
- [ ] Search works
- [ ] Categories load
- [ ] No 404s on core pages
- [ ] Mobile layout responsive
- [ ] Git status clean (all changes committed)

### After All Phases:

- [ ] Full user flow works: Home → Category → Product → Cart → Checkout → Success
- [ ] Admin dashboard loads + protected
- [ ] Egyptian supermarket data visible
- [ ] Store name/contact correct
- [ ] No performance regressions (Lighthouse 90+)
- [ ] SEO metadata correct
- [ ] Accessibility maintained
- [ ] Security headers present
- [ ] All tests pass

---

## 📋 FINAL CHECKLIST

- [ ] All phases 1–5 completed
- [ ] Code committed with descriptive messages
- [ ] No broken links or 404s
- [ ] Mobile-responsive verified
- [ ] Performance maintained (Lighthouse 90+)
- [ ] SEO metadata updated
- [ ] Brand logo integrated (Phase 7)
- [ ] Admin dashboard ready for product management
- [ ] Payment integration planned (Phase 8)
- [ ] Documentation updated
- [ ] Ready for public launch

---

**Last Updated:** 2025-01-20  
**Total Phases:** 8  
**Estimated Time:** 3–4 weeks (Phases 1–6)  
**Risk Level:** LOW  
**Status:** Ready to execute

