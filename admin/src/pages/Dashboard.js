import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL, thumbnailUrl } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, inactive: 0, categories: 0, featured: 0, ecoFriendly: 0 });
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Counts come from the server. They used to be derived from the first 100 *active*
      // products, so deactivated products and anything beyond 100 were never counted.
      const [statsRes, recentRes] = await Promise.all([
        axios.get(`${API_URL}/products/stats`),
        axios.get(`${API_URL}/products`, { params: { limit: 5, sort: '-createdAt', includeInactive: true } })
      ]);

      setRecentProducts(recentRes.data.products);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <i className="fas fa-spinner fa-spin"></i> Loading dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's an overview of your store.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon products">
            <i className="fas fa-box"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Products{stats.inactive > 0 && ` (${stats.inactive} inactive)`}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon categories">
            <i className="fas fa-tags"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.categories}</h3>
            <p>Categories</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon featured">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.featured}</h3>
            <p>Featured Products</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon eco">
            <i className="fas fa-leaf"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.ecoFriendly}</h3>
            <p>Eco-Friendly</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/products/new" className="action-card">
            <i className="fas fa-plus-circle"></i>
            <span>Add New Product</span>
          </Link>
          <Link to="/categories" className="action-card">
            <i className="fas fa-folder-plus"></i>
            <span>Manage Categories</span>
          </Link>
          <Link to="/products" className="action-card">
            <i className="fas fa-list"></i>
            <span>View All Products</span>
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      <div className="card">
        <div className="card-header">
          <h2>Recent Products</h2>
          <Link to="/products" className="btn btn-outline btn-sm">
            View All
          </Link>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map(product => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        <img
                          src={thumbnailUrl(product)}
                          alt={product.name}
                        />
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{product.category?.name || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
