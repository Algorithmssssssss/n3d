import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, assetUrl } from '../utils/api';
import { useBrand } from '../context/BrandContext';
import './Settings.css';

const Settings = () => {
  const { refresh: refreshBrand } = useBrand();
  const [settings, setSettings] = useState({
    companyName: '',
    tagline: '',
    logo: { url: '', alt: '' },
    contact: {
      email: '',
      phone: '',
      address: ''
    },
    social: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    },
    workingHours: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      setSettings(response.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contact.')) {
      const field = name.split('.')[1];
      setSettings(prev => ({
        ...prev,
        contact: { ...prev.contact, [field]: value }
      }));
    } else if (name.startsWith('social.')) {
      const field = name.split('.')[1];
      setSettings(prev => ({
        ...prev,
        social: { ...prev.social, [field]: value }
      }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData);
      
      setSettings(prev => ({
        ...prev,
        logo: {
          url: response.data.url,
          alt: file.name
        }
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    setSettings(prev => ({
      ...prev,
      logo: { url: '', alt: '' }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(`${API_URL}/settings`, settings);
      refreshBrand(); // update this panel's tab title, icon and sidebar straight away
      setSuccess('Settings saved successfully! Refresh the customer store to see changes.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fas fa-spinner fa-spin"></i> Loading settings...
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Company Settings</h1>
          <p>Manage your company branding and contact information</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="settings-grid">
          {/* Branding Section */}
          <div className="settings-section">
            <h2>Branding</h2>
            
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="companyName"
                className="form-control"
                placeholder="Your Company Name"
                value={settings.companyName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Tagline</label>
              <input
                type="text"
                name="tagline"
                className="form-control"
                placeholder="Your company tagline"
                value={settings.tagline}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Company Logo</label>
              <div className="logo-upload-area">
                {settings.logo?.url ? (
                  <div className="logo-preview">
                    <img src={assetUrl(settings.logo.url)} alt={settings.logo.alt || 'Logo'} />
                    <button type="button" className="btn-remove-logo" onClick={removeLogo}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-box">
                      {uploading ? (
                        <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                      ) : (
                        <><i className="fas fa-cloud-upload-alt"></i> Click to upload logo</>
                      )}
                    </div>
                  </label>
                )}
              </div>
              <p className="help-text">Recommended size: 200x50 pixels. Max file size: 5MB. The logo and company name also set the browser tab icon and title (a square logo looks best as a tab icon).</p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="settings-section">
            <h2>Contact Information</h2>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="contact.email"
                className="form-control"
                placeholder="contact@company.com"
                value={settings.contact?.email || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                name="contact.phone"
                className="form-control"
                placeholder="+1 234 567 890"
                value={settings.contact?.phone || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="contact.address"
                className="form-control"
                rows="3"
                placeholder="Company address"
                value={settings.contact?.address || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Working Hours</label>
              <input
                type="text"
                name="workingHours"
                className="form-control"
                placeholder="Monday - Friday: 9AM - 6PM"
                value={settings.workingHours}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Social Media Section */}
          <div className="settings-section full-width">
            <h2>Social Media Links</h2>
            <div className="social-grid">
              <div className="form-group">
                <label><i className="fab fa-facebook"></i> Facebook</label>
                <input
                  type="url"
                  name="social.facebook"
                  className="form-control"
                  placeholder="https://facebook.com/yourpage"
                  value={settings.social?.facebook || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label><i className="fab fa-twitter"></i> Twitter</label>
                <input
                  type="url"
                  name="social.twitter"
                  className="form-control"
                  placeholder="https://twitter.com/yourhandle"
                  value={settings.social?.twitter || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label><i className="fab fa-instagram"></i> Instagram</label>
                <input
                  type="url"
                  name="social.instagram"
                  className="form-control"
                  placeholder="https://instagram.com/yourprofile"
                  value={settings.social?.instagram || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label><i className="fab fa-linkedin"></i> LinkedIn</label>
                <input
                  type="url"
                  name="social.linkedin"
                  className="form-control"
                  placeholder="https://linkedin.com/company/yourcompany"
                  value={settings.social?.linkedin || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? (
              <><i className="fas fa-spinner fa-spin"></i> Saving...</>
            ) : (
              <><i className="fas fa-save"></i> Save Settings</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
