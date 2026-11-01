import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';
import { SettingsProvider } from './context/SettingsContext';
import { I18nProvider } from './i18n/I18nContext';
import SiteMeta from './components/SiteMeta';
import Header from './components/Header';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Footer from './components/Footer';
import './App.css';

// Client-side navigation keeps the previous scroll position; start each page at the top
// (unless the link points at a #section, which Home scrolls to itself).
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

function App() {
  return (
    <I18nProvider>
      <SettingsProvider>
        <ProductProvider>
          <SiteMeta />
          <Router>
            <ScrollToTop />
            <div className="App">
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </ProductProvider>
      </SettingsProvider>
    </I18nProvider>
  );
}

export default App;
