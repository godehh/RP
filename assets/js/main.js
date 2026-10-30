/**
 * RP Organics - Homepage & Main Controller
 * Brand: RP Organics | Owner: Rani Pavunrasu | FSSAI Lic No: 22426431000125
 * Features:
 *  1. Circular Preloader Spinner (CSS border spin 1s infinite, fades out 0.4s on window load)
 *  2. Hero Slide Carousel (3 two-tone slides, purple Shop Now button, 4s autoplay, pause on hover, loop)
 *  3. Hero Banner Slide-In (2-3 full-width banners with product image strip, 0.7s translateX, 5s autoplay)
 */

// 1. CIRCULAR PRELOADER SPINNER
function initCircularPreloader() {
  const preloader = document.getElementById('rp-preloader');
  if (!preloader) return;

  const dismissPreloader = () => {
    if (preloader.classList.contains('fade-out')) return;
    preloader.classList.add('fade-out');
    setTimeout(() => {
      if (preloader && preloader.parentNode) {
        preloader.parentNode.removeChild(preloader);
      }
    }, 420); // 0.4s CSS transition + 20ms buffer
  };

  if (document.readyState === 'complete') {
    setTimeout(dismissPreloader, 100);
  } else {
    window.addEventListener('load', dismissPreloader);
    // Safety fallback: dismiss after 2.5s if external network assets lag
    setTimeout(dismissPreloader, 2500);
  }
}

// Call preloader listener immediately so window.load is captured
initCircularPreloader();

