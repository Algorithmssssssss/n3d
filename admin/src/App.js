import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandProvider } from './context/BrandContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import CategoryList from './pages/CategoryList';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen"><i className="fas fa-spinner fa-spin"></i></div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <BrandProvider>
      <AuthProvider>
        {/* The panel is served under /admin (see "homepage" in package.json and the Caddyfile) */}
        <Router basename={process.env.PUBLIC_URL}>
          <div className="admin-app">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div className="admin-layout">
                      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
                      <main className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                        <header className="admin-header">
                          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <i className="fas fa-bars"></i>
                          </button>
                          <div className="header-right">
                            <span className="admin-badge">Admin</span>
                          </div>
                        </header>
                        <div className="admin-content">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/products" element={<ProductList />} />
                            <Route path="/products/new" element={<ProductForm />} />
                            <Route path="/products/edit/:id" element={<ProductForm />} />
                            <Route path="/categories" element={<CategoryList />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </div>
                      </main>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </BrandProvider>
  );
}

export default App;
