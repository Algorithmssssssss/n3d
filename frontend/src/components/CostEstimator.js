import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { parseQuantity } from '../utils/estimate';
import { formatNumber, formatPrice, formatTotal } from '../utils/format';
import './CostEstimator.css';

// "Estimate your cost": the visitor types a quantity and sees quantity x unit price.
const CostEstimator = ({ product }) => {
  const { t, unit: translateUnit } = useI18n();

  const minQuantity = product.minimumOrder?.quantity || 100;
  const unit = translateUnit(product.minimumOrder?.unit || 'pieces');

  // Start from the minimum order so there is a sensible example to look at straight away
  const [input, setInput] = useState(String(minQuantity));

  const quantity = parseQuantity(input);
  const total = quantity === null ? null : quantity * product.price;
  const belowMinimum = quantity !== null && quantity < minQuantity;

  return (
    <section className="cost-estimator" aria-labelledby="cost-estimator-title">
      <h3 id="cost-estimator-title">
        <i className="fas fa-calculator"></i> {t('estimate.title')}
      </h3>

      <label htmlFor="estimate-quantity">{t('estimate.quantity')}</label>
      <div className="estimator-field">
        <input
          id="estimate-quantity"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          placeholder={t('estimate.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <span className="estimator-unit">{unit}</span>
      </div>

      <div className="estimator-result" aria-live="polite">
        {total === null ? (
          <p className="estimator-hint">{t('estimate.empty')}</p>
        ) : (
          <>
            <p className="estimator-formula">
              {t('estimate.formula', {
                quantity: formatNumber(quantity),
                unit,
                price: formatPrice(product.price)
              })}
            </p>
            <div className="estimator-total">
              <span>{t('estimate.total')}</span>
              <strong>{formatTotal(total)}</strong>
            </div>
          </>
        )}

        {belowMinimum && (
          <p className="estimator-warning">
            <i className="fas fa-triangle-exclamation"></i>{' '}
            {t('estimate.belowMin', { quantity: formatNumber(minQuantity), unit })}
          </p>
        )}
      </div>

      <p className="estimator-note">{t('estimate.note')}</p>
    </section>
  );
};

export default CostEstimator;
