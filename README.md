# 🌿 RP Organics — Production-Ready eCommerce Website

A modern, high-performance, mobile-first eCommerce website crafted for an authentic organic food and wellness brand.

> **Brand Tone:** Natural, Trustworthy, Premium, Clean, Warm, and Modern.  
> **Core Products:** Organic single-origin spices, sprouted plant protein health mixes, ancient unpolished millets, cold wood-pressed cooking oils, bilona A2 Gir cow ghee, raw Himalayan honey, and family immunity hampers.

---

## 🌟 Key Features & Architectural Highlights

1. **Production-Ready Dual Architecture:**
   - **Standalone High-Speed Web Application:** Works seamlessly out of the box with zero dependencies. Can be hosted directly on Vercel, Netlify, Cloudflare Pages, AWS S3, or any web server.
   - **Shopify 2.0 Theme Structure:** Located in `/shopify-theme`, containing Liquid templates, JSON schemas, dynamic sections, and snippets for native Shopify deployment.
2. **Comprehensive Navigation & Sticky Header:**
   - Top announcement bar with threshold progress ("Free Shipping above ₹999"), telephone contact, order tracker, and currency switcher (₹ INR / $ USD).
   - Sticky header with elevation shadow on scroll.
   - Instant search auto-suggest with live matching thumbnails, category pills, and prices.
   - Responsive mega menu for all 7 primary categories with featured spotlight callouts.
   - Mobile slide-in drawer with accordion categories and sticky bottom quick-action navigation bar.
3. **Reactive Shopping Cart & Ajax Slide-Out Drawer:**
   - Slide-out drawer with backdrop blur.
   - Dynamic free-delivery meter ("Add ₹X more to get FREE Delivery!").
   - Quantity adjustment, item removal, and subtotal calculation with `localStorage` persistence.
   - "Frequently Bought Together" upsell recommendations.
   - Dedicated `cart.html` with coupon code engine (try `ORGANIC10` or `VEDA20`) and checkout simulator.
4. **Interactive Product Detail Experience (`product.html`):**
   - Dynamic product loader via URL parameters (`?id=spc-01` or `?slug=...`).
   - Image gallery with hover magnifier zoom lens.
   - Weight/variant picker (250g, 500g, 1kg) with dynamic price calculation.
   - Pincode delivery estimator with instant SLA validation.
   - Full nutritional panel tables per 100g, ingredients sourcing, and storage instructions in expandable accordion tabs.
   - Recently viewed product history and verified customer reviews breakdown.
5. **Shop / Collection Filter Engine (`shop.html`):**
   - Live client-side multi-criteria filtering: Categories, price range slider, product types (Powder, Whole, Cold-Pressed, Mix, Raw), dietary needs (Gluten-Free, Vegan, High Protein, Diabetic-Friendly), and in-stock toggle.
   - Sorting options: Featured, Newest, Price (Low to High / High to Low), Top Rated, and Alphabetical.
   - Grid and List view switcher.
   - Active filter chips with one-click dismiss and "Clear All".

---

## 📁 Project Directory Structure

```
vedaroots-organics/
│
├── index.html                   # 12-Section Homepage
├── shop.html                    # Collection & Multi-Filter Shop Page
├── product.html                 # Dynamic Product Detail Page Template
├── cart.html                    # Dedicated Cart & Checkout Simulator
├── wishlist.html                # Saved Wishlist Page
├── search.html                  # Search Results Page
├── about.html                   # Story, 4 Organic Pillars & Farm Partners
├── contact.html                 # Contact Form, Map Coordinates & WhatsApp
├── faqs.html                    # Searchable Accordion FAQs
├── blog.html                    # Nutrition & Recipe Journal Listing
├── blog-post.html               # Recipe Post Template with Ingredients & Steps
├── shipping-returns.html        # Shipping Timelines & 7-Day Guarantee
├── privacy-policy.html          # Privacy Policy & PCI Data Protection
├── terms-conditions.html        # Terms of Service
├── login.html                   # Customer Login & Registration Portal
├── account.html                 # Customer Dashboard & Live Order Tracker
├── 404.html                     # Custom 404 Not Found Page
│
├── assets/
│   ├── css/
│   │   ├── main.css             # Design system, CSS variables, typography & resets
│   │   ├── header-footer.css    # Header, mega menu, search, mobile drawer & footer
│   │   ├── product-card.css     # Product cards, hover swap, quick view modal
│   │   ├── cart-drawer.css      # Slide-out drawer, free shipping meter, upsells
│   │   └── pages.css            # Section styles: hero carousel, accordions, gallery
│   └── js/
│       ├── products-data.js     # Master dataset of 15+ organic products & metadata
│       ├── store.js             # LocalStorage reactive store (cart, wishlist, currency)
│       ├── components.js        # Card renderer, search autosuggest, quick view modal
│       ├── main.js              # Homepage carousel, category scroll, animations
│       ├── shop.js              # Shop filters, price slider, sort & view switcher
│       └── product-page.js      # PDP image zoom, variant picker & pincode checker
│
└── shopify-theme/               # Shopify 2.0 Theme Assets
    ├── layout/theme.liquid      # Master Shopify Layout
    ├── sections/header.liquid   # Header & Announcement Section
    ├── sections/hero-slider.liquid # Dynamic Hero Carousel Section
    ├── sections/featured-products.liquid # Collection Grid Section
    ├── sections/cart-drawer.liquid # Ajax Cart Drawer Section
    ├── sections/footer.liquid   # Footer Section
    ├── snippets/product-card.liquid # Reusable Product Snippet
    └── config/settings_schema.json # Theme Customizer Colors & Settings
```

