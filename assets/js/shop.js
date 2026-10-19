/**
 * RP Organics - Shop / Collection Page Controller
 * Powers Multi-criteria filtering, Sort dropdown, Active chips, and Grid/List toggle.
 */

document.addEventListener('DOMContentLoaded', () => {
  const shopGrid = document.getElementById('shop-products-grid');
  if (!shopGrid) return; // Only run on shop page

  // Parse URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('category');
  const initialGoal = urlParams.get('goal');
  const initialSearch = urlParams.get('search');

  // Filter State
  const filterState = {
    category: initialCategory ? [initialCategory] : [],
    minPrice: 0,
    maxPrice: 3500,
    productTypes: [],
    dietary: [],
    inStockOnly: false,
    minRating: 0,
    wellnessGoal: initialGoal || null,
    searchQuery: initialSearch || '',
    sort: 'featured',
    viewMode: 'grid',
    page: 1,
    perPage: 12
  };

  // Populate Categories in Sidebar
  const catFilterContainer = document.getElementById('filter-categories-list');
  if (catFilterContainer && typeof CATEGORIES !== 'undefined') {
    catFilterContainer.innerHTML = CATEGORIES.map(cat => {
      const isChecked = filterState.category.includes(cat.slug);
      return `
        <label class="filter-checkbox-label">
          <input type="checkbox" name="cat" value="${cat.slug}" ${isChecked ? 'checked' : ''} />
          <span>${cat.name}</span>
          <span class="filter-count">(${cat.itemCount})</span>
        </label>
      `;
    }).join('');
  }

  // Update Page Title if category or goal set
  if (initialCategory) {
    const matchedCat = CATEGORIES.find(c => c.slug === initialCategory);
    if (matchedCat) {
      const pageTitle = document.getElementById('shop-page-title');
      const pageDesc = document.getElementById('shop-page-desc');
      const breadcrumbCat = document.getElementById('shop-breadcrumb-category');
      if (pageTitle) pageTitle.textContent = matchedCat.name;
      if (pageDesc) pageDesc.textContent = matchedCat.description;
      if (breadcrumbCat) breadcrumbCat.textContent = matchedCat.name;
    }
  } else if (initialGoal) {
    const matchedGoal = WELLNESS_GOALS.find(g => g.id === initialGoal);
    if (matchedGoal) {
      const pageTitle = document.getElementById('shop-page-title');
      const pageDesc = document.getElementById('shop-page-desc');
      if (pageTitle) pageTitle.textContent = `Products for ${matchedGoal.title}`;
      if (pageDesc) pageDesc.textContent = matchedGoal.desc;
    }
  }

  // Apply Filters & Sorting
  const applyFiltersAndRender = () => {
    let results = [...PRODUCTS];

    // Search query
    if (filterState.searchQuery) {
      const q = filterState.searchQuery.toLowerCase().trim();
      results = results.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filterState.category.length > 0) {
      results = results.filter(p => 
        filterState.category.includes(p.categorySlug) ||
        (filterState.category.includes('protein') && (p.id === 'pro-01' || (p.tags && p.tags.includes('Protein')))) ||
        (filterState.category.includes('health-mixes') && (p.id === 'pro-01' || p.id === 'mil-powder-01')) ||
        (filterState.category.includes('millets') && p.id === 'mil-powder-01')
      );
    }

    // Wellness Goal filter
    if (filterState.wellnessGoal) {
      results = results.filter(p => 
        p.wellnessGoals.some(g => g.toLowerCase().includes(filterState.wellnessGoal.toLowerCase()))
      );
    }

    // Price range
    results = results.filter(p => p.price >= filterState.minPrice && p.price <= filterState.maxPrice);

    // Product Type
    if (filterState.productTypes.length > 0) {
      results = results.filter(p => filterState.productTypes.includes(p.productType));
    }

    // Dietary
    if (filterState.dietary.length > 0) {
      results = results.filter(p => 
        filterState.dietary.every(d => p.dietary.includes(d))
      );
    }

    // In Stock Only
    if (filterState.inStockOnly) {
      results = results.filter(p => p.inStock);
    }

    // Rating
    if (filterState.minRating > 0) {
      results = results.filter(p => p.rating >= filterState.minRating);
    }

    // Sorting
    switch (filterState.sort) {
      case 'price-low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        results.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        results.sort((a, b) => b.id.localeCompare(a.id));
        break;
      default: // Featured
        break;
    }

    // Update Result Counter
    const countEl = document.getElementById('shop-results-count');
    if (countEl) {
      countEl.textContent = `Showing ${results.length} of ${PRODUCTS.length} organic products`;
    }

    // Render Active Filter Chips
    renderFilterChips();

    // Render Grid / Empty State
    if (results.length === 0) {
      shopGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background-color: var(--color-surface); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">
          <div style="width: 64px; height: 64px; border-radius: 50%; background-color: var(--color-primary-soft); color: var(--color-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <h3 style="margin-bottom: 8px;">No matching products found</h3>
          <p style="color: var(--color-text-muted); margin-bottom: 20px;">Try adjusting your selected filters, clearing search criteria, or expanding your price range.</p>
          <button class="btn btn-outline" id="reset-all-filters-btn">Clear All Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-all-filters-btn');
      if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
    } else {
      shopGrid.className = `products-grid ${filterState.viewMode === 'list' ? 'list-view' : ''}`;
      shopGrid.innerHTML = results.map(prod => (window.RPComponents || window.VedaComponents).renderProductCard(prod)).join('');
    }
  };

  // Render Active Filter Chips
  const renderFilterChips = () => {
    const chipsContainer = document.getElementById('active-filters-chips');
    if (!chipsContainer) return;

    const chips = [];

    filterState.category.forEach(catSlug => {
      const c = CATEGORIES.find(x => x.slug === catSlug);
      chips.push({ label: `Category: ${c ? c.name : catSlug}`, onRemove: () => removeCategoryFilter(catSlug) });
    });

    if (filterState.wellnessGoal) {
      chips.push({ label: `Goal: ${filterState.wellnessGoal}`, onRemove: () => { filterState.wellnessGoal = null; applyFiltersAndRender(); } });
    }

    if (filterState.maxPrice < 3500 || filterState.minPrice > 0) {
      chips.push({ label: `Price: ₹${filterState.minPrice} - ₹${filterState.maxPrice}`, onRemove: () => {
        filterState.minPrice = 0;
        filterState.maxPrice = 3500;
        const maxInput = document.getElementById('price-max');
        const minInput = document.getElementById('price-min');
        if (maxInput) maxInput.value = 3500;
        if (minInput) minInput.value = 0;
        applyFiltersAndRender();
      }});
    }

    filterState.productTypes.forEach(pt => {
      chips.push({ label: `Type: ${pt}`, onRemove: () => removeTypeFilter(pt) });
    });

    filterState.dietary.forEach(dt => {
      chips.push({ label: `Diet: ${dt}`, onRemove: () => removeDietaryFilter(dt) });
    });

    if (filterState.inStockOnly) {
      chips.push({ label: `In Stock Only`, onRemove: () => {
        filterState.inStockOnly = false;
        const cb = document.getElementById('filter-in-stock');
        if (cb) cb.checked = false;
        applyFiltersAndRender();
      }});
    }

    if (chips.length === 0) {
      chipsContainer.innerHTML = '';
      chipsContainer.style.display = 'none';
      return;
    }

    chipsContainer.style.display = 'flex';
    chipsContainer.innerHTML = `
      ${chips.map((chip, idx) => `
        <span class="filter-chip">
          ${chip.label}
          <button data-chip-idx="${idx}" aria-label="Remove filter">&times;</button>
        </span>
      `).join('')}
      <button class="btn btn-sm btn-outline" id="clear-chips-btn" style="padding: 2px 10px; font-size: 0.76rem;">Clear All</button>
    `;

    chips.forEach((chip, idx) => {
      const btn = chipsContainer.querySelector(`[data-chip-idx="${idx}"]`);
      if (btn) btn.addEventListener('click', chip.onRemove);
    });

    const clearAllBtn = document.getElementById('clear-chips-btn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', resetAllFilters);
  };

  const removeCategoryFilter = (slug) => {
    filterState.category = filterState.category.filter(c => c !== slug);
    const cb = document.querySelector(`input[name="cat"][value="${slug}"]`);
    if (cb) cb.checked = false;
    applyFiltersAndRender();
  };

  const removeTypeFilter = (pt) => {
    filterState.productTypes = filterState.productTypes.filter(t => t !== pt);
    const cb = document.querySelector(`input[name="ptype"][value="${pt}"]`);
    if (cb) cb.checked = false;
    applyFiltersAndRender();
  };

  const removeDietaryFilter = (dt) => {
    filterState.dietary = filterState.dietary.filter(d => d !== dt);
    const cb = document.querySelector(`input[name="dietary"][value="${dt}"]`);
    if (cb) cb.checked = false;
    applyFiltersAndRender();
  };

  const resetAllFilters = () => {
    filterState.category = [];
    filterState.minPrice = 0;
    filterState.maxPrice = 3500;
    filterState.productTypes = [];
    filterState.dietary = [];
    filterState.inStockOnly = false;
    filterState.minRating = 0;
    filterState.wellnessGoal = null;
    filterState.searchQuery = '';

    document.querySelectorAll('.shop-sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
    const maxInput = document.getElementById('price-max');
    const minInput = document.getElementById('price-min');
    if (maxInput) maxInput.value = 3500;
    if (minInput) minInput.value = 0;

    applyFiltersAndRender();
  };

  // Event Listeners for Filters
  document.addEventListener('change', (e) => {
    if (e.target.name === 'cat') {
      const checkedCats = Array.from(document.querySelectorAll('input[name="cat"]:checked')).map(cb => cb.value);
      filterState.category = checkedCats;
      applyFiltersAndRender();
    } else if (e.target.name === 'ptype') {
      const checkedTypes = Array.from(document.querySelectorAll('input[name="ptype"]:checked')).map(cb => cb.value);
      filterState.productTypes = checkedTypes;
      applyFiltersAndRender();
    } else if (e.target.name === 'dietary') {
      const checkedDiet = Array.from(document.querySelectorAll('input[name="dietary"]:checked')).map(cb => cb.value);
      filterState.dietary = checkedDiet;
      applyFiltersAndRender();
    } else if (e.target.id === 'filter-in-stock') {
      filterState.inStockOnly = e.target.checked;
      applyFiltersAndRender();
    }
  });

  // Price Slider / Inputs
  const minPriceInput = document.getElementById('price-min');
  const maxPriceInput = document.getElementById('price-max');
  if (minPriceInput && maxPriceInput) {
    const onPriceChange = () => {
      filterState.minPrice = parseInt(minPriceInput.value, 10) || 0;
      filterState.maxPrice = parseInt(maxPriceInput.value, 10) || 3500;
      applyFiltersAndRender();
    };
    minPriceInput.addEventListener('change', onPriceChange);
    maxPriceInput.addEventListener('change', onPriceChange);
  }

  // Sort Dropdown
  const sortSelect = document.getElementById('shop-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      filterState.sort = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Grid / List View Toggle
  const viewGridBtn = document.getElementById('view-grid-btn');
  const viewListBtn = document.getElementById('view-list-btn');
  if (viewGridBtn && viewListBtn) {
    viewGridBtn.addEventListener('click', () => {
      filterState.viewMode = 'grid';
      viewGridBtn.classList.add('active');
      viewListBtn.classList.remove('active');
      applyFiltersAndRender();
    });
    viewListBtn.addEventListener('click', () => {
      filterState.viewMode = 'list';
      viewListBtn.classList.add('active');
      viewGridBtn.classList.remove('active');
      applyFiltersAndRender();
    });
  }

  // Initial Run
  applyFiltersAndRender();
});
