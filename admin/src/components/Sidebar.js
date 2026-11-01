import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { companyName, logoUrl } = useBrand();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { path: '/products', icon: 'fas fa-box', label: 'Products' },
    { path: '/products/new', icon: 'fas fa-plus-circle', label: 'Add Product' },
    { path: '/categories', icon: 'fas fa-tags', label: 'Categories' },
    { path: '/settings', icon: 'fas fa-cog', label: 'Settings' },
  ];

  const isActive = (path) => {
    const current = location.pathname;
    if (path === '/') return current === '/';
    // "/products/new" has its own menu item, so don't also light up "Products" there
    if (path === '/products') return current === '/products' || current.startsWith('/products/edit');
    return current.startsWith(path);
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onToggle}></div>
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="brand-logo" />
            ) : (
              <i className="fas fa-industry"></i>
            )}
            <span>{companyName}</span>
          </Link>
          <span className="admin-label">Admin Panel</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'Admin'}</span>
              <span className="user-role">{user?.role || 'admin'}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
