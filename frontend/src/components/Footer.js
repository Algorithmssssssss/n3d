import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useProducts } from '../context/ProductContext';
import { useI18n } from '../i18n/I18nContext';
import { useSiteText } from '../utils/siteText';
import { assetUrl } from '../utils/api';
import './Footer.css';

const Footer = () => {
  const { settings } = useSettings();
  const { categories } = useProducts();
  const { t } = useI18n();
  const { tagline, workingHours } = useSiteText();
  const contact = settings.contact || {};

  const renderLogo = () => {
    if (settings.logo?.url) {
      return <img src={assetUrl(settings.logo.url)} alt={settings.companyName} className="logo-image" />;
    }
    return <i className="fas fa-industry"></i>;
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link to="/" className="logo">
              {renderLogo()}
              <span>{settings.companyName}</span>
            </Link>
            <p>{tagline}</p>
            <div className="social-links">
              {settings.social?.facebook && (
                <a href={settings.social.facebook} target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook-f"></i>
                </a>
              )}
              {settings.social?.twitter && (
                <a href={settings.social.twitter} target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-twitter"></i>
                </a>
              )}
              {settings.social?.instagram && (
                <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i>
                </a>
              )}
              {settings.social?.linkedin && (
                <a href={settings.social.linkedin} target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              )}
              {!settings.social?.facebook && !settings.social?.twitter && !settings.social?.instagram && !settings.social?.linkedin && (
                <>
                  <a href="#fb"><i className="fab fa-facebook-f"></i></a>
                  <a href="#tw"><i className="fab fa-twitter"></i></a>
                  <a href="#ig"><i className="fab fa-instagram"></i></a>
                  <a href="#li"><i className="fab fa-linkedin-in"></i></a>
                </>
              )}
            </div>
          </div>
          <div className="footer-col">
            <h4>{t('footer.products')}</h4>
            <ul>
              {categories.slice(0, 6).map(category => (
                <li key={category._id}>
                  <Link to={`/products?category=${category._id}`}>{category.name}</Link>
                </li>
              ))}
              <li><Link to="/products">{t('footer.allProducts')}</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t('footer.company')}</h4>
            <ul>
              <li><Link to="/#about">{t('footer.about')}</Link></li>
              <li><a href="#factory">{t('footer.factory')}</a></li>
              <li><a href="#certs">{t('footer.certifications')}</a></li>
              <li><a href="#careers">{t('footer.careers')}</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>{t('footer.contact')}</h4>
            <ul className="footer-contact">
              {contact.address && (
                <li><i className="fas fa-location-dot"></i><span>{contact.address}</span></li>
              )}
              {contact.phone && (
                <li><i className="fas fa-phone"></i><a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}>{contact.phone}</a></li>
              )}
              {contact.email && (
                <li><i className="fas fa-envelope"></i><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
              )}
              {workingHours && (
                <li><i className="fas fa-clock"></i><span>{workingHours}</span></li>
              )}
            </ul>
            <ul>
              <li><Link to="/#contact">{t('footer.contactUs')}</Link></li>
              <li><a href="#faq">{t('footer.faq')}</a></li>
              <li><a href="#shipping">{t('footer.shipping')}</a></li>
              <li><a href="#privacy">{t('footer.privacy')}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{t('footer.rights', { year: new Date().getFullYear(), name: settings.companyName })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
