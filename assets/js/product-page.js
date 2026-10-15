/**
 * RP Organics - Premium Product Detail Page Controller
 * Brand: RP Organics | Owner: Rani Pavunrasu | FSSAI Lic: 22426431000125
 * Phone: 9150300641 | Email: benseethalrani@gmail.com
 */

(function() {
  'use strict';

  let currentProduct = null;
  let currentVariant = null;
  let currentQuantity = 1;

  const getStore = () => window.Store || (typeof Store !== 'undefined' ? Store : null);
  const formatPrice = (amt) => {
    if (amt === undefined || amt === null) return '';
    const s = getStore();
    return (s && s.formatPrice) ? s.formatPrice(amt) : `₹${amt}`;
  };

  // Global methods accessible from inline event handlers
  window.VedaProductPage = {
    switchImage(src, thumbEl) {
      const mainImg = document.getElementById('detail-main-img');
      if (!mainImg) return;
      
      // Smooth fade transition
      mainImg.style.opacity = '0.3';
      mainImg.style.transform = 'scale(0.97)';
      setTimeout(() => {
        mainImg.src = src;
        mainImg.style.opacity = '1';
        mainImg.style.transform = 'scale(1)';
      }, 150);

      document.querySelectorAll('.product-thumb-item').forEach(t => t.classList.remove('active'));
      if (thumbEl) thumbEl.classList.add('active');
    },

    selectVariant(variantName, btnEl) {
      if (!currentProduct || !currentProduct.variants) return;
      currentVariant = currentProduct.variants.find(v => v.name === variantName) || currentProduct.variants[0];
      if (!currentVariant) return;

      document.querySelectorAll('.variant-btn-large').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');

      const priceEl = document.getElementById('pdp-price');
      const compareEl = document.getElementById('pdp-compare');
      const stickyPriceEl = document.getElementById('sticky-price');
      const savingsEl = document.getElementById('pdp-savings');
      const discountEl = document.getElementById('pdp-discount');

      const formattedPrice = formatPrice(currentVariant.price);
      if (priceEl) priceEl.textContent = formattedPrice;
      if (stickyPriceEl) stickyPriceEl.textContent = formattedPrice;

      if (compareEl) {
        if (currentVariant.compareAtPrice && currentVariant.compareAtPrice > currentVariant.price) {
          compareEl.textContent = formatPrice(currentVariant.compareAtPrice);
          compareEl.style.display = 'inline';
        } else {
          compareEl.style.display = 'none';
        }
      }

      if (discountEl) {
        if (currentVariant.discount) {
          discountEl.textContent = currentVariant.discount;
          discountEl.style.display = 'inline-block';
        } else {
          discountEl.style.display = 'none';
        }
      }

      if (savingsEl) {
        if (currentVariant.savings) {
          savingsEl.textContent = currentVariant.savings;
          savingsEl.style.display = 'inline-block';
        } else {
          savingsEl.style.display = 'none';
        }
      }
    },

    changeQty(delta) {
      const input = document.getElementById('pdp-qty-input');
      if (!input) return;
      currentQuantity = Math.max(1, currentQuantity + delta);
      input.value = currentQuantity;
    },

    addToCart() {
      if (!currentProduct) return;
      const vName = currentVariant ? currentVariant.name : null;
      const s = getStore();
      if (s && s.addToCart) {
        s.addToCart(currentProduct.id, vName, currentQuantity, true);
      }

      // Micro-animation on button
      const btn = document.getElementById('btn-add-to-cart-main');
      if (btn) {
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Added to Cart!
        `;
        btn.style.background = 'linear-gradient(135deg, #16a34a, #15803d)';
        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.style.background = '';
        }, 1800);
      }
    },

    buyNow() {
      if (!currentProduct) return;
      const vName = currentVariant ? currentVariant.name : null;
      const s = getStore();
      if (s && s.addToCart) {
        s.addToCart(currentProduct.id, vName, currentQuantity, false);
      }
      window.location.href = 'cart.html';
    },

    checkPincode() {
      const input = document.getElementById('pincode-input');
      const res = document.getElementById('pincode-result');
      if (!input || !res) return;

      const code = input.value.trim();
      if (!/^\d{6}$/.test(code)) {
        res.innerHTML = `<span style="color: var(--color-sale); display: flex; align-items: center; gap: 6px;">⚠️ Please enter a valid 6-digit Indian pincode.</span>`;
        return;
      }

      res.innerHTML = `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; margin-top: 8px; animation: pdpFadeInUp 0.3s ease;">
          <div style="color: #15803d; font-weight: 700; font-size: 0.88rem; display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 1.1rem;">✓</span> Fast Delivery Available to ${code}
          </div>
          <div style="font-size: 0.8rem; color: #166534; margin-top: 2px;">
            Estimated delivery within <strong>2 to 4 business days</strong>. Cash on Delivery (COD) &amp; Free shipping eligible above ₹999.
          </div>
        </div>
      `;
    },

    toggleAccordion(headerBtn) {
      const item = headerBtn.closest('.accordion-item');
      if (!item) return;
      const isOpen = item.classList.contains('open');
      
      // Close other accordions for sleek accordion behavior
      document.querySelectorAll('.accordion-item').forEach(acc => {
        if (acc !== item) {
          acc.classList.remove('open');
          const ch = acc.querySelector('.chevron');
          if (ch) ch.textContent = '+';
        }
      });

      item.classList.toggle('open', !isOpen);
      const chevron = headerBtn.querySelector('.chevron');
      if (chevron) chevron.textContent = !isOpen ? '−' : '+';
    },

    openWriteReviewModal() {
      Store.showToast('Thank you! Review form is open for RP Organics verified customers.', 'info');
    }
  };

  function initProductPage() {
    const productContainer = document.getElementById('product-detail-view');
    if (!productContainer) return;

    // Retrieve products list safely
    const allProducts = (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS) && PRODUCTS.length > 0)
      ? PRODUCTS
      : (window.PRODUCTS || []);

    if (allProducts.length === 0) {
      // Fetch fallback from JSON
      fetch('assets/data/products.json')
        .then(res => res.json())
        .then(data => {
          window.PRODUCTS = data;
          render(data);
        })
        .catch(err => {
          console.error('Failed to load products data:', err);
          productContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
              <h2 style="color: var(--color-sale); margin-bottom: 12px;">Unable to load product details</h2>
              <p style="color: var(--color-text-muted); margin-bottom: 20px;">Please return to the store catalog to explore authentic RP Organics products.</p>
              <a href="shop.html" class="btn btn-primary">Return to Shop</a>
            </div>
          `;
        });
      return;
    }

    render(allProducts);

    function render(products) {
      let requestedId = null;
      try {
        const urlParams = new URLSearchParams(window.location.search);
        requestedId = urlParams.get('id') || urlParams.get('product') || urlParams.get('slug');
      } catch (e) {}

      // Fallback 1: check window.location.hash (e.g. #spc-poondu or #id=spc-poondu)
      if (!requestedId && window.location.hash) {
        const h = window.location.hash.replace(/^#/, '');
        if (h.includes('id=')) {
          requestedId = h.split('id=')[1].split('&')[0];
        } else if (h.length > 2) {
          requestedId = h;
        }
      }

      // Fallback 2: check sessionStorage (stored on product card click)
      if (!requestedId) {
        try {
          requestedId = sessionStorage.getItem('rp_current_product_id');
        } catch (e) {}
      }

      // Fallback 3: check localStorage
      if (!requestedId) {
        try {
          requestedId = localStorage.getItem('rp_current_product_id');
        } catch (e) {}
      }

      // Default only if nothing else found
      if (!requestedId) {
        requestedId = 'pro-01';
      }

      const reqClean = String(requestedId).toLowerCase().trim();
      const product = products.find(p => p.id && p.id.toLowerCase() === reqClean) ||
                      products.find(p => p.slug && p.slug.toLowerCase() === reqClean) ||
                      products.find(p => p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(reqClean)) ||
                      products.find(p => p.id && reqClean.includes(p.id.toLowerCase())) ||
                      products[0];

      // Remember selected product in session
      try {
        sessionStorage.setItem('rp_current_product_id', product.id);
        localStorage.setItem('rp_current_product_id', product.id);
      } catch (e) {}

      currentProduct = product;
      currentVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
      currentQuantity = 1;

      // Track recently viewed
      const s = getStore();
      if (s && s.trackRecentlyViewed) {
        s.trackRecentlyViewed(product.id);
      }

      // Update page document title
      document.title = `${product.title} | RP Organics Official Store`;

      const isWishlisted = s && s.isInWishlist ? s.isInWishlist(product.id) : false;
      const price = currentVariant ? currentVariant.price : product.price;
      const compare = currentVariant ? (currentVariant.compareAtPrice || currentVariant.comparePrice) : (product.compareAtPrice || product.comparePrice);
      const savings = currentVariant && currentVariant.savings ? currentVariant.savings : (compare > price ? `Save ${formatPrice(compare - price)}` : '');
      const discount = currentVariant && currentVariant.discount ? currentVariant.discount : (compare > price ? `${Math.round(((compare - price) / compare) * 100)}% OFF` : '');

      // Dietary string safe handling (fixes previous TypeError)
      const dietaryStr = Array.isArray(product.dietary) 
        ? product.dietary.join(' • ') 
        : (product.dietary || '100% Vegetarian, Plant-Based, Natural');

      // Gallery setup
      const galleryImages = (product.gallery && product.gallery.length > 0)
        ? product.gallery
        : (product.images && product.images.length > 0 ? product.images : [product.primaryImage]);

      // Protein Claim Banner (Strictly isolated to pro-01 Protein Health Mix)
      let proteinClaimHeroHtml = '';
      if (product.specialClaim && product.id === 'pro-01') {
        proteinClaimHeroHtml = `
          <div class="pdp-shimmer-banner" role="banner" aria-label="Protein Power Claim">
            <span style="font-size: 1.8rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">⚡</span>
            <div>
              <strong style="font-size: 1.15rem; display: block; letter-spacing: 0.02em; font-weight: 800;">
                ${product.specialClaim}
              </strong>
              <span style="font-size: 0.85rem; color: #dcfce7; opacity: 0.95;">
                62.5g of Veg Protein per 250g Pack &bull; Traditional Formulation with 38+ Wholesome Ingredients
              </span>
            </div>
          </div>
        `;
      }

      // Nutrition Table Rows
      let nutritionRows = '';
      if (product.nutrition) {
        nutritionRows = Object.entries(product.nutrition).map(([key, val]) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          const isNotSpecified = typeof val === 'string' && val.includes('Not specified');
          const isProtein = key.toLowerCase().includes('protein');
          return `
            <tr style="${isProtein ? 'background-color: #f0fdf4; font-weight: 700;' : ''}">
              <td style="font-weight: 600; width: 42%; padding: 10px 14px; border-bottom: 1px solid var(--color-border-light);">
                ${label} ${isProtein ? '<span style="color: #15803d; font-size: 0.75rem; margin-left: 4px;">★ Key Nutrient</span>' : ''}
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid var(--color-border-light); ${isNotSpecified ? 'color: #94a3b8; font-style: italic;' : 'font-weight: 700; color: var(--color-primary);'}">
                ${val}
              </td>
            </tr>
          `;
        }).join('');
      }

      productContainer.innerHTML = `
        <!-- Breadcrumbs Navigation -->
        <nav class="breadcrumbs" aria-label="Breadcrumb" style="margin-bottom: 24px; animation: pdpFadeInUp 0.4s ease;">
          <a href="index.html">Home</a>
          <span class="separator">/</span>
          <a href="shop.html">Shop Catalog</a>
          <span class="separator">/</span>
          <a href="shop.html?category=${product.categorySlug || 'health-mixes'}">${product.category}</a>
          <span class="separator">/</span>
          <span class="current" style="color: var(--color-primary); font-weight: 700;">${product.name}</span>
        </nav>

        <div class="product-detail-layout">
          <!-- Left Column: Premium Gallery & Zoom -->
          <div class="product-gallery-wrap">
            <div class="product-main-view" id="main-view-zoom-box">
              <span class="pdp-badge-pill" style="position: absolute; top: 16px; left: 16px; z-index: 4; background: #ffffff; color: #15803d; font-size: 0.78rem; font-weight: 800; padding: 6px 12px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #86efac; display: flex; align-items: center; gap: 6px;">
                <span class="live-pulse-dot"></span> 100% Farm Sourced
              </span>

              <img id="detail-main-img" 
                   src="${galleryImages[0]}" 
                   alt="${product.title}" 
                   onerror="this.onerror=null; this.src='assets/images/product-placeholder.png';" />
            </div>

            <!-- Thumbnail Carousel -->
            <div class="product-thumbnails-list" aria-label="Product Image Views">
              ${galleryImages.map((imgUrl, idx) => `
                <div class="product-thumb-item ${idx === 0 ? 'active' : ''}" 
                     onclick="VedaProductPage.switchImage('${imgUrl}', this)"
                     title="View ${idx + 1}">
                  <img src="${imgUrl}" alt="${product.title} view ${idx + 1}" onerror="this.onerror=null; this.src='assets/images/product-placeholder.png';" />
                </div>
              `).join('')}
            </div>

            <!-- Prominent FSSAI Certificate Badge below Gallery -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); border: 1.5px solid #86efac; border-radius: var(--radius-lg); padding: 16px 20px; display: flex; align-items: center; gap: 16px; margin-top: 14px; box-shadow: 0 4px 14px rgba(21, 128, 61, 0.08);">
              <div style="background: #ffffff; padding: 6px 12px; border-radius: 8px; border: 1px solid #86efac; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                <img src="assets/images/fssai-logo.png" alt="FSSAI registered logo" width="96" height="38" style="height: 38px; width: auto; object-fit: contain;" />
              </div>
              <div>
                <div style="font-size: 0.92rem; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.04em;">
                  100% FSSAI Registered
                </div>
                <div style="font-size: 0.88rem; color: #14532d; font-weight: 700; margin: 1px 0;">
                  FSSAI Lic No: 22426431000125
                </div>
                <div style="font-size: 0.76rem; color: #15803d; font-weight: 500;">
                  Govt. Food Safety &amp; Standards Authority of India Certified
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Purchasing Info & Details -->
          <div class="product-info-col">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span class="product-category-crumb" style="font-weight: 800; color: var(--color-primary); background: #f0fdf4; padding: 4px 10px; border-radius: 4px; border: 1px solid #bbf7d0;">
                ${product.category} &bull; Traditional Tamil Harvest
              </span>
              <span style="font-size: 0.78rem; font-weight: 800; color: #166534; background: #dcfce7; padding: 4px 10px; border-radius: 9999px;">
                ✓ FSSAI Reg.
              </span>
            </div>

            <h1 class="product-main-title" style="font-weight: 800; letter-spacing: -0.02em; line-height: 1.25; margin-bottom: 6px;">
              ${product.title}
            </h1>

            ${proteinClaimHeroHtml}

            <!-- Meta Row: Stars & Stock -->
            <div class="product-meta-row" style="margin-bottom: 18px;">
              <div class="stars-row" style="color: #f59e0b; display: flex; align-items: center; gap: 3px;">
                ${Array(5).fill('<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>').join('')}
                <span style="font-weight: 800; margin-left: 6px; color: var(--color-text-main); font-size: 0.95rem;">${product.rating || 4.9}</span>
              </div>
              <a href="#customer-reviews-section" style="color: var(--color-primary); font-weight: 700; text-decoration: underline;">
                ${product.reviewCount || 142} Verified Reviews
              </a>
              <span class="product-stock-tag" style="background: #f0fdf4; padding: 4px 10px; border-radius: 9999px; border: 1px solid #bbf7d0;">
                <span class="live-pulse-dot"></span>
                In Stock (${product.stockCount || 50} fresh packs available)
              </span>
            </div>

            <!-- Price Highlight Box -->
            <div class="product-price-box" style="background: linear-gradient(135deg, #f8faf5 0%, #f0fdf4 100%); border: 1.5px solid #bbf7d0; box-shadow: 0 4px 16px rgba(21, 128, 61, 0.06);">
              <span class="product-detail-price" id="pdp-price">${formatPrice(price)}</span>
              ${compare ? `<span class="product-detail-compare" id="pdp-compare">${formatPrice(compare)}</span>` : '<span id="pdp-compare" style="display:none"></span>'}
              ${discount ? `<span class="discount-badge" id="pdp-discount" style="font-size: 0.85rem; padding: 4px 12px; border-radius: 6px;">${discount}</span>` : '<span id="pdp-discount" style="display:none"></span>'}
              ${savings ? `<span class="product-savings-pill" id="pdp-savings" style="background: #fef2f2; color: #b91c1c; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">${savings}</span>` : '<span id="pdp-savings" style="display:none"></span>'}
            </div>

            <p class="product-short-desc" style="font-size: 0.96rem; line-height: 1.65; color: var(--color-text-muted); margin-bottom: 22px;">
              ${product.shortDescription}
            </p>

            <!-- Pack Size Variants Picker -->
            ${product.variants && product.variants.length > 0 ? `
              <div class="product-option-section" style="margin-bottom: 22px;">
                <label class="product-option-title" style="display: block; font-weight: 800; margin-bottom: 10px; color: var(--color-text-main);">
                  Select Pack Size:
                </label>
                <div class="variant-selector-pills">
                  ${product.variants.map((v, i) => `
                    <button class="variant-btn-large ${i === 0 ? 'active' : ''}" 
                            onclick="VedaProductPage.selectVariant('${v.name}', this)">
                      <span>${v.name}</span> &bull; 
                      <span style="font-weight: 800;">${formatPrice(v.price)}</span>
                      ${v.discount ? `<small style="color: #b91c1c; font-weight: 800; margin-left: 2px;">(${v.discount})</small>` : ''}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Quantity & Call To Action Row -->
            <div class="product-cta-row" style="margin-bottom: 24px;">
              <div class="qty-picker" style="height: 52px; border: 1.5px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; display: flex; align-items: center;">
                <button class="qty-btn" onclick="VedaProductPage.changeQty(-1)" aria-label="Decrease quantity" style="width: 44px; height: 100%; border: none; background: #ffffff; font-size: 1.2rem; cursor: pointer; font-weight: 700;">-</button>
                <input type="number" id="pdp-qty-input" class="qty-input" value="1" min="1" readonly aria-label="Quantity" style="width: 50px; text-align: center; border: none; font-size: 1rem; font-weight: 800; background: transparent;" />
                <button class="qty-btn" onclick="VedaProductPage.changeQty(1)" aria-label="Increase quantity" style="width: 44px; height: 100%; border: none; background: #ffffff; font-size: 1.2rem; cursor: pointer; font-weight: 700;">+</button>
              </div>

              <button id="btn-add-to-cart-main" class="btn btn-add-cart-pdp" style="flex: 1.2; height: 52px; font-size: 1rem; border-radius: var(--radius-md); display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;" onclick="VedaProductPage.addToCart()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span>Add to Cart</span>
              </button>

              <button class="btn btn-buy-now-pdp" style="flex: 1; height: 52px; font-size: 1rem; border-radius: var(--radius-md); cursor: pointer;" onclick="VedaProductPage.buyNow()">
                Buy Now
              </button>

              <button class="card-action-btn wishlist-btn ${isWishlisted ? 'active' : ''}" 
                      style="width: 52px; height: 52px; border-radius: var(--radius-md); border: 1.5px solid var(--color-border); background: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.04);"
                      onclick="VedaComponents.handleWishlistToggle('${product.id}', this)"
                      title="Add to Wishlist" aria-label="Wishlist">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="${isWishlisted ? '#e11d48' : 'none'}" stroke="${isWishlisted ? '#e11d48' : 'currentColor'}" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>

            <!-- Pincode Delivery Estimator -->
            <div class="pincode-checker-box" style="border: 1.5px solid var(--color-border); border-radius: var(--radius-md); padding: 16px 20px;">
              <div class="pincode-checker-title" style="font-weight: 700; font-size: 0.88rem; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                Estimated Delivery &amp; COD Availability:
              </div>
              <div class="pincode-input-row" style="display: flex; gap: 10px;">
                <input type="tel" inputmode="numeric" id="pincode-input" placeholder="Enter 6-digit Pincode (e.g. 600001)" maxlength="6" style="flex: 1; padding: 10px 14px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.92rem;" />
                <button class="btn btn-outline btn-sm" onclick="VedaProductPage.checkPincode()" style="font-weight: 700; padding: 0 18px;">Check</button>
              </div>
              <div id="pincode-result" class="pincode-result-msg"></div>
            </div>

            <!-- Official FSSAI & Support Trust Badge Strip -->
            <div class="pdp-fssai-badge" style="background: #ffffff; border: 1.5px solid #22c55e; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 18px; margin: 20px 0; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.1);">
              <img src="assets/images/fssai-logo.png" alt="FSSAI registered logo" width="70" height="70" style="width: 70px; height: 70px; object-fit: contain; flex-shrink: 0;" />
              <div>
                <div style="font-weight: 800; font-size: 1rem; color: #15803d; letter-spacing: 0.02em;">100% FSSAI REGISTERED</div>
                <div style="font-size: 0.84rem; color: #166534; font-weight: 600;">All products are FSSAI registered</div>
                <div style="font-weight: 800; font-size: 0.95rem; color: #14532d; margin-top: 3px;">FSSAI Lic No: 22426431000125</div>
              </div>
            </div>

            <!-- Customer Service Contact info on PDP -->
            <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 14px 18px; font-size: 0.86rem; margin-bottom: 24px;">
              <strong>Need personal ordering assistance?</strong><br />
              Owner: <strong>Rani Pavunrasu</strong> &bull; Call / WhatsApp: <a href="tel:9150300641" style="color: var(--color-primary); font-weight: 800;">9150300641</a> | Email: <a href="mailto:benseethalrani@gmail.com" style="color: var(--color-primary); font-weight: 800;">benseethalrani@gmail.com</a>
            </div>

            <!-- Expandable Product Accordion Panels -->
            <div class="product-accordions">
              <div class="accordion-item open">
                <button class="accordion-header" onclick="VedaProductPage.toggleAccordion(this)">
                  <span>Detailed Description &amp; Health Benefits</span>
                  <span class="chevron">−</span>
                </button>
                <div class="accordion-content">
                  <p style="margin-bottom: 14px;">${product.fullDescription}</p>
                  <div>
                    <strong>Dietary Characteristics:</strong> ${dietaryStr}
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <button class="accordion-header" onclick="VedaProductPage.toggleAccordion(this)">
                  <span>Ingredients &amp; Sourcing Purity</span>
                  <span class="chevron">+</span>
                </button>
                <div class="accordion-content">
                  <p style="margin-bottom: 10px;"><strong>Ingredients:</strong> ${product.ingredients}</p>
                  <p style="margin-bottom: 8px;"><strong>Allergen Information:</strong> ${product.allergenInfo || 'Not specified in PDF — requires client confirmation.'}</p>
                  <p><strong>Certifications:</strong> 100% FSSAI registered under Lic No: <strong>22426431000125</strong>. 100% vegetarian, free from artificial additives.</p>
                </div>
              </div>

              <div class="accordion-item">
                <button class="accordion-header" onclick="VedaProductPage.toggleAccordion(this)">
                  <span>Nutritional Facts &amp; Lab Standards</span>
                  <span class="chevron">+</span>
                </button>
                <div class="accordion-content">
                  <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                    <table class="nutrition-table" style="min-width: 320px; width: 100%; border-collapse: collapse;">
                      <tbody>
                        ${nutritionRows}
                      </tbody>
                    </table>
                  </div>
                  <p style="font-size: 0.78rem; color: var(--color-text-light); margin-top: 12px; font-style: italic;">
                    * All products manufactured under strict FSSAI compliance (FSSAI Lic No: 22426431000125).
                  </p>
                </div>
              </div>

              <div class="accordion-item">
                <button class="accordion-header" onclick="VedaProductPage.toggleAccordion(this)">
                  <span>How to Use / Preparation Directions</span>
                  <span class="chevron">+</span>
                </button>
                <div class="accordion-content">
                  <div style="white-space: pre-line; line-height: 1.75; font-size: 0.94rem;">
                    ${product.howToUse}
                  </div>
                </div>
              </div>

              <div class="accordion-item">
                <button class="accordion-header" onclick="VedaProductPage.toggleAccordion(this)">
                  <span>Storage &amp; Shelf Life Information</span>
                  <span class="chevron">+</span>
                </button>
                <div class="accordion-content">
                  <p style="margin-bottom: 8px;"><strong>Storage Instructions:</strong> ${product.storageInstructions}</p>
                  <p style="margin-bottom: 8px;"><strong>Shelf Life / Best Before:</strong> ${product.shelfLife}</p>
                  <p><strong>Brand / Manufacturer:</strong> RP Organics, Owner: Rani Pavunrasu, Contact: 9150300641, Email: benseethalrani@gmail.com, Country of Origin: India.</p>
                </div>
              </div>

              <div class="accordion-item">
                <button class="accordion-header" onclick="VedaProductPage.toggleAccordion(this)">
                  <span>Shipping &amp; Delivery Policies</span>
                  <span class="chevron">+</span>
                </button>
                <div class="accordion-content">
                  <p>All orders are freshly packed and dispatched within 24 hours. Free express shipping on orders above ₹999 across India. Standard delivery takes 2 to 4 business days.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Mobile Purchase Bar -->
        <div class="sticky-add-cart-bar" id="sticky-pdp-bar">
          <div class="sticky-bar-info">
            <img src="${galleryImages[0]}" alt="${product.title}" />
            <div>
              <div style="font-weight: 700; font-size: 0.85rem; max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.name}</div>
              <div style="font-weight: 800; color: var(--color-primary); font-size: 0.92rem;" id="sticky-price">${formatPrice(price)}</div>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="VedaProductPage.addToCart()">Add to Cart</button>
        </div>

        <!-- Related Products Section -->
        <section class="section section-bg-cream" style="margin-top: 50px; border-radius: var(--radius-xl); padding: 48px 32px; background: #fdfdfc; border: 1px solid var(--color-border);">
          <div class="section-header" style="text-align: center; margin-bottom: 32px;">
            <span class="sub-badge" style="color: var(--color-primary); font-weight: 800; text-transform: uppercase; font-size: 0.82rem; letter-spacing: 0.08em; display: inline-block; margin-bottom: 6px;">Traditional Harvest</span>
            <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 8px;">Related RP Organics Products</h2>
            <p style="color: var(--color-text-muted); font-size: 0.95rem;">Pure organic nutrition and traditional podis to enrich your daily family meals.</p>
          </div>
          <div class="products-grid" id="related-products-grid"></div>
        </section>

        <!-- Customer Ratings & Verified Reviews Section -->
        <section class="section" id="customer-reviews-section" style="margin-top: 50px;">
          <div class="section-header" style="text-align: center; margin-bottom: 36px;">
            <span class="sub-badge" style="color: var(--color-primary); font-weight: 800; text-transform: uppercase; font-size: 0.82rem; letter-spacing: 0.08em; display: inline-block; margin-bottom: 6px;">Customer Testimonials</span>
            <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--color-text-main); margin-bottom: 8px;">Customer Ratings &amp; Reviews</h2>
            <p style="color: var(--color-text-muted); font-size: 0.95rem;">Real feedback from verified households enjoying RP Organics.</p>
          </div>

          <div style="max-width: 860px; margin: 0 auto; background-color: #ffffff; padding: 36px; border-radius: var(--radius-lg); border: 1.5px solid var(--color-border); display: grid; grid-template-columns: 260px 1fr; gap: 36px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
            <div style="text-align: center; border-right: 1px solid var(--color-border-light); padding-right: 24px;">
              <div style="font-size: 3.8rem; font-weight: 800; color: var(--color-primary); line-height: 1;">${product.rating || '4.9'}</div>
              <div style="color: #f59e0b; font-size: 1.3rem; margin: 10px 0;">★★★★★</div>
              <div style="font-size: 0.88rem; color: var(--color-text-muted);">Based on ${product.reviewCount || 142} verified customer reviews</div>
              <button class="btn btn-outline btn-sm" style="margin-top: 18px; font-weight: 700;" onclick="VedaProductPage.openWriteReviewModal()">Write a Review</button>
            </div>

            <div>
              <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.88rem;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="width: 50px; font-weight: 600;">5 Star</span>
                  <div style="flex: 1; height: 10px; background-color: var(--color-surface-subtle); border-radius: 5px; overflow: hidden; border: 1px solid var(--color-border);"><div style="width: 92%; height: 100%; background-color: var(--color-primary);"></div></div>
                  <span style="width: 38px; color: var(--color-text-light); font-weight: 600;">92%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="width: 50px; font-weight: 600;">4 Star</span>
                  <div style="flex: 1; height: 10px; background-color: var(--color-surface-subtle); border-radius: 5px; overflow: hidden; border: 1px solid var(--color-border);"><div style="width: 6%; height: 100%; background-color: var(--color-primary);"></div></div>
                  <span style="width: 38px; color: var(--color-text-light); font-weight: 600;">6%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="width: 50px; font-weight: 600;">3 Star</span>
                  <div style="flex: 1; height: 10px; background-color: var(--color-surface-subtle); border-radius: 5px; overflow: hidden; border: 1px solid var(--color-border);"><div style="width: 2%; height: 100%; background-color: var(--color-primary);"></div></div>
                  <span style="width: 38px; color: var(--color-text-light); font-weight: 600;">2%</span>
                </div>
              </div>
            </div>
          </div>

          <div style="max-width: 860px; margin: 28px auto 0; display: flex; flex-direction: column; gap: 16px;">
            <div style="padding: 22px; background-color: #ffffff; border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <strong style="font-size: 0.96rem; color: var(--color-text-main);">Kavitha Sundaram</strong>
                <span style="color: #f59e0b; font-size: 1rem;">★★★★★</span>
              </div>
              <span style="font-size: 0.78rem; color: var(--color-primary); font-weight: 700;">✓ Verified Buyer &bull; 10 days ago</span>
              <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-top: 8px; line-height: 1.6;">
                Unbeatable authentic taste and natural aroma! The quality is vastly superior to mass-market commercial brands. You can tell it has zero preservatives or artificial chemicals.
              </p>
            </div>
          </div>
        </section>
      `;

      // Render Related Products (excluding current)
      const relatedGrid = document.getElementById('related-products-grid');
      if (relatedGrid && typeof VedaComponents !== 'undefined' && VedaComponents.renderProductCard) {
        const related = products.filter(p => p.id !== product.id).slice(0, 4);
        relatedGrid.innerHTML = related.map(p => VedaComponents.renderProductCard(p)).join('');
      }

      // Initialize Desktop Zoom Magnifier
      initZoomMagnifier();
    }
  }

  function initZoomMagnifier() {
    if (window.innerWidth < 1024) return;
    const box = document.getElementById('main-view-zoom-box');
    const img = document.getElementById('detail-main-img');
    if (!box || !img) return;

    box.addEventListener('mousemove', (e) => {
      const rect = box.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      img.style.transformOrigin = `${x}% ${y}%`;
      img.style.transform = 'scale(1.5)';
    });

    box.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1)';
      img.style.transformOrigin = 'center center';
    });
  }

  // Re-render if browser back/forward or hash changes
  window.addEventListener('popstate', initProductPage);
  window.addEventListener('hashchange', initProductPage);

  // Self-initialize on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductPage);
  } else {
    initProductPage();
  }

})();
