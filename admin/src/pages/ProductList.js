import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, fetchAllProducts, thumbnailUrl } from '../utils/api';
import './ProductList.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setLoadError('');
    try {
      // Includes inactive products. This used to request only the first 100 *active*
      // ones, so a product vanished from the panel (and couldn't be re-activated) as
      // soon as it was switched to inactive.
      setProducts(await fetchAllProducts(axios));
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setLoadError(error.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const toggleFeatured = async (id) => {
    try {
      const response = await axios.patch(`${API_URL}/products/${id}/toggle-featured`);
      setProducts(products.map(p => p._id === id ? response.data : p));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update featured status');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fas fa-spinner fa-spin"></i> Loading products...
      </div>
    );
  }

  return (
    <div className="product-list-page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>Manage your product inventory</p>
        </div>
        <Link to="/products/new" className="btn btn-primary">
          <i className="fas fa-plus"></i> Add Product
        </Link>
      </div>

      {loadError && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i> {loadError}
        </div>
      )}

      {/* Search */}
      <div className="search-bar">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-body">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-box-open"></i>
              <h3>No products found</h3>
              <p>{search ? 'Try a different search term' : 'Start by adding your first product'}</p>
              {!search && (
                <Link to="/products/new" className="btn btn-primary">
                  <i className="fas fa-plus"></i> Add Product
                </Link>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Featured</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product._id}>
                      <td>
                        <div className="product-cell">
                          <img
                            src={thumbnailUrl(product)}
                            alt={product.name}
                          />
                          <div>
                            <span className="product-name">{product.name}</span>
                            {product.ecoFriendly && (
                              <span className="eco-badge">Eco</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{formatPrice(product.price)}</td>
                      <td>{product.category?.name || 'N/A'}</td>
                      <td>{product.stock?.toLocaleString() || 'N/A'}</td>
                      <td>
                        <button
                          className={`featured-toggle ${product.isFeatured ? 'active' : ''}`}
                          onClick={() => toggleFeatured(product._id)}
                        >
                          <i className={`fas fa-star`}></i>
                        </button>
                      </td>
                      <td>
                        <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <Link
                            to={`/products/edit/${product._id}`}
                            className="btn btn-sm btn-outline"
                            title="Edit"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeleteConfirm(product._id)}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Product</h3>
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                <i className="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
