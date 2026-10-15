/**
 * RP Organics - Store & Cart State Engine
 * Robust local-storage backed reactive commerce store.
 */

const Store = {
  FREE_SHIPPING_THRESHOLD: 999, // ₹999 for free shipping
  CURRENCY_RATE: {
    INR: { symbol: '₹', rate: 1 },
    USD: { symbol: '$', rate: 0.012 }
  },

  state: {
    cart: [],
    wishlist: [],
    recentlyViewed: [],
    currency: 'INR'
  },

  init() {
    this.loadState();
    this.bindEvents();
    this.emitCartUpdate();
    this.emitWishlistUpdate();
  },

  loadState() {
    try {
      const storedCart = localStorage.getItem('vr_cart');
      if (storedCart) this.state.cart = JSON.parse(storedCart);

      const storedWishlist = localStorage.getItem('vr_wishlist');
      if (storedWishlist) this.state.wishlist = JSON.parse(storedWishlist);

      const storedRecent = localStorage.getItem('vr_recently_viewed');
      if (storedRecent) this.state.recentlyViewed = JSON.parse(storedRecent);

      const storedCurrency = localStorage.getItem('vr_currency');
      if (storedCurrency && this.CURRENCY_RATE[storedCurrency]) {
        this.state.currency = storedCurrency;
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  },

  saveCart() {
    try {
      localStorage.setItem('vr_cart', JSON.stringify(this.state.cart));
    } catch (e) {
      console.warn('Could not save cart:', e);
    }
    this.emitCartUpdate();
  },

  saveWishlist() {
    try {
      localStorage.setItem('vr_wishlist', JSON.stringify(this.state.wishlist));
    } catch (e) {
      console.warn('Could not save wishlist:', e);
    }
    this.emitWishlistUpdate();
  },

  saveRecentlyViewed() {
    try {
      localStorage.setItem('vr_recently_viewed', JSON.stringify(this.state.recentlyViewed));
    } catch (e) {
      console.warn('Could not save recently viewed:', e);
    }
  },

  // Cart Operations
  addToCart(productId, variantName = null, quantity = 1, showDrawer = true) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    let selectedVariant = null;
    let unitPrice = product.price;
    let comparePrice = product.compareAtPrice;

    if (product.variants && product.variants.length > 0) {
      if (variantName) {
        selectedVariant = product.variants.find(v => v.name === variantName) || product.variants[0];
      } else {
        selectedVariant = product.variants[0];
      }
      unitPrice = selectedVariant.price;
      comparePrice = selectedVariant.compareAtPrice;
    }

    const itemKey = `${productId}_${selectedVariant ? selectedVariant.name : 'default'}`;
    const existingIndex = this.state.cart.findIndex(item => item.key === itemKey);

    if (existingIndex > -1) {
      this.state.cart[existingIndex].quantity += quantity;
    } else {
      this.state.cart.push({
        key: itemKey,
        productId: product.id,
        slug: product.slug,
        title: product.title,
        category: product.category,
        image: product.primaryImage,
        variant: selectedVariant ? selectedVariant.name : 'Standard',
        price: unitPrice,
        compareAtPrice: comparePrice,
        quantity: quantity
      });
    }

    this.saveCart();
    this.showToast(`Added ${product.title} to cart!`, 'success');

    if (showDrawer && window.CartDrawer) {
      window.CartDrawer.open();
    }
  },

  updateQuantity(key, newQty) {
    const index = this.state.cart.findIndex(i => i.key === key);
    if (index === -1) return;

    if (newQty <= 0) {
      this.removeFromCart(key);
      return;
    }

    this.state.cart[index].quantity = newQty;
    this.saveCart();
  },

  removeFromCart(key) {
    const item = this.state.cart.find(i => i.key === key);
    this.state.cart = this.state.cart.filter(i => i.key !== key);
    this.saveCart();
    if (item) {
      this.showToast(`Removed from cart`, 'info');
    }
  },

  clearCart() {
    this.state.cart = [];
    this.saveCart();
  },

  getCartSubtotal() {
    return this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getCartCount() {
    return this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  getFreeShippingProgress() {
    const subtotal = this.getCartSubtotal();
    const needed = Math.max(0, this.FREE_SHIPPING_THRESHOLD - subtotal);
    const percent = Math.min(100, Math.round((subtotal / this.FREE_SHIPPING_THRESHOLD) * 100));
    return {
      threshold: this.FREE_SHIPPING_THRESHOLD,
      current: subtotal,
      needed,
      percent,
      isFree: subtotal >= this.FREE_SHIPPING_THRESHOLD
    };
  },

  // Wishlist Operations
  toggleWishlist(productId) {
    const index = this.state.wishlist.indexOf(productId);
    const product = PRODUCTS.find(p => p.id === productId);
    const title = product ? product.title : 'Item';

    if (index > -1) {
      this.state.wishlist.splice(index, 1);
      this.saveWishlist();
      this.showToast(`Removed ${title} from wishlist`, 'info');
      return false;
    } else {
      this.state.wishlist.push(productId);
      this.saveWishlist();
      this.showToast(`Added ${title} to wishlist!`, 'success');
      return true;
    }
  },

  isInWishlist(productId) {
    return this.state.wishlist.includes(productId);
  },

  getWishlistCount() {
    return this.state.wishlist.length;
  },

  // Recently Viewed
  trackRecentlyViewed(productId) {
    if (!productId) return;
    this.state.recentlyViewed = this.state.recentlyViewed.filter(id => id !== productId);
    this.state.recentlyViewed.unshift(productId);
    if (this.state.recentlyViewed.length > 8) {
      this.state.recentlyViewed.pop();
    }
    this.saveRecentlyViewed();
  },

  // Formatting & Currencies
  setCurrency(curr) {
    if (this.CURRENCY_RATE[curr]) {
      this.state.currency = curr;
      localStorage.setItem('vr_currency', curr);
      window.dispatchEvent(new CustomEvent('vr:currency-updated', { detail: curr }));
      this.emitCartUpdate();
    }
  },

  formatPrice(inrAmount) {
    const curr = this.CURRENCY_RATE[this.state.currency] || this.CURRENCY_RATE.INR;
    const converted = inrAmount * curr.rate;
    if (this.state.currency === 'USD') {
      return `$${converted.toFixed(2)}`;
    }
    return `₹${Math.round(converted).toLocaleString('en-IN')}`;
  },

  // Events & Notifications
  emitCartUpdate() {
    window.dispatchEvent(new CustomEvent('vr:cart-updated', {
      detail: {
        cart: this.state.cart,
        count: this.getCartCount(),
        subtotal: this.getCartSubtotal(),
        freeShipping: this.getFreeShippingProgress()
      }
    }));
  },

  emitWishlistUpdate() {
    window.dispatchEvent(new CustomEvent('vr:wishlist-updated', {
      detail: {
        wishlist: this.state.wishlist,
        count: this.getWishlistCount()
      }
    }));
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('vr-toast-container') || this.createToastContainer();
    const toast = document.createElement('div');
    toast.className = `vr-toast vr-toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      <div class="vr-toast-icon">${iconSvg}</div>
      <div class="vr-toast-text">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  createToastContainer() {
    let el = document.getElementById('vr-toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'vr-toast-container';
      el.className = 'vr-toast-container';
      document.body.appendChild(el);
    }
    return el;
  },

  bindEvents() {
    window.addEventListener('DOMContentLoaded', () => {
      this.createToastContainer();
    });
  }
};

// Initialize Store
Store.init();

if (typeof window !== 'undefined') {
  window.Store = Store;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Store;
}

