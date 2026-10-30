/**
 * RP Organics - WhatsApp Ordering System
 * Official WhatsApp Number: +91 9150300641
 * Direct link: https://wa.me/919150300641
 * Brand: RP Organics | Owner: Rani Pavunrasu
 */

(function(window) {
  'use strict';

  const RP_WHATSAPP_CONFIG = {
    phone: '919150300641',
    displayPhone: '+91 9150300641',
    brandName: 'RP Organics',
    owner: 'Rani Pavunrasu',
    email: 'benseethalrani@gmail.com',
    fssai: '22426431000125'
  };

  const RPWhatsApp = {
    config: RP_WHATSAPP_CONFIG,

    /**
     * Builds standard single-product WhatsApp order message
     * @param {Object} product - Product object
     * @param {Object|string} variant - Selected variant object or variant name string
     * @param {number} quantity - Quantity chosen
     * @returns {string} Formatted plain text message
     */
    buildSingleProductMessage(product, variant, quantity) {
      const prodName = product.name || product.title || 'Organic Product';
      
      let packSize = 'Standard';
      let unitPrice = product.price || 0;

      if (variant) {
        if (typeof variant === 'object') {
          packSize = variant.name || variant.title || 'Standard';
          unitPrice = (variant.price !== undefined) ? variant.price : (product.price || 0);
        } else if (typeof variant === 'string') {
          packSize = variant;
          if (product.variants && product.variants.length > 0) {
            const found = product.variants.find(v => v.name === variant);
            if (found && found.price !== undefined) {
              unitPrice = found.price;
            }
          }
        }
      } else if (product.variants && product.variants.length > 0) {
        packSize = product.variants[0].name;
        unitPrice = product.variants[0].price;
      }

      const qty = parseInt(quantity, 10) || 1;
      const itemTotal = unitPrice * qty;

      return `Hello RP Organics! I would like to order:

Product: ${prodName}
Pack size: ${packSize}
Quantity: ${qty}
Price per pack: ₹${unitPrice}
Item total: ₹${itemTotal}

Please confirm availability, delivery charges, payment details, and how to complete my order.`;
    },

    /**
     * Builds standard multiple-product WhatsApp order message from Order List items
     * @param {Array} items - Array of order list item objects
     * @param {number} subtotal - Merchandise subtotal
     * @returns {string} Formatted plain text message
     */
    buildMultiProductMessage(items, subtotal) {
      if (!items || items.length === 0) return '';

      const lines = items.map((item, index) => {
        const num = index + 1;
        const title = item.title || item.name || 'Organic Product';
        const packSize = item.variant || item.variantName || 'Standard';
        const qty = parseInt(item.quantity, 10) || 1;
        const unitPrice = parseFloat(item.price) || 0;
        const itemTotal = unitPrice * qty;

        return `${num}. ${title}
   Pack size: ${packSize}
   Quantity: ${qty}
   Price per pack: ₹${unitPrice}
   Item total: ₹${itemTotal}`;
      });

      const calculatedSubtotal = (subtotal !== undefined && subtotal !== null)
        ? subtotal
        : items.reduce((sum, it) => sum + ((parseFloat(it.price) || 0) * (parseInt(it.quantity, 10) || 1)), 0);

      return `Hello RP Organics! I would like to order:

${lines.join('\n\n')}

Products subtotal: ₹${calculatedSubtotal}

Please confirm availability, delivery charges, payment details, and the final amount. I will share my delivery address here on WhatsApp.`;
    },

    /**
     * Generate full wa.me direct link with properly encoded message
     * @param {string} messageText - Unencoded raw message
     * @returns {string} Fully encoded WhatsApp URL
     */
    generateWhatsAppUrl(messageText) {
      return `https://wa.me/${this.config.phone}?text=${encodeURIComponent(messageText)}`;
    },

    /**
     * Open WhatsApp in a new browser tab/window without leaving the website
     * @param {string} messageText - The message to prefill
     */
    openWhatsApp(messageText) {
      const url = this.generateWhatsAppUrl(messageText);
      const newWin = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        // Pop-up blocker fallback: direct window location assignment
        window.location.href = url;
      }
    },

    /**
     * Fallback utility to copy the order message to clipboard
     * @param {string} messageText - The message to copy
     * @returns {Promise<boolean>} Success indicator
     */
    async copyMessage(messageText) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(messageText);
          return true;
        }
        const textArea = document.createElement('textarea');
        textArea.value = messageText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        console.warn('Clipboard copy error:', err);
        return false;
      }
    }
  };

  window.RP_WHATSAPP_CONFIG = RP_WHATSAPP_CONFIG;
  window.RPWhatsApp = RPWhatsApp;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RP_WHATSAPP_CONFIG, RPWhatsApp };
  }
})(typeof window !== 'undefined' ? window : global);
