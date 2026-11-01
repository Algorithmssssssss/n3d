import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { assetUrl } from '../utils/api';
import { formatPrice } from '../utils/format';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { t, unit } = useI18n();

  const getImageUrl = () => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
      return assetUrl(primaryImage.url);
    }
    return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop';
  };

  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`}>
        <div className="product-image">
          <img 
            src={getImageUrl()} 
            alt={product.name}
            loading="lazy"
          />
          {(product.ecoFriendly || product.isFeatured) && (
            <div className="badges">
              {product.ecoFriendly && (
                <span className="badge eco">{t('product.eco')}</span>
              )}
              {product.isFeatured && (
                <span className="badge featured">{t('product.featured')}</span>
              )}
            </div>
          )}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="badge sale">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </span>
          )}
        </div>
        <div className="product-info">
          <h3 className="product-title">{product.name}</h3>
          <div className="product-price">
            <span className="current-price">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="original-price">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
          <div className="product-meta">
            <span className="min-order">
              {t('product.minOrder', {
                quantity: product.minimumOrder?.quantity || 100,
                unit: unit(product.minimumOrder?.unit || 'pieces')
              })}
            </span>
            {product.salesCount > 0 && (
              <span className="sales-count">{t('product.sold', { count: product.salesCount.toLocaleString('en-US') })}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="product-actions">
        <button className="btn btn-outline btn-sm">
          <i className="fas fa-envelope"></i> {t('product.contact')}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