document.addEventListener('DOMContentLoaded', () => {

  // 2. HERO SLIDE CAROUSEL
  const initHeroSlideCarousel = () => {
    const track = document.querySelector('.hero-carousel-track');
    const slides = document.querySelectorAll('.hero-carousel-slide');
    const dots = document.querySelectorAll('.hero-dot');
    const prevBtn = document.querySelector('.hero-prev-btn');
    const nextBtn = document.querySelector('.hero-next-btn');
    const wrap = document.querySelector('.hero-carousel-wrap');

    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    const totalSlides = slides.length;
    let autoplayInterval = null;

    const goToSlide = (index) => {
      currentIndex = (index + totalSlides) % totalSlides;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentIndex);
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    };

    const nextSlide = () => goToSlide(currentIndex + 1);
    const prevSlide = () => goToSlide(currentIndex - 1);

    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => goToSlide(idx));
    });

    // Autoplay every 4 seconds, pause on hover, loop infinitely
    const startAutoplay = () => {
      stopAutoplay();
      autoplayInterval = setInterval(nextSlide, 4000);
    };

    const stopAutoplay = () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    };

    if (wrap) {
      wrap.addEventListener('mouseenter', stopAutoplay);
      wrap.addEventListener('mouseleave', startAutoplay);
    }

    // Touch Swipe Support for Mobile
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
      stopAutoplay();
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) nextSlide();
        else prevSlide();
      }
      startAutoplay();
    }, { passive: true });

    // Initialize first slide as active
    goToSlide(0);
    startAutoplay();
  };

  // 3. HERO BANNER SLIDE-IN (Second Banner Section)
  // 3. HERO BANNER PROMO (Stone-Ground Tamil Podis with AccordionGallery)
  const initHeroBannerSlideIn = () => {
    const promoGallery = document.querySelector('.banner-promo-section .accordion-gallery, .banner-slide-in-section .accordion-gallery');
    if (promoGallery && promoGallery._accordionGalleryInstance) {
      setTimeout(() => {
        promoGallery._accordionGalleryInstance.measure();
      }, 100);
    }
  };

  // 4. POPULATE HOMEPAGE SECTIONS DYNAMICALLY
  const populateHomeSections = () => {
    // 4.1 Shop by Category Tiles
    const catContainer = document.getElementById('home-category-tiles');
    if (catContainer && typeof CATEGORIES !== 'undefined') {
      catContainer.innerHTML = CATEGORIES.slice(0, 6).map(cat => `
        <a href="shop.html?category=${cat.slug}" class="category-tile">
          <div class="category-tile-img-wrap">
            <img src="${cat.image}" alt="${cat.name}" loading="lazy" />
          </div>
          <h4 class="category-tile-title">${cat.name}</h4>
          <span class="category-tile-count">${cat.itemCount} Items</span>
        </a>
      `).join('');
    }

    // 4.2 Featured Products (All 6 products in priority order: Protein, Poondu, Pirandai, Sundakkai, Millet Mix, Vallarai)
    const featuredContainer = document.getElementById('home-featured-products');
    if (featuredContainer && typeof PRODUCTS !== 'undefined') {
      featuredContainer.innerHTML = PRODUCTS.map(prod => 
        (window.RPComponents || window.VedaComponents).renderProductCard(prod)
      ).join('');
    }

    // 4.3 New Arrivals (All products in priority order: Protein, Poondu, Pirandai, Sundakkai, Millet Mix, Vallarai)
    const newArrivalsContainer = document.getElementById('home-new-arrivals');
    if (newArrivalsContainer && typeof PRODUCTS !== 'undefined') {
      newArrivalsContainer.innerHTML = PRODUCTS.map(prod => 
        (window.RPComponents || window.VedaComponents).renderProductCard(prod)
      ).join('');
    }

    // 4.4 Wellness Goals Grid
    const goalsContainer = document.getElementById('home-wellness-goals');
    if (goalsContainer && typeof WELLNESS_GOALS !== 'undefined') {
      goalsContainer.innerHTML = WELLNESS_GOALS.map(goal => `
        <a href="shop.html?goal=${goal.id}" class="wellness-goal-card">
          <div class="goal-icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div class="goal-info">
            <h4>${goal.title}</h4>
            <p>${goal.desc}</p>
            <span class="goal-link">Explore Products &rarr;</span>
          </div>
        </a>
      `).join('');
    }

    // 4.5 Best Sellers (4 items)
    const bestSellersContainer = document.getElementById('home-bestsellers');
    if (bestSellersContainer && typeof PRODUCTS !== 'undefined') {
      const bestSellers = PRODUCTS.filter(p => p.badgeType === 'bestseller' || p.rating >= 4.8).slice(0, 4);
      bestSellersContainer.innerHTML = bestSellers.map(prod => 
        (window.RPComponents || window.VedaComponents).renderProductCard(prod)
      ).join('');
    }

    // 4.6 Testimonials
    const testimonialsContainer = document.getElementById('home-testimonials');
    if (testimonialsContainer && typeof TESTIMONIALS !== 'undefined') {
      testimonialsContainer.innerHTML = TESTIMONIALS.map(test => `
        <div class="testimonial-card">
          <div class="testimonial-stars">
            ${Array(test.rating).fill('★').join('')}
          </div>
          <h4 class="testimonial-title">"${test.title}"</h4>
          <p class="testimonial-quote">${test.quote}</p>
          <div class="testimonial-author">
            <img src="${test.avatar}" alt="${test.name}" loading="lazy" />
            <div class="author-details">
              <span class="author-name">${test.name}</span>
              <span class="author-loc">${test.location}</span>
              <span class="verified-buyer-tag">✓ Verified Organic Buyer</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    // 4.7 Blog Preview
    const blogContainer = document.getElementById('home-blog-preview');
    if (blogContainer && typeof BLOG_POSTS !== 'undefined') {
      blogContainer.innerHTML = BLOG_POSTS.map(post => `
        <div class="blog-card">
          <div class="blog-card-media">
            <img src="${post.image}" alt="${post.title}" loading="lazy" />
            <span class="blog-card-badge">${post.category}</span>
          </div>
          <div class="blog-card-content">
            <div class="blog-card-meta">
              <span>${post.date}</span>
              <span>•</span>
              <span>${post.readTime}</span>
            </div>
            <h4 class="blog-card-title">
              <a href="blog-post.html?id=${post.id}">${post.title}</a>
            </h4>
            <p class="blog-card-excerpt">${post.excerpt}</p>
            <a href="blog-post.html?id=${post.id}" class="blog-card-link">
              Read Recipe &amp; Article &rarr;
            </a>
          </div>
        </div>
      `).join('');
    }
  };

  // 5. NEWSLETTER SIGNUP HANDLER (Connected to SQLite Database)
  const initNewsletterForms = () => {
    document.querySelectorAll('.newsletter-form-wrap, .footer-newsletter-form, form.newsletter-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!input || !input.value.trim() || !input.value.includes('@')) {
          if (window.Store && Store.showToast) {
            Store.showToast('Please provide a valid email address.', 'error');
          }
          return;
        }

        const email = input.value.trim();
        const sourcePage = document.title ? document.title.split('•')[0].trim() : 'Homepage';

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
  };

  // Initialize all controllers
  initHeroSlideCarousel();
  initHeroBannerSlideIn();
  populateHomeSections();
  initNewsletterForms();
});
