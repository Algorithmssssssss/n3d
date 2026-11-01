import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useI18n } from '../i18n/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';
import { assetUrl } from '../utils/api';
import './Header.css';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useSettings();
  const { t } = useI18n();
  const navigate = useNavigate();

  // The Products page reads ?search= and does the fetching, so results survive navigation.
  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
      setMobileMenuOpen(false);
    }
  };

  const renderLogo = () => {
    if (settings.logo?.url) {
      return <img src={assetUrl(settings.logo.url)} alt={settings.companyName} className="logo-image" />;
    }
    return <i className="fas fa-industry"></i>;
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            {renderLogo()}
            <span>{settings.companyName}</span>
          </Link>

          <button
            className="mobile-menu-btn"
            aria-label={t('header.menu')}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>

          <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t('nav.home')}
            </Link>
            <Link to="/products" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t('nav.products')}
            </Link>
            {/* Real routes (not bare #anchors) so they also work from other pages */}
            <Link to="/#about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t('nav.about')}
            </Link>
            <Link to="/#contact" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t('nav.contact')}
            </Link>
          </nav>

          <form className="search-box" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder={t('search.placeholder')}
              aria-label={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn" aria-label={t('search.submit')}>
              <i className="fas fa-search"></i>
            </button>
          </form>

          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;
