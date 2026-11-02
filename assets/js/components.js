/**
 * RP Organics - Core UI Components & Interactive Engine
 * Brand: RP Organics | Owner: Rani Pavunrasu | FSSAI Lic No: 22426431000125
 * Phone: 9150300641 | Email: benseethalrani@gmail.com
 */

window.RPComponents = {

  /**
   * Render a responsive, interactive product card conforming to RP Organics requirements
   */
    renderProductCard(product, options = {}) {
    const isWishlisted = Store.isInWishlist(product.id);
    const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
    const currentPrice = defaultVariant ? defaultVariant.price : product.price;
    const currentCompare = defaultVariant ? (defaultVariant.compareAtPrice || defaultVariant.comparePrice) : (product.compareAtPrice || product.comparePrice);
    const currentSavings = defaultVariant && defaultVariant.savings 
      ? defaultVariant.savings 
      : (currentCompare > currentPrice ? `Save ${Store.formatPrice(currentCompare - currentPrice)}` : '');
    const currentDiscount = defaultVariant && defaultVariant.discount
      ? defaultVariant.discount
      : (currentCompare > currentPrice ? `${Math.round(((currentCompare - currentPrice) / currentCompare) * 100)}% OFF` : '');

    const formattedPrice = Store.formatPrice(currentPrice);
    const formattedCompare = currentCompare ? Store.formatPrice(currentCompare) : '';

    const primaryImg = product.primaryImage || 'assets/images/product-placeholder.png';
    const hoverImg = product.hoverImage || (product.images && product.images[1]) || '';

    // Gallery images for swipe navigation
    const gallery = (product.gallery && product.gallery.length > 0)
      ? product.gallery
      : (product.images && product.images.length > 0 ? product.images : [primaryImg]);
    const galleryJson = JSON.stringify(gallery).replace(/"/g, '&quot;');

    // Stars generation
    const fullStars = Math.floor(product.rating || 5);
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHtml += `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      } else {
        starsHtml += `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      }
    }

    // Badges
    let badgeHtml = '';
    if (product.badge) {
      badgeHtml = `<span class="badge badge-${product.badgeType || 'sale'}">${product.badge}</span>`;
    }

    // Special Claim Rule: Apply ONLY to Protein Health Mix (pro-01)
    let proteinClaimHtml = '';
    if (product.specialClaim && product.id === 'pro-01') {
      proteinClaimHtml = `
        <div class="protein-callout-badge" style="background: linear-gradient(135deg, #15803d, #166534); color: #ffffff; font-size: 0.74rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; margin-bottom: 6px; box-shadow: 0 2px 4px rgba(22,101,52,0.2);">
          ⚡ ${product.specialClaim}
        </div>
      `;
    }

    // Variants preview pills
    let variantsHtml = '';
    if (product.variants && product.variants.length > 0) {
      variantsHtml = `
        <div class="product-variant-preview">
          ${product.variants.map((v, idx) => `
            <span class="variant-pill ${idx === 0 ? 'active' : ''}">${v.name}</span>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="product-card" data-product-id="${product.id}" onclick="if(this._suppressClickUntil && Date.now() < this._suppressClickUntil){event.preventDefault();event.stopPropagation();return;} try{sessionStorage.setItem('rp_current_product_id', '${product.id}');}catch(e){}; if(!event.target.closest('button, a, .card-swipe-dots, .card-img-arrow')) window.location.href='product.html?id=${product.id}'">
        <div class="product-card-media" data-gallery="${galleryJson}" data-img-index="0">
          <div class="product-badges">
            ${badgeHtml}
            ${currentDiscount ? `<span class="discount-badge">${currentDiscount}</span>` : ''}
          </div>

          <!-- Quick Action Icon Row over image on hover (Groceryo Reference Style) -->
          <div class="product-card-hover-actions" aria-label="Quick Actions">
            <button class="card-action-btn quickview-btn" 
                    onclick="event.preventDefault(); event.stopPropagation(); RPComponents.openQuickView('${product.id}')"
                    title="Quick View"
                    aria-label="Quick View">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="card-action-btn wishlist-btn ${isWishlisted ? 'active' : ''}" 
                    onclick="event.preventDefault(); event.stopPropagation(); RPComponents.handleWishlistToggle('${product.id}', this)"
                    title="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
                    aria-label="Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <button class="card-action-btn hover-add-cart-btn" 
                    onclick="event.preventDefault(); event.stopPropagation(); Store.addToCart('${product.id}', null, 1)"
                    title="Add to Order List"
                    aria-label="Add to Order List">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </button>
          </div>

          <!-- Card Gallery Swipe Navigation Arrows -->
          ${gallery.length > 1 ? `
            <button type="button" class="card-img-arrow prev" aria-label="Previous photo" onclick="event.preventDefault(); event.stopPropagation(); RPComponents.cycleCardImage(this, -1);">&lsaquo;</button>
            <button type="button" class="card-img-arrow next" aria-label="Next photo" onclick="event.preventDefault(); event.stopPropagation(); RPComponents.cycleCardImage(this, 1);">&rsaquo;</button>
          ` : ''}

          <a href="product.html?id=${product.id}" onclick="if(this.closest('.product-card') && this.closest('.product-card')._suppressClickUntil && Date.now() < this.closest('.product-card')._suppressClickUntil){event.preventDefault();event.stopPropagation();return false;} try{sessionStorage.setItem('rp_current_product_id', '${product.id}');}catch(e){}" class="product-media-link" aria-label="${product.title}">
            <img class="product-img-primary" 
                 src="${primaryImg}" 
                 alt="${product.title}" 
                 width="400" 
                 height="400" 
                 loading="lazy" 
                 onerror="this.onerror=null; this.src='assets/images/product-placeholder.png';" />
            ${hoverImg ? `
            <img class="product-img-hover" 
                 src="${hoverImg}" 
                 alt="${product.title} prepared meal" 
                 width="400" 
                 height="400" 
                 loading="lazy" 
                 onerror="this.onerror=null; this.src='assets/images/product-placeholder.png';" />
            ` : ''}
          </a>

          <!-- Dots Indicator for Swiping Product Images -->
          ${gallery.length > 1 ? `
            <div class="card-swipe-dots" aria-hidden="true">
              ${gallery.map((_, i) => `<span class="card-swipe-dot ${i === 0 ? 'active' : ''}" onclick="event.preventDefault(); event.stopPropagation(); RPComponents.setCardImage(this, ${i});"></span>`).join('')}
            </div>
          ` : ''}
        </div>

        <div class="product-card-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span class="product-card-category">${product.category}</span>
            <span class="fssai-trust-pill" style="font-size: 0.68rem; font-weight: 700; color: #166534; background: #f0fdf4; padding: 2px 6px; border-radius: 4px; border: 1px solid #bbf7d0;">
              ✓ FSSAI Reg.
            </span>
          </div>

          <h3 class="product-card-title">
            <a href="product.html?id=${product.id}" onclick="try{sessionStorage.setItem('rp_current_product_id', '${product.id}');}catch(e){}">${product.title}</a>
          </h3>

          ${proteinClaimHtml}

          <div class="product-rating">
            <div class="stars-row">${starsHtml}</div>
            <span class="rating-count">(${product.reviewCount || 100})</span>
          </div>

          ${variantsHtml}

          <div class="product-card-footer">
            <div class="product-card-price-row">
              <div class="product-price-wrap">
                <div style="display: flex; align-items: baseline; gap: 6px;">
                  <span class="product-price">${formattedPrice}</span>
                  ${formattedCompare ? `<span class="product-compare-price">${formattedCompare}</span>` : ''}
                </div>
                ${currentSavings ? `<span class="product-savings-badge">${currentSavings}</span>` : ''}
              </div>
              <span class="product-fresh-pill" style="font-size: 0.72rem; font-weight: 700; color: #166534; background: #f0fdf4; padding: 2px 7px; border-radius: 4px; border: 1px solid #bbf7d0;">
                100% Pure
              </span>
            </div>

            <div class="product-card-actions-row">
              <button class="btn-whatsapp-order" onclick="event.stopPropagation(); RPComponents.orderProductOnWhatsApp('${product.id}')" title="Order on WhatsApp" aria-label="Order ${product.title} on WhatsApp">
                <svg width="16" height="16" viewBox="5.4 5.4 13.2 13.7" fill="currentColor" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.072-1.848-.431-1.393-.576-2.316-1.996-2.385-2.088-.069-.093-.564-.75-.564-1.433 0-.682.358-1.017.486-1.155.127-.138.278-.173.371-.173.093 0 .185.001.266.005.086.004.202-.033.315.241.118.286.405.987.44 1.058.035.07.058.152.012.244-.047.092-.07.15-.14.23-.07.081-.148.182-.211.245-.07.07-.143.146-.062.285.081.139.362.597.776.966.533.475.981.623 1.12.693.139.07.22.058.301-.035.082-.093.348-.405.441-.544.093-.139.186-.116.313-.07.127.046.808.381.947.451.139.07.232.104.266.162.035.058.035.337-.109.742z"/>
                </svg>
                <span>Order on WhatsApp</span>
              </button>
              <button class="btn-add-order-list" onclick="event.stopPropagation(); Store.addToCart('${product.id}', null, 1)" title="Add to Order List" aria-label="Add ${product.title} to Order List">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
                <span>Add to List</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Cycle product card images on swipe or arrow click
   */
  cycleCardImage(targetEl, delta) {
    const mediaEl = targetEl.classList && targetEl.classList.contains('product-card-media')
      ? targetEl
      : targetEl.closest('.product-card-media');
    if (!mediaEl) return;

    let gallery = [];
    try {
      gallery = JSON.parse(mediaEl.getAttribute('data-gallery') || '[]');
    } catch (e) {
      gallery = [];
    }

    if (!gallery || gallery.length <= 1) return;

    const currentIndex = parseInt(mediaEl.getAttribute('data-img-index') || '0', 10);
    const nextIndex = (currentIndex + delta + gallery.length) % gallery.length;
    mediaEl.setAttribute('data-img-index', nextIndex);

    // Suppress outer card click navigation to allow swiping freely
    const card = mediaEl.closest('.product-card');
    if (card) {
      card._suppressClickUntil = Date.now() + 600;
    }

    const primaryImg = mediaEl.querySelector('.product-img-primary');
    if (primaryImg) {
      primaryImg.style.opacity = '0.25';
      primaryImg.style.transform = 'scale(0.96)';
      setTimeout(() => {
        primaryImg.src = gallery[nextIndex];
        primaryImg.style.opacity = '1';
        primaryImg.style.transform = 'scale(1)';
      }, 90);
    }

    // Hide hover image so swiped image stays in view
    const hoverImg = mediaEl.querySelector('.product-img-hover');
    if (hoverImg) {
      hoverImg.style.display = 'none';
    }

    // Update dot indicators
    const dots = mediaEl.querySelectorAll('.card-swipe-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === nextIndex);
    });
  },

  setCardImage(dotEl, targetIndex) {
    const mediaEl = dotEl.closest('.product-card-media');
    if (!mediaEl) return;
    const currentIndex = parseInt(mediaEl.getAttribute('data-img-index') || '0', 10);
    const delta = targetIndex - currentIndex;
    if (delta !== 0) {
      this.cycleCardImage(mediaEl, delta);
    }
  },

  bindCardMediaSwipe(mediaEl) {
    if (!mediaEl || mediaEl._swipeBound) return;
    mediaEl._swipeBound = true;

    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    mediaEl.addEventListener('touchstart', (e) => {
      if (!e.touches || !e.touches[0]) return;
      if (e.target.closest('.product-card-hover-actions, .card-action-btn, .product-badges, .card-img-arrow, .card-swipe-dots')) {
        return;
      }
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = false;
    }, { passive: true });

    mediaEl.addEventListener('touchmove', (e) => {
      if (!e.touches || !e.touches[0]) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        isSwiping = true;
      }
    }, { passive: true });

    mediaEl.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      isSwiping = false;
      const touch = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : null;
      if (!touch) return;
      const diffX = touchStartX - touch.clientX;
      const diffY = touchStartY - touch.clientY;
      if (Math.abs(diffX) > 22 && Math.abs(diffX) > Math.abs(diffY)) {
        const card = mediaEl.closest('.product-card');
        if (card) {
          card._suppressClickUntil = Date.now() + 600;
        }
        if (diffX > 0) {
          RPComponents.cycleCardImage(mediaEl, 1);
        } else {
          RPComponents.cycleCardImage(mediaEl, -1);
        }
      }
    }, { passive: true });
  },

  /**
   * Initialize touch and pointer swipe handlers for all product cards across all pages
   */
  initProductCardSwipe() {
    // Bind all currently present product cards
    document.querySelectorAll('.product-card-media').forEach(mediaEl => {
      RPComponents.bindCardMediaSwipe(mediaEl);
    });

    if (this._cardSwipeInitialized) return;
    this._cardSwipeInitialized = true;

    // Observe future dynamically added product cards (shop filters, related products)
    if (window.MutationObserver) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
          m.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.classList && node.classList.contains('product-card-media')) {
                RPComponents.bindCardMediaSwipe(node);
              } else if (node.querySelectorAll) {
                node.querySelectorAll('.product-card-media').forEach(mEl => RPComponents.bindCardMediaSwipe(mEl));
              }
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  },

  handleWishlistToggle(productId, btn) {
    const isAdded = Store.toggleWishlist(productId);
    if (btn) {
      if (isAdded) {
        btn.classList.add('active');
        btn.querySelector('svg').setAttribute('fill', 'currentColor');
      } else {
        btn.classList.remove('active');
        btn.querySelector('svg').setAttribute('fill', 'none');
      }
    }
  },

  /**
   * Search Auto-suggest handler
   */
  initSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
      if (input.id === 'search-page-input') return;
      const dropdown = input.closest('.header-search')?.querySelector('.search-results-dropdown');
      if (!dropdown) return;

      let debounceTimer = null;
      input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 2) {
          dropdown.classList.remove('active');
          dropdown.innerHTML = '';
          return;
        }

        debounceTimer = setTimeout(() => {
          const results = searchProducts(query).slice(0, 5);
          if (results.length === 0) {
            dropdown.innerHTML = `
              <div class="search-dropdown-header">RP Organics Search Results</div>
              <div style="padding: 16px; text-align: center; color: var(--color-text-muted); font-size: 0.9rem;">
                No organic products found matching "${query}".
              </div>
            `;
          } else {
            dropdown.innerHTML = `
              <div class="search-dropdown-header">Products (${results.length})</div>
              ${results.map(prod => `
                <a href="product.html?id=${prod.id}" onclick="try{sessionStorage.setItem('rp_current_product_id', '${prod.id}');}catch(e){}" class="search-result-item">
                  <img src="${prod.primaryImage}" alt="${prod.title}" />
                  <div class="search-result-info">
                    <div class="search-result-title">${prod.title}</div>
                    <div class="search-result-meta">
                      <span class="search-result-cat">${prod.category}</span>
                      <span class="search-result-price">${Store.formatPrice(prod.price)}</span>
                    </div>
                  </div>
                </a>
              `).join('')}
              <div class="search-dropdown-footer">
                <a href="search.html?q=${encodeURIComponent(query)}">View all results for "${query}" &rarr;</a>
              </div>
            `;
          }
          dropdown.classList.add('active');
        }, 200);
      });

      document.addEventListener('click', (e) => {
        if (!input.closest('.header-search')?.contains(e.target)) {
          dropdown.classList.remove('active');
        }
      });
    });
  },

  /**
   * Quick View Modal
   */
  openQuickView(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    let overlay = document.getElementById('rp-quickview-overlay') || document.getElementById('vr-quickview-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'rp-quickview-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    let activeVariant = product.variants ? product.variants[0] : null;

    const renderModalContent = () => {
      const price = activeVariant ? activeVariant.price : product.price;
      const compare = activeVariant ? activeVariant.compareAtPrice : product.compareAtPrice;
      const savings = activeVariant && activeVariant.savings ? activeVariant.savings : (compare > price ? `Save ${Store.formatPrice(compare - price)}` : '');
      const discount = activeVariant && activeVariant.discount ? activeVariant.discount : '';

      overlay.innerHTML = `
        <div class="quickview-modal">
          <button class="modal-close-btn" onclick="RPComponents.closeQuickView()" aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div class="quickview-body">
            <div class="quickview-gallery">
              <div class="quickview-main-image">
                <img id="qv-main-img" src="${product.primaryImage}" alt="${product.title}" onerror="this.onerror=null; this.src='assets/images/product-placeholder.png';" />
              </div>
              <div class="quickview-thumbnails">
                ${(product.images || product.gallery || [product.primaryImage]).map((imgUrl, i) => `
                  <div class="quickview-thumb ${i === 0 ? 'active' : ''}" onclick="RPComponents.switchQuickViewImg('${imgUrl}', this)">
                    <img src="${imgUrl}" alt="Thumbnail ${i+1}" onerror="this.onerror=null; this.src='assets/images/product-placeholder.png';" />
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="quickview-details">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span class="product-category-crumb">${product.category}</span>
                <span style="font-size: 0.74rem; font-weight: 700; color: #166534; background: #f0fdf4; padding: 3px 8px; border-radius: 4px; border: 1px solid #bbf7d0;">
                  FSSAI Lic: 22426431000125
                </span>
              </div>

              <h2 class="quickview-title">${product.title}</h2>

              ${product.specialClaim && product.id === 'pro-01' ? `
                <div style="background: #15803d; color: #ffffff; font-size: 0.82rem; font-weight: 800; padding: 5px 12px; border-radius: 4px; display: inline-flex; align-items: center; gap: 6px; margin: 6px 0 10px;">
                  ⚡ ${product.specialClaim}
                </div>
              ` : ''}
              
              <div class="product-rating" style="margin-bottom: 12px;">
                <span style="color: #f59e0b; font-weight: 700;">★ ${product.rating}</span>
                <span class="rating-count">(${product.reviewCount} customer reviews)</span>
              </div>

              <div class="quickview-price-wrap">
                <span class="quickview-price" id="qv-price">${Store.formatPrice(price)}</span>
                ${compare ? `<span class="product-detail-compare" id="qv-compare">${Store.formatPrice(compare)}</span>` : ''}
                ${discount ? `<span class="discount-badge" id="qv-discount">${discount}</span>` : ''}
                ${savings ? `<span style="font-size: 0.8rem; color: #b91c1c; font-weight: 700;" id="qv-savings">${savings}</span>` : ''}
              </div>

              <p class="quickview-desc">${product.shortDescription}</p>

              ${product.variants && product.variants.length > 0 ? `
                <div class="quickview-variant-options">
                  <span class="variant-label">Select Pack Size:</span>
                  <div class="variant-buttons">
                    ${product.variants.map((v, i) => `
                      <button class="variant-btn ${i === 0 ? 'active' : ''}" 
                              onclick="RPComponents.switchQuickViewVariant('${product.id}', '${v.name}', this)">
                        ${v.name}
                      </button>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div class="quickview-qty-row" style="display: flex; gap: 10px; align-items: stretch; margin-bottom: 12px; flex-wrap: wrap;">
                <div class="qty-picker" style="height: 48px;">
                  <button class="qty-btn" onclick="RPComponents.changeQuickViewQty(-1)" aria-label="Decrease quantity">-</button>
                  <input type="number" id="qv-qty-input" class="qty-input" value="1" min="1" readonly aria-label="Selected quantity" />
                  <button class="qty-btn" onclick="RPComponents.changeQuickViewQty(1)" aria-label="Increase quantity">+</button>
                </div>

                <button class="btn btn-whatsapp-large" style="flex: 1.2; height: 48px;" onclick="RPComponents.orderQuickViewOnWhatsApp('${product.id}')">
                  <svg width="20" height="20" viewBox="5.4 5.4 13.2 13.7" fill="currentColor" aria-hidden="true">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.072-1.848-.431-1.393-.576-2.316-1.996-2.385-2.088-.069-.093-.564-.75-.564-1.433 0-.682.358-1.017.486-1.155.127-.138.278-.173.371-.173.093 0 .185.001.266.005.086.004.202-.033.315.241.118.286.405.987.44 1.058.035.07.058.152.012.244-.047.092-.07.15-.14.23-.07.081-.148.182-.211.245-.07.07-.143.146-.062.285.081.139.362.597.776.966.533.475.981.623 1.12.693.139.07.22.058.301-.035.082-.093.348-.405.441-.544.093-.139.186-.116.313-.07.127.046.808.381.947.451.139.07.232.104.266.162.035.058.035.337-.109.742z"/>
                  </svg>
                  <span>Order on WhatsApp</span>
                </button>

                <button class="btn btn-outline" style="flex: 1; height: 48px;" onclick="RPComponents.addQuickViewToCart('${product.id}')">
                  + Add to Order List
                </button>
              </div>

              <div class="whatsapp-notice-box" style="margin: 10px 0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <div>
                  <strong>Order directly on WhatsApp.</strong> Send your selected items, and we’ll confirm availability, delivery charges, and payment details.
                </div>
              </div>

              <div class="whatsapp-fallback-box" style="margin-bottom: 14px;">
                Unable to open WhatsApp? Message us at <strong>+91 9150300641</strong>.<br />
                <button type="button" class="btn-copy-msg" onclick="RPComponents.copyQuickViewOrderMessage('${product.id}')">
                  📋 Copy Order Message
                </button>
              </div>

              <div style="border-top: 1px solid var(--color-border-light); padding-top: 14px;">
                <a href="product.html?id=${product.id}" onclick="try{sessionStorage.setItem('rp_current_product_id', '${product.id}');}catch(e){}" style="color: var(--color-primary); font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
                  View Full Product Details &amp; Preparation Steps &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    };

    renderModalContent();
    overlay.dataset.activeVariant = activeVariant ? activeVariant.name : '';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close on backdrop tap for mobile
    overlay.onclick = (e) => {
      if (e.target === overlay) RPComponents.closeQuickView();
    };
  },

  closeQuickView() {
    const overlay = document.getElementById('rp-quickview-overlay') || document.getElementById('vr-quickview-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  switchQuickViewImg(src, thumbEl) {
    const mainImg = document.getElementById('qv-main-img');
    if (mainImg) mainImg.src = src;
    document.querySelectorAll('.quickview-thumb').forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  },

  switchQuickViewVariant(productId, variantName, btn) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const variant = product.variants.find(v => v.name === variantName);
    if (!variant) return;

    btn.parentElement.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const priceEl = document.getElementById('qv-price');
    const compareEl = document.getElementById('qv-compare');
    const discountEl = document.getElementById('qv-discount');
    const savingsEl = document.getElementById('qv-savings');

    if (priceEl) priceEl.textContent = Store.formatPrice(variant.price);
    if (compareEl && variant.compareAtPrice) compareEl.textContent = Store.formatPrice(variant.compareAtPrice);
    if (discountEl && variant.discount) discountEl.textContent = variant.discount;
    if (savingsEl && variant.savings) savingsEl.textContent = variant.savings;

    btn.dataset.selectedVariant = variant.name;
    const overlay = document.getElementById('rp-quickview-overlay') || document.getElementById('vr-quickview-overlay');
    if (overlay) overlay.dataset.activeVariant = variant.name;
  },

  changeQuickViewQty(delta) {
    const input = document.getElementById('qv-qty-input');
    if (!input) return;
    let val = parseInt(input.value, 10) || 1;
    val = Math.max(1, val + delta);
    input.value = val;
  },

  addQuickViewToCart(productId) {
    const activeBtn = document.querySelector('.quickview-modal .variant-btn.active');
    const variantName = activeBtn ? activeBtn.textContent.trim() : null;
    const input = document.getElementById('qv-qty-input');
    const qty = input ? parseInt(input.value, 10) : 1;

    Store.addToCart(productId, variantName, qty);
    this.closeQuickView();
  },

  /**
   * Order a single product on WhatsApp with default variant and quantity 1
   */
  orderProductOnWhatsApp(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
    const whatsappUtil = window.RPWhatsApp;
    if (!whatsappUtil) {
      window.location.href = `https://wa.me/919150300641?text=${encodeURIComponent('Hello RP Organics! I would like to order: ' + (product.name || product.title))}`;
      return;
    }
    const msg = whatsappUtil.buildSingleProductMessage(product, defaultVariant, 1);
    whatsappUtil.openWhatsApp(msg);
  },

  /**
   * Order currently selected variant and quantity from Quick View modal on WhatsApp
   */
  orderQuickViewOnWhatsApp(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const activeBtn = document.querySelector('.quickview-modal .variant-btn.active');
    const variantName = activeBtn ? activeBtn.textContent.trim() : (product.variants && product.variants.length > 0 ? product.variants[0].name : null);
    const input = document.getElementById('qv-qty-input');
    const qty = input ? parseInt(input.value, 10) : 1;

    const whatsappUtil = window.RPWhatsApp;
    if (!whatsappUtil) {
      window.location.href = `https://wa.me/919150300641`;
      return;
    }
    const msg = whatsappUtil.buildSingleProductMessage(product, variantName, qty);
    whatsappUtil.openWhatsApp(msg);
  },

  /**
   * Copy Quick View prefilled message to clipboard
   */
  copyQuickViewOrderMessage(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const activeBtn = document.querySelector('.quickview-modal .variant-btn.active');
    const variantName = activeBtn ? activeBtn.textContent.trim() : (product.variants && product.variants.length > 0 ? product.variants[0].name : null);
    const input = document.getElementById('qv-qty-input');
    const qty = input ? parseInt(input.value, 10) : 1;

    const whatsappUtil = window.RPWhatsApp;
    if (!whatsappUtil) return;
    const msg = whatsappUtil.buildSingleProductMessage(product, variantName, qty);
    whatsappUtil.copyMessage(msg).then(ok => {
      if (ok) {
        Store.showToast('✓ Order message copied to clipboard! You can paste it into WhatsApp directly.', 'success');
      } else {
        Store.showToast('Unable to copy message automatically.', 'error');
      }
    });
  },

  /**
   * Send the entire Order List (Cart) to WhatsApp
   */
  sendOrderListToWhatsApp() {
    const cart = Store.getCart();
    if (!cart || cart.length === 0) {
      Store.showToast('Your Order List is empty. Please add products first.', 'error');
      return;
    }
    const subtotal = Store.getCartSubtotal();
    const whatsappUtil = window.RPWhatsApp;
    if (!whatsappUtil) return;
    const msg = whatsappUtil.buildMultiProductMessage(cart, subtotal);
    whatsappUtil.openWhatsApp(msg);
  },

  /**
   * Copy entire Order List prefilled message to clipboard
   */
  copyOrderListMessage() {
    const cart = Store.getCart();
    if (!cart || cart.length === 0) {
      Store.showToast('Your Order List is empty. Please add products first.', 'error');
      return;
    }
    const subtotal = Store.getCartSubtotal();
    const whatsappUtil = window.RPWhatsApp;
    if (!whatsappUtil) return;
    const msg = whatsappUtil.buildMultiProductMessage(cart, subtotal);
    whatsappUtil.copyMessage(msg).then(ok => {
      if (ok) {
        Store.showToast('✓ Order List copied to clipboard! You can paste it into WhatsApp directly.', 'success');
      } else {
        Store.showToast('Unable to copy message automatically.', 'error');
      }
    });
  },

  /**
   * Bind Sticky Header and Header Badges
   */
  initHeader() {
    const header = document.querySelector('.main-header');
    if (header) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
          header.classList.add('is-sticky');
        } else {
          header.classList.remove('is-sticky');
        }
      });
    }

    // Currency Switcher
    const currencySelects = document.querySelectorAll('.currency-select');
    currencySelects.forEach(sel => {
      sel.value = Store.state.currency;
      sel.addEventListener('change', (e) => {
        Store.setCurrency(e.target.value);
      });
    });

    // Sync header badges with store events
    const updateCartBadges = (e) => {
      const count = e.detail.count;
      document.querySelectorAll('.cart-count-badge').forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      });
    };
    window.addEventListener('rp:cart-updated', updateCartBadges);
    window.addEventListener('vr:cart-updated', updateCartBadges);

    const updateWishlistBadges = (e) => {
      const count = e.detail.count;
      document.querySelectorAll('.wishlist-count-badge').forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      });
    };
    window.addEventListener('rp:wishlist-updated', updateWishlistBadges);
    window.addEventListener('vr:wishlist-updated', updateWishlistBadges);

    // Mobile Hamburger Drawer & Categories Accordion
    const drawerOverlay = document.querySelector('.mobile-drawer-overlay');
    const drawer = document.querySelector('.mobile-nav-drawer');
    const drawerClose = document.querySelector('.mobile-drawer-close');

    const openDrawer = () => {
      if (drawerOverlay && drawer) {
        drawerOverlay.classList.add('active');
        drawer.classList.add('active');
        drawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    };
    const closeDrawer = () => {
      if (drawerOverlay && drawer) {
        drawerOverlay.classList.remove('active');
        drawer.classList.remove('active');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    };

    document.querySelectorAll('.hamburger-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });
    });

    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

    // Escape key listener for drawer
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
    });

    // Mobile Categories Accordion Toggle inside Drawer
    document.querySelectorAll('.mobile-categories-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const acc = btn.nextElementSibling || document.querySelector('.mobile-categories-accordion');
        if (acc) {
          const isOpen = acc.classList.toggle('open');
          acc.style.display = isOpen ? 'flex' : 'none';
          btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          const chevron = btn.querySelector('.accordion-chevron') || btn.querySelector('span:last-child');
          if (chevron) chevron.textContent = isOpen ? '−' : '+';
        }
      });
    });
  },

  initCircularPreloader() {
    const preloader = document.getElementById('rp-preloader');
    if (!preloader) return;

    const dismissPreloader = () => {
      if (preloader.classList.contains('fade-out')) return;
      preloader.classList.add('fade-out');
      setTimeout(() => {
        if (preloader && preloader.parentNode) {
          preloader.parentNode.removeChild(preloader);
        }
      }, 420);
    };

    if (document.readyState === 'complete') {
      setTimeout(dismissPreloader, 100);
    } else {
      window.addEventListener('load', dismissPreloader);
      setTimeout(dismissPreloader, 2500);
    }
  }
};

