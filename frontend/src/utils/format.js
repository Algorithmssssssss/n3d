// Money and number formatting for the storefront. Always USD with Latin digits, whatever
// the visitor's language, because that is how product prices are entered and shown.

const usd = (minimumFractionDigits, maximumFractionDigits) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits
  });

// A unit price: at least cents, up to 4 decimals for prices like $0.0125 per piece.
export const formatPrice = (price) => usd(2, 4).format(price);

// An order total: whole cents, but tiny totals keep their precision (a $0.008 total would
// otherwise be shown as "$0.01").
export const formatTotal = (amount) => usd(2, amount < 1 ? 4 : 2).format(amount);

export const formatNumber = (value) => value.toLocaleString('en-US');
