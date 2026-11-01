import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useI18n } from '../i18n/I18nContext';
import { useDocumentTitle } from '../utils/siteText';
import { formatPrice } from '../utils/format';
import CostEstimator from '../components/CostEstimator';
import { API_URL, assetUrl } from '../utils/api';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const { t, unit } = useI18n();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useDocumentTitle(product ? product.name : t('nav.products'));

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      // Reset everything from the previous product (a stale error used to stick around
      // and hide the next product; the old image index could point past the new list)
      setLoading(true);
      setError(null);
      setProduct(null);
      setSelectedImage(0);
      try {
        const response = await axios.get(`${API_URL}/products/${id}`);
        if (!cancelled) setProduct(response.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Product not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProduct();

    return () => { cancelled = true; };
  }, [id]);

  const getImageUrl = (img) => {
    if (img && img.url) {
      return assetUrl(img.url);
    }
    return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop';
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> {t('detail.loading')}
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="error-state">
            <i className="fas fa-exclamation-triangle"></i>
            <h2>{t('detail.notFound')}</h2>
            <p>{t('detail.notFoundText')}</p>
            <Link to="/products" className="btn btn-primary">
              {t('detail.back')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop', alt: product.name }];

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span>/</span>
          <Link to="/products">{t('nav.products')}</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/products?category=${product.category._id}`}>{product.category.name}</Link>
              <span>/</span>
            </>
          )}
          <span className="current">{product.name}</span>
        </nav>

        {/* Product Detail */}
        <div className="product-detail">
          {/* Images */}
          <div className="product-images">
            <div className="main-image">
              <img src={getImageUrl(images[selectedImage])} alt={product.name} />
              {(product.ecoFriendly || product.isFeatured) && (
                <div className="badges">
                  {product.ecoFriendly && <span className="badge eco">{t('product.eco')}</span>}
                  {product.isFeatured && <span className="badge featured">{t('product.featured')}</span>}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="image-thumbnails">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={getImageUrl(img)} alt={`${product.name} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="product-info-detail">
            <h1>{product.name}</h1>

            <div className="price-section">
              <span className="current-price">{formatPrice(product.price)}</span>
              {product.priceRange && product.priceRange.max > product.price && (
                <span className="price-range">
                  {formatPrice(product.priceRange.min)} - {formatPrice(product.priceRange.max)}
                </span>
              )}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="original-price">{formatPrice(product.originalPrice)}</span>
              )}
            </div>

            <div className="meta-info">
              <div className="meta-item">
                <span className="label">{t('detail.minOrder')}</span>
                <span className="value">
                  {product.minimumOrder?.quantity || 100} {unit(product.minimumOrder?.unit || 'pieces')}
                </span>
              </div>
              <div className="meta-item">
                <span className="label">{t('detail.stock')}</span>
                <span className="value">{product.stock?.toLocaleString('en-US') || t('detail.available')}</span>
              </div>
              {product.sku && (
                <div className="meta-item">
                  <span className="label">{t('detail.sku')}</span>
                  <span className="value">{product.sku}</span>
                </div>
              )}
              {product.salesCount > 0 && (
                <div className="meta-item">
                  <span className="label">{t('detail.sold')}</span>
                  <span className="value">{product.salesCount.toLocaleString('en-US')}</span>
                </div>
              )}
            </div>

            {product.shortDescription && (
              <p className="short-description">{product.shortDescription}</p>
            )}

            {product.price > 0 && <CostEstimator key={product._id} product={product} />}

            <div className="action-buttons">
              <button className="btn btn-primary btn-lg">
                <i className="fas fa-envelope"></i> {t('product.contact')}
              </button>
              <button className="btn btn-outline btn-lg">
                <i className="fas fa-heart"></i> {t('detail.favorite')}
              </button>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="product-tags">
                {product.tags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description & Specifications */}
        <div className="product-tabs">
          <div className="tab-content">
            <h3>{t('detail.description')}</h3>
            <div className="description-text">
              <p>{product.description}</p>
            </div>
          </div>

          {product.specifications && product.specifications.length > 0 && (
            <div className="tab-content">
              <h3>{t('detail.specifications')}</h3>
              <table className="spec-table">
                <tbody>
                  {product.specifications.map((spec, index) => (
                    <tr key={index}>
                      <td className="spec-name">{spec.name}</td>
                      <td className="spec-value">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