/**
 * Slide-out Ajax Cart Drawer Singleton for RP Organics
 */
window.CartDrawer = {
  drawerEl: null,
  overlayEl: null,

  init() {
    this.createDrawerDOM();
    this.bindEvents();
    this.render();
  },

  createDrawerDOM() {
    let overlay = document.getElementById('rp-cart-drawer-overlay') || document.getElementById('vr-cart-drawer-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'rp-cart-drawer-overlay';
      overlay.className = 'cart-drawer-overlay';
      document.body.appendChild(overlay);
    }
    this.overlayEl = overlay;

    let drawer = document.getElementById('rp-cart-drawer') || document.getElementById('vr-cart-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'rp-cart-drawer';
      drawer.className = 'cart-drawer';
      document.body.appendChild(drawer);
    }
    this.drawerEl = drawer;
  },

  open() {
    if (!this.drawerEl) this.init();
    this.render();
    this.overlayEl.classList.add('active');
    this.drawerEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (this.drawerEl) {
      this.overlayEl.classList.remove('active');
      this.drawerEl.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  render() {
    if (!this.drawerEl) return;
    const cart = Store.state.cart;
    const count = Store.getCartCount();
    const subtotal = Store.getCartSubtotal();
    const freeShipping = Store.getFreeShippingProgress();

    const upsellCandidates = PRODUCTS.filter(p => !cart.some(ci => ci.productId === p.id)).slice(0, 2);

    let freeShippingHtml = '';
    if (freeShipping.isFree) {
      freeShippingHtml = `
        <div class="free-shipping-bar">
          <div class="shipping-bar-text" style="color: var(--color-success);">
            🎉 <strong>Congratulations!</strong> You qualify for FREE Delivery!
          </div>
          <div class="shipping-progress-track">
            <div class="shipping-progress-fill" style="width: 100%;"></div>
          </div>
        </div>
      `;
    } else {
      freeShippingHtml = `
        <div class="free-shipping-bar">
          <div class="shipping-bar-text">
            Add <strong>${Store.formatPrice(freeShipping.needed)}</strong> more to get <strong>FREE Delivery</strong>!
          </div>
          <div class="shipping-progress-track">
            <div class="shipping-progress-fill" style="width: ${freeShipping.percent}%;"></div>
          </div>
        </div>
      `;
    }

    let itemsHtml = '';
    if (cart.length === 0) {
      itemsHtml = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <h4 class="cart-empty-title">Your Order List is Empty</h4>
          <p class="cart-empty-desc">Discover our traditional Poondu Podi, Pirandai Podi, Millet Powder, and Protein Health Mix!</p>
          <a href="shop.html" class="btn btn-primary" onclick="CartDrawer.close()">Explore Store</a>
        </div>
      `;
    } else {
      itemsHtml = `
        <div class="cart-items-list">
          ${cart.map(item => `
            <div class="cart-item" data-item-key="${item.key}">
              <img src="${item.image}" alt="${item.title}" class="cart-item-img" />
              <div class="cart-item-details">
                <a href="product.html?id=${item.productId}" class="cart-item-title" onclick="try{sessionStorage.setItem('rp_current_product_id', '${item.productId}');}catch(e){}; CartDrawer.close()">${item.title}</a>
                <span class="cart-item-variant">Pack: ${item.variant}</span>
                <div class="cart-item-pricing">
                  <span class="cart-item-price">${Store.formatPrice(item.price * item.quantity)}</span>
                  <div style="display: flex; align-items: center;">
                    <div class="cart-item-qty">
                      <button class="cart-qty-btn" onclick="Store.updateQuantity('${item.key}', ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
                      <span class="cart-qty-val">${item.quantity}</span>
                      <button class="cart-qty-btn" onclick="Store.updateQuantity('${item.key}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="Store.removeFromCart('${item.key}')" title="Remove item" aria-label="Remove item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        ${upsellCandidates.length > 0 ? `
          <div class="drawer-upsell-section">
            <div class="drawer-upsell-title">Frequently Bought Together</div>
            ${upsellCandidates.map(u => `
              <div class="drawer-upsell-card">
                <img src="${u.primaryImage}" alt="${u.title}" />
                <div class="drawer-upsell-info">
                  <div class="drawer-upsell-name">${u.title}</div>
                  <div class="drawer-upsell-price">${Store.formatPrice(u.price)}</div>
                </div>
                <button class="btn-upsell-add" onclick="Store.addToCart('${u.id}', null, 1, false)">+ Add</button>
              </div>
            `).join('')}
          </div>
        ` : ''}
      `;
    }

    this.drawerEl.innerHTML = `
      <div class="cart-drawer-header">
        <div class="cart-drawer-title-wrap">
          <h3>Your Order List</h3>
          <span class="cart-count-pill">${count} item${count === 1 ? '' : 's'}</span>
        </div>
        <button class="cart-drawer-close" onclick="CartDrawer.close()" aria-label="Close cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      ${freeShippingHtml}

      <div class="cart-drawer-body">
        ${itemsHtml}
      </div>

      ${cart.length > 0 ? `
        <div class="cart-drawer-footer">
          <div class="drawer-subtotal-row">
            <span class="drawer-subtotal-label">Products subtotal</span>
            <span class="drawer-subtotal-amount">${Store.formatPrice(subtotal)}</span>
          </div>

          <div class="drawer-actions">
            <button type="button" class="btn btn-whatsapp-large btn-full btn-drawer-whatsapp" onclick="RPComponents.sendOrderListToWhatsApp()">
              <svg width="20" height="20" viewBox="5.4 5.4 13.2 13.7" fill="currentColor" aria-hidden="true">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.072-1.848-.431-1.393-.576-2.316-1.996-2.385-2.088-.069-.093-.564-.75-.564-1.433 0-.682.358-1.017.486-1.155.127-.138.278-.173.371-.173.093 0 .185.001.266.005.086.004.202-.033.315.241.118.286.405.987.44 1.058.035.07.058.152.012.244-.047.092-.07.15-.14.23-.07.081-.148.182-.211.245-.07.07-.143.146-.062.285.081.139.362.597.776.966.533.475.981.623 1.12.693.139.07.22.058.301-.035.082-.093.348-.405.441-.544.093-.139.186-.116.313-.07.127.046.808.381.947.451.139.07.232.104.266.162.035.058.035.337-.109.742z"/>
              </svg>
              <span>Send Order on WhatsApp &rarr;</span>
            </button>
            <div class="drawer-secondary-row">
              <a href="cart.html" class="drawer-secondary-btn" title="View Order List page">
                View Full List
              </a>
              <button type="button" class="drawer-secondary-btn" onclick="RPComponents.copyOrderListMessage()" title="Copy order list message to clipboard">
                📋 Copy Msg
              </button>
              <button type="button" class="drawer-secondary-btn" onclick="CartDrawer.close()" title="Close and keep browsing">
                Keep Browsing
              </button>
            </div>
          </div>

          <div class="drawer-micro-note">
            <span>Direct WhatsApp order &bull; We confirm delivery &amp; payment &bull; 📞 9150300641</span>
          </div>
        </div>
      ` : ''}
    `;
  },

  bindEvents() {
    this.overlayEl.addEventListener('click', () => this.close());

    const onCartUpdate = () => {
      if (this.drawerEl.classList.contains('active')) {
        this.render();
      }
    };
    window.addEventListener('rp:cart-updated', onCartUpdate);
    window.addEventListener('vr:cart-updated', onCartUpdate);

    document.querySelectorAll('.trigger-cart-drawer').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });
  }
};

// Global backward compatibility alias
window.VedaComponents = window.RPComponents;

// Global Newsletter Handler across all pages
function initGlobalNewsletter() {
  document.querySelectorAll('.newsletter-form-wrap, .footer-newsletter-form, form.newsletter-form').forEach(form => {
    if (form.dataset.boundNewsletter) return;
    form.dataset.boundNewsletter = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (!input || !input.value.trim() || !input.value.includes('@')) {
        if (window.Store && Store.showToast) Store.showToast('Please provide a valid email address.', 'error');
        return;
      }
      const email = input.value.trim();
      const sourcePage = document.title ? document.title.split('•')[0].trim() : 'Footer';
      try {
        if (submitBtn) submitBtn.disabled = true;
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source_page: sourcePage })
        });
        const data = await res.json();
        if (data.alreadySubscribed) {
          if (window.Store && Store.showToast) Store.showToast(data.message, 'info');
        } else if (data.success) {
          if (window.Store && Store.showToast) Store.showToast(data.message, 'success');
          input.value = '';
        } else {
          if (window.Store && Store.showToast) Store.showToast(data.message || 'Subscription failed.', 'error');
        }
      } catch (err) {
        console.error('Newsletter error:', err);
        if (window.Store && Store.showToast) Store.showToast('🎉 Thank you for subscribing to RP Organics!', 'success');
        input.value = '';
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  RPComponents.initCircularPreloader();
  RPComponents.initHeader();
  RPComponents.initSearch();
  RPComponents.initProductCardSwipe();
  CartDrawer.init();
  initGlobalNewsletter();
});

// Also initialize immediately if DOM ready
if (document.readyState !== 'loading') {
  RPComponents.initProductCardSwipe();
}
