import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useI18n } from '../i18n/I18nContext';
import { useDocumentTitle } from '../utils/siteText';
import ProductCard from '../components/ProductCard';
import './Products.css';

const PAGE_SIZE = 12;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, loading, error, pagination, fetchProducts } = useProducts();
  const { t } = useI18n();

  // The URL is the single source of truth for filters, search and page. That way the
  // header search box, footer category links and Back/Forward all just work (filters used
  // to be copied into state once on mount and ignored later URL changes).
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const currentPage = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);

  const pageTitle = search ? t('products.resultsFor', { query: search }) : t('products.title');
  useDocumentTitle(pageTitle);

  // The URL may hold a category id or a slug; match either so the radio stays in sync.
  const activeCategoryId = categories.find(c => c._id === category || c.slug === category)?._id || category;

  const updateParams = useCallback((changes, { keepPage = false, replace = false } = {}) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      if (!keepPage) next.delete('page');
      return next;
    }, { replace });
  }, [setSearchParams]);

  // Price inputs keep their own text while typing and update the URL after a short pause,
  // instead of firing a request (and a history entry) per keystroke.
  const [priceInput, setPriceInput] = useState({ min: minPrice, max: maxPrice });

  useEffect(() => {
    setPriceInput({ min: minPrice, max: maxPrice });
  }, [minPrice, maxPrice]);

  useEffect(() => {
    if (priceInput.min === minPrice && priceInput.max === maxPrice) return undefined;
    const timer = setTimeout(() => {
      updateParams({ minPrice: priceInput.min, maxPrice: priceInput.max }, { replace: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [priceInput, minPrice, maxPrice, updateParams]);

  useEffect(() => {
    const params = { page: currentPage, limit: PAGE_SIZE, sort };
    if (category) params.category = category;
    if (search) params.search = search;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    fetchProducts(params);
  }, [currentPage, category, search, minPrice, maxPrice, sort, fetchProducts]);

  // Go back to the top of the grid when paging or changing filters
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentPage, category, search, minPrice, maxPrice, sort]);

  const clearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <h1>{pageTitle}</h1>
          <p>{search ? t('products.resultsSubtitle') : t('products.subtitle')}</p>
        </div>

        <div className="products-layout">
          {/* Filters Sidebar */}
          <aside className="filters-sidebar">
            <div className="filter-header">
              <h3>{t('products.filters')}</h3>
              <button className="clear-filters" onClick={clearFilters}>
                {t('products.clearAll')}
              </button>
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <h4>{t('products.category')}</h4>
              <div className="filter-options">
                <label className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={category === ''}
                    onChange={() => updateParams({ category: '' })}
                  />
                  <span>{t('products.allCategories')}</span>
                </label>
                {categories.map(cat => (
                  <label key={cat._id} className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      value={cat._id}
                      checked={activeCategoryId === cat._id}
                      onChange={() => updateParams({ category: cat._id })}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="filter-group">
              <h4>{t('products.priceRange')}</h4>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder={t('products.min')}
                  aria-label={t('products.min')}
                  value={priceInput.min}
                  onChange={(e) => setPriceInput(prev => ({ ...prev, min: e.target.value }))}
                  min="0"
                  step="0.01"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder={t('products.max')}
                  aria-label={t('products.max')}
                  value={priceInput.max}
                  onChange={(e) => setPriceInput(prev => ({ ...prev, max: e.target.value }))}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Sort Filter */}
            <div className="filter-group">
              <h4>{t('products.sortBy')}</h4>
              <select
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
              >
                <option value="-createdAt">{t('sort.newest')}</option>
                <option value="createdAt">{t('sort.oldest')}</option>
                <option value="price">{t('sort.priceAsc')}</option>
                <option value="-price">{t('sort.priceDesc')}</option>
                <option value="-salesCount">{t('sort.popular')}</option>
                <option value="-rating.average">{t('sort.rated')}</option>
              </select>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="products-main">
            {loading ? (
              <div className="loading">
                <i className="fas fa-spinner fa-spin"></i> {t('products.loading')}
              </div>
            ) : error ? (
              <div className="no-products">
                <i className="fas fa-exclamation-triangle"></i>
                <h3>{t('products.errorTitle')}</h3>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                  {t('products.retry')}
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="no-products">
                <i className="fas fa-box-open"></i>
                <h3>{t('products.emptyTitle')}</h3>
                <p>{t('products.emptyText')}</p>
                <button className="btn btn-primary" onClick={clearFilters}>
                  {t('products.clearFilters')}
                </button>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      onClick={() => updateParams({ page: String(Math.max(1, currentPage - 1)) }, { keepPage: true })}
                      disabled={currentPage === 1}
                      aria-label={t('pagination.prev')}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>

                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(page => {
                        const diff = Math.abs(page - currentPage);
                        return diff === 0 || diff === 1 || page === 1 || page === pagination.pages;
                      })
                      .map((page, index, arr) => (
                        <React.Fragment key={page}>
                          {index > 0 && arr[index - 1] !== page - 1 && (
                            <span className="page-dots">...</span>
                          )}
                          <button
                            className={`page-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => updateParams({ page: String(page) }, { keepPage: true })}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))
                    }

                    <button
                      className="page-btn"
                      onClick={() => updateParams({ page: String(Math.min(pagination.pages, currentPage + 1)) }, { keepPage: true })}
                      disabled={currentPage === pagination.pages}
                      aria-label={t('pagination.next')}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}

                <div className="results-info">
                  {t('products.showing', { shown: products.length, count: pagination.total })}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
