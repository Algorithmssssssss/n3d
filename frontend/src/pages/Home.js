import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useProducts } from '../context/ProductContext';
import { useSettings } from '../context/SettingsContext';
import { useI18n } from '../i18n/I18nContext';
import { useSiteText, useDocumentTitle } from '../utils/siteText';
import ProductCard from '../components/ProductCard';
import { API_URL } from '../utils/api';
import './Home.css';

const Home = () => {
  const { categories } = useProducts();
  const { settings } = useSettings();
  const { t } = useI18n();
  const { name, tagline } = useSiteText();
  const { hash } = useLocation();
  useDocumentTitle();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load the featured list directly. It used to be filtered out of the shared product
  // list, which only held the newest 12 products (or the last page the Products screen
  // loaded), so featured products could silently vanish from the home page.
  useEffect(() => {
    let cancelled = false;

    axios.get(`${API_URL}/products`, { params: { featured: true, limit: 8 } })
      .then(response => {
        if (!cancelled) setFeaturedProducts(response.data.products);
      })
      .catch(err => console.error('Failed to fetch featured products:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // React Router doesn't scroll to #about / #contact on its own.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash, loading]);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>{tagline || t('defaults.tagline')}</h1>
            <p>{t('home.heroSubtitle')}</p>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">{t('home.stat.products')}</span>
              </div>
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">{t('home.stat.clients')}</span>
              </div>
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">{t('home.stat.countries')}</span>
              </div>
            </div>
            <Link to="/products" className="btn btn-primary btn-lg">
              {t('home.explore')}
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.categories.title')}</h2>
            <p>{t('home.categories.subtitle')}</p>
          </div>
          <div className="categories-grid">
            {categories.map(category => (
              <Link 
                to={`/products?category=${category._id}`} 
                key={category._id} 
                className="category-card"
              >
                <div className="category-icon">
                  <i className={category.icon}></i>
                </div>
                <h3>{category.name}</h3>
                <p>{t('home.productCount', { count: category.productCount || 0 })}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.featured.title')}</h2>
            <p>{t('home.featured.subtitle')}</p>
          </div>
          {loading ? (
            <div className="loading">
              <i className="fas fa-spinner fa-spin"></i> {t('home.loading')}
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
          <div className="view-all">
            <Link to="/products" className="btn btn-outline">
              {t('home.viewAll')}
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-us" id="about">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.why.title', { name })}</h2>
            <p>{t('home.why.subtitle')}</p>
          </div>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">
                <i className="fas fa-certificate"></i>
              </div>
              <h3>{t('home.why.quality.title')}</h3>
              <p>{t('home.why.quality.text')}</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <i className="fas fa-truck"></i>
              </div>
              <h3>{t('home.why.delivery.title')}</h3>
              <p>{t('home.why.delivery.text')}</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <h3>{t('home.why.price.title')}</h3>
              <p>{t('home.why.price.text')}</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <i className="fas fa-leaf"></i>
              </div>
              <h3>{t('home.why.eco.title')}</h3>
              <p>{t('home.why.eco.text')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="cta-section" id="contact">
        <div className="container">
          <div className="cta-content">
            <h2>{t('home.cta.title')}</h2>
            <p>{t('home.cta.text')}</p>
            <div className="cta-buttons">
              {/* Use the contact details from the admin Settings page (these were hard-coded) */}
              {settings.contact?.email && (
                <a href={`mailto:${settings.contact.email}`} className="btn btn-primary">
                  <i className="fas fa-envelope"></i> {t('home.cta.email')}
                </a>
              )}
              {settings.contact?.phone && (
                <a href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`} className="btn btn-outline btn-white">
                  <i className="fas fa-phone"></i> {t('home.cta.call')}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Chat Button */}
      <div className="floating-chat">
        <button className="chat-btn">
          <i className="fas fa-comment-dots"></i>
          <span>{t('home.chat')}</span>
        </button>
      </div>
    </div>
  );
};

export default Home;
