// Reads what the visitor typed into the quantity box: a positive number, or null when it
// is empty, zero, negative or not a number. Thousands separators ("10,000") are accepted.
export const parseQuantity = (text) => {
  const value = Number(String(text ?? '').replace(/[,\s]/g, ''));
  return Number.isFinite(value) && value > 0 ? value : null;
};