---

## 🚀 How to Run Locally

You can preview the website immediately using any local HTTP server:

### Option 1: Python HTTP Server (Built-in)
```bash
cd vedaroots-organics
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

### Option 2: Node.js `serve` or `npx`
```bash
cd vedaroots-organics
npx serve .
```

### Option 3: Direct File Opening
You can also open `index.html` directly in Google Chrome, Microsoft Edge, Safari, or Firefox.

---

## 🔌 Connecting Real Products, Payments, Shipping & Domain

### 1. Connecting Real Products
- **Standalone Frontend:**
  Edit `assets/js/products-data.js`. Replace sample items with your real SKU records, titles, ingredient panels, images, and prices. The entire site (homepage, search, category filters, quick view, product detail) reads from this single source of truth.
- **Shopify Store:**
  1. In your Shopify Admin, navigate to **Products > Add Product**.
  2. Upload your real product images, set prices, compare-at prices, and assign tags (e.g. `spices`, `millets`, `bestseller`).
  3. Import the `shopify-theme` folder into your Shopify Admin under **Online Store > Themes > Add Theme > Upload zip file**.

### 2. Connecting Payment Gateways (India & International)
- **Razorpay (Recommended for India):**
  1. Create an account at [razorpay.com](https://razorpay.com).
  2. For the standalone frontend: Add the Razorpay Checkout script (`<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`) and pass `key_id`, amount in paise, and currency `INR`.
  3. For Shopify: Go to **Settings > Payments > Additional payment methods > Search "Razorpay"** and enter your Key ID and Key Secret.
- **Cashfree / PhonePe Payment Gateway:**
  Install their respective Shopify partner apps or plug their SDK into the checkout handler in `cart.html`.
- **Cash on Delivery (COD):**
  Supported by default in both the cart simulation and standard Shopify checkout settings (**Settings > Payments > Manual payment methods > Cash on Delivery**).

### 3. Connecting Shipping & Logistics
- **Shiprocket / Delhivery Integration:**
  1. Sign up on [shiprocket.in](https://shiprocket.in).
  2. In your Shiprocket dashboard, connect your eCommerce channel (Shopify / Custom Webhook).
  3. Orders automatically sync with Shiprocket for automated AWB generation, courier allocation (Bluedart, Delhivery, Shadowfax, DTDC), label printing, and WhatsApp tracking updates.
  4. The pincode validator in `assets/js/product-page.js` can be hooked to the Shiprocket Courier Serviceability API (`/v1/external/courier/serviceability?pickup_postcode=560001&delivery_postcode={input}`).

### 4. Custom Domain & SSL Setup
- **DNS Records for Custom Hosting (Vercel / Netlify / Cloudflare):**
  - Add an `A` record pointing to your host's IP address.
  - Add a `CNAME` record pointing `www` to your host alias.
- **DNS Records for Shopify:**
  - `A` Record: `@` pointing to `23.227.38.65`
  - `CNAME` Record: `www` pointing to `shops.myshopify.com`
  - SSL certificates are automatically provisioned within 60 minutes.

---

## 🌿 Brand Assets & Design System Variables

Colors can be customized in `assets/css/main.css`:
- `--color-primary: #235328;` (Deep Organic Leaf Green)
- `--color-secondary: #c05621;` (Warm Earthy Terracotta)
- `--color-accent-gold: #d97706;` (Raw Himalayan Honey Gold)
- `--color-surface-subtle: #f8f7f4;` (Warm Ivory Off-White)

---

## 📄 License & Attribution

Designed and engineered for commercial organic food brands. High-resolution product images are powered by curated Unsplash creative commons photography and ready for immediate replacement with your custom studio product packshots.
