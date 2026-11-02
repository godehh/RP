/**
 * AccordionGallery Component - Vanilla JS + GSAP Implementation
 * Inspired by React Bits (https://reactbits.dev)
 */

(function () {
  'use strict';

  class AccordionGallery {
    constructor(element, options = {}) {
      if (!element) return;
      this.el = element;

      // Extract options from data-attributes or parameters
      this.options = Object.assign(
        {
          defaultIndex: parseInt(this.el.dataset.defaultIndex, 10) || 0,
          expandRatio: parseFloat(this.el.dataset.expandRatio) || 0.52,
          duration: parseFloat(this.el.dataset.duration) || 0.6,
          ease: this.el.dataset.ease || 'power3.out',
          parallax: parseFloat(this.el.dataset.parallax) || 0.5,
          tilt: parseFloat(this.el.dataset.tilt) || 8,
          stagger: parseFloat(this.el.dataset.stagger) || 0.06,
          trigger: this.el.dataset.trigger || 'hover',
          showLabels: this.el.dataset.showLabels !== 'false',
          grayscale: this.el.dataset.grayscale !== 'false',
          gap: parseInt(this.el.dataset.gap, 10) || 12,
          orientation: this.el.dataset.orientation || 'horizontal',
          accentColor: this.el.dataset.accentColor || '#86efac',
          overlayColor: this.el.dataset.overlayColor || '#0a210f',
          textColor: this.el.dataset.textColor || '#ffffff'
        },
        options
      );

      this.panels = Array.from(this.el.querySelectorAll('.ag-panel'));
      this.count = this.panels.length;
      if (this.count === 0) return;

      this.active = Math.min(Math.max(this.options.defaultIndex, 0), this.count - 1);
      this.vertical = this.options.orientation === 'vertical';
      this.mediaSize = 320;
      this.tl = null;
      this.firstRun = true;

      this.init();
    }

    init() {
      // Set CSS Variables
      this.el.style.setProperty('--ag-accent', this.options.accentColor);
      this.el.style.setProperty('--ag-overlay', this.options.overlayColor);
      this.el.style.setProperty('--ag-text', this.options.textColor);
      this.el.style.setProperty('--ag-gap', `${this.options.gap}px`);

      // Bind events
      this.panels.forEach((panel, i) => {
        panel.setAttribute('role', 'listitem');
        panel.setAttribute('tabindex', '0');

        if (this.options.trigger === 'hover') {
          panel.addEventListener('mouseenter', () => this.setActive(i));
        }

        panel.addEventListener('click', (e) => {
          const href = panel.getAttribute('href');
          if (href) {
            const match = href.match(/id=([^&#]+)/);
            if (match && match[1]) {
              try {
                sessionStorage.setItem('rp_current_product_id', match[1]);
                localStorage.setItem('rp_current_product_id', match[1]);
              } catch (err) {}
            }
            // Navigate if panel is already active, or if user tapped the CTA / badge
            if (this.active === i || e.target.closest('.ag-panel__cta') || e.target.closest('.ag-panel__badge')) {
              window.location.href = href;
              return;
            }
            // Prevent instant navigation so panel expands with smooth animation on first tap
            e.preventDefault();
          }
          this.setActive(i);
        });

        panel.addEventListener('focus', () => this.setActive(i));

        panel.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.setActive((i + 1) % this.count);
            this.panels[(i + 1) % this.count]?.focus();
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            this.setActive((i - 1 + this.count) % this.count);
            this.panels[(i - 1 + this.count) % this.count]?.focus();
          }
        });
      });

      // Touch swipe support to switch product panels
      let agStartX = 0;
      let agStartY = 0;
      let agEndX = 0;
      let agEndY = 0;
      let agSwiping = false;

      this.el.addEventListener('touchstart', (e) => {
        if (!e.touches || !e.touches[0]) return;
        agStartX = e.touches[0].clientX;
        agStartY = e.touches[0].clientY;
        agEndX = agStartX;
        agEndY = agStartY;
        agSwiping = true;
      }, { passive: true });

      this.el.addEventListener('touchmove', (e) => {
        if (!agSwiping || !e.touches || !e.touches[0]) return;
        agEndX = e.touches[0].clientX;
        agEndY = e.touches[0].clientY;
      }, { passive: true });

      this.el.addEventListener('touchend', () => {
        if (!agSwiping) return;
        agSwiping = false;
        const dx = agStartX - agEndX;
        const dy = agStartY - agEndY;
        if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            this.setActive((this.active + 1) % this.count);
          } else {
            this.setActive((this.active - 1 + this.count) % this.count);
          }
        }
      }, { passive: true });

      // Responsive measure observer
      this.measure();
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.measure());
        this.resizeObserver.observe(this.el);
      } else {
        window.addEventListener('resize', () => this.measure());
      }

      this.applyLayout(false);
      this.firstRun = false;
    }

    measure() {
      const rect = this.el.getBoundingClientRect();
      const total = this.vertical ? rect.height : rect.width;
      if (total === 0) return;

      const usable = Math.max(total - this.options.gap * (this.count - 1), 120);
      const r = Math.min(Math.max(this.options.expandRatio, 0.2), 0.9);
      const size = Math.max(140, usable * r);

      this.mediaSize = size;
      this.el.style.setProperty('--ag-media-size', `${size}px`);

      if (!this.firstRun) {
        this.applyLayout(true);
      }
    }

    setActive(index) {
      if (index === this.active && !this.firstRun) return;
      this.active = index;
      this.applyLayout(true);
    }

    applyLayout(animate = true) {
      const gsap = window.gsap;
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const dur = animate && !prefersReduced && gsap ? this.options.duration : 0;

      const r = Math.min(Math.max(this.options.expandRatio, 0.2), 0.9);
      const grow = this.count > 1 ? (r * (this.count - 1)) / (1 - r) : 1;

      if (this.tl) {
        this.tl.kill();
      }

      if (gsap) {
        const tl = gsap.timeline();

        this.panels.forEach((panel, i) => {
          const isActive = i === this.active;
          const media = panel.querySelector('.ag-panel__media');
          const bar = panel.querySelector('.ag-panel__bar');
          const text = panel.querySelector('.ag-panel__text');

          panel.classList.toggle('ag-panel--active', isActive);
          panel.setAttribute('aria-current', isActive ? 'true' : 'false');

          const isMobile = window.innerWidth <= 768;
          const rot = (isActive || isMobile) ? 0 : i < this.active ? this.options.tilt : -this.options.tilt;
          const rotProp = isMobile ? { rotateX: 0, rotateY: 0 } : this.vertical ? { rotateX: -rot } : { rotateY: rot };

          tl.to(
            panel,
            {
              flexGrow: isActive ? grow : 1,
              ...rotProp,
              duration: dur,
              ease: this.options.ease
            },
            0
          );

          if (media) {
            const drift = Math.max(-1.5, Math.min(1.5, this.active - i));
            const shift = drift * this.options.parallax * this.mediaSize * 0.06;
            const gray = this.options.grayscale ? (isActive ? 0 : 1) : 0;

            tl.to(
              media,
              {
                xPercent: -50,
                yPercent: -50,
                x: this.vertical ? 0 : isActive ? 0 : shift,
                y: this.vertical ? (isActive ? 0 : shift) : 0,
                '--ag-gray': gray,
                '--ag-dim': isActive ? 0 : 0.4,
                duration: dur,
                ease: this.options.ease
              },
              0
            );
          }

          if (this.options.showLabels && bar && text) {
            if (isActive) {
              tl.to(
                [bar, text],
                {
                  opacity: 1,
                  x: 0,
                  duration: dur,
                  ease: this.options.ease,
                  stagger: prefersReduced ? 0 : this.options.stagger
                },
                0
              );
            } else {
              tl.to(
                [bar, text],
                {
                  opacity: 0,
                  x: -14,
                  duration: dur * 0.6,
                  ease: this.options.ease
                },
                0
              );
            }
          }
        });

        this.tl = tl;
      } else {
        // Graceful CSS Fallback if GSAP is unavailable
        this.panels.forEach((panel, i) => {
          const isActive = i === this.active;
          panel.classList.toggle('ag-panel--active', isActive);
          panel.style.flexGrow = isActive ? grow : 1;
          const media = panel.querySelector('.ag-panel__media');
          if (media) {
            media.style.filter = isActive ? 'grayscale(0)' : 'grayscale(1)';
          }
          const bar = panel.querySelector('.ag-panel__bar');
          const text = panel.querySelector('.ag-panel__text');
          if (bar) bar.style.opacity = isActive ? '1' : '0';
          if (text) text.style.opacity = isActive ? '1' : '0';
        });
      }
    }

    destroy() {
      if (this.tl) this.tl.kill();
      if (this.resizeObserver) this.resizeObserver.disconnect();
    }
  }

  // Global Auto-Init
  function autoInit() {
    document.querySelectorAll('[data-accordion-gallery], .accordion-gallery').forEach((el) => {
      if (!el._accordionGalleryInstance) {
        el._accordionGalleryInstance = new AccordionGallery(el);
      }
    });
  }

  window.AccordionGallery = AccordionGallery;
  window.AccordionGallery.autoInit = autoInit;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();
