import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL, assetUrl } from '../utils/api';
import './ProductForm.css';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    originalPrice: '',
    priceRangeMin: '',
    priceRangeMax: '',
    category: '',
    minimumOrderQty: '100',
    minimumOrderUnit: 'pieces',
    stock: '',
    sku: '',
    tags: '',
    isFeatured: false,
    isActive: true,
    ecoFriendly: false,
    images: []
  });

  const [specifications, setSpecifications] = useState([{ name: '', value: '' }]);

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
    // Reload only when the product id changes; the fetchers depend on nothing else.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`, { params: { includeInactive: true } });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      const product = response.data;
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        priceRangeMin: product.priceRange?.min || '',
        priceRangeMax: product.priceRange?.max || '',
        category: product.category?._id || product.category || '',
        minimumOrderQty: product.minimumOrder?.quantity || '100',
        minimumOrderUnit: product.minimumOrder?.unit || 'pieces',
        stock: product.stock || '',
        sku: product.sku || '',
        tags: product.tags?.join(', ') || '',
        isFeatured: product.isFeatured || false,
        isActive: product.isActive !== false,
        ecoFriendly: product.ecoFriendly || false,
        images: product.images || []
      });

      if (product.specifications && product.specifications.length > 0) {
        setSpecifications(product.specifications);
      }
    } catch (error) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Exactly one image should be primary: keep the existing one, otherwise promote the first.
  const ensurePrimary = (images) => {
    if (images.length > 0 && !images.some(img => img.isPrimary)) {
      return images.map((img, i) => ({ ...img, isPrimary: i === 0 }));
    }
    return images;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = ''; // allow choosing the same file again later
    if (files.length === 0) return;

    setUploading(true);
    setError('');
    const uploadedImages = [];
    const failures = [];

    for (const file of files) {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      try {
        const response = await axios.post(`${API_URL}/upload`, formDataUpload);
        uploadedImages.push({
          url: response.data.url,
          alt: formData.name || file.name,
          isPrimary: false
        });
      } catch (error) {
        // Used to be only console.error, so a rejected file just... didn't appear.
        failures.push(`${file.name}: ${error.response?.data?.message || 'upload failed'}`);
      }
    }

    // Previously each batch marked its first image primary, even when the product
    // already had one, leaving several "primary" images.
    setFormData(prev => ({
      ...prev,
      images: ensurePrimary([...prev.images, ...uploadedImages])
    }));
    if (failures.length > 0) setError(failures.join(' | '));
    setUploading(false);
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: ensurePrimary(prev.images.filter((_, i) => i !== index))
    }));
  };

  const setPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { name: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index, field, value) => {
    setSpecifications(specifications.map((spec, i) =>
      i === index ? { ...spec, [field]: value } : spec
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        price: Number(formData.price),
        // null (not undefined) so clearing the field on an existing product really clears it
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        priceRange: {
          min: formData.priceRangeMin ? Number(formData.priceRangeMin) : undefined,
          max: formData.priceRangeMax ? Number(formData.priceRangeMax) : undefined
        },
        category: formData.category,
        minimumOrder: {
          quantity: Number(formData.minimumOrderQty),
          unit: formData.minimumOrderUnit
        },
        stock: formData.stock ? Number(formData.stock) : 0,
        sku: formData.sku.trim() || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        ecoFriendly: formData.ecoFriendly,
        images: formData.images,
        specifications: specifications.filter(s => s.name && s.value)
      };

      if (isEditing) {
        await axios.put(`${API_URL}/products/${id}`, payload);
        setSuccess('Product updated successfully!');
      } else {
        await axios.post(`${API_URL}/products`, payload);
        setSuccess('Product created successfully!');
        setTimeout(() => navigate('/products'), 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fas fa-spinner fa-spin"></i> Loading product...
      </div>
    );
  }

  return (
    <div className="product-form-page">
      <div className="page-header">
        <div>
          <h1>{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
          <p>{isEditing ? 'Update product information' : 'Fill in the details to add a new product'}</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/products')}>
          <i className="fas fa-arrow-left"></i> Back to Products
        </button>
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
        <div className="form-grid">
          {/* Main Info */}
          <div className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label>Product Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="e.g., Wholesale Pearl Eco-Friendly Buttons"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Short Description</label>
              <input
                type="text"
                name="shortDescription"
                className="form-control"
                placeholder="Brief description for product cards"
                value={formData.shortDescription}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Full Description <span className="required">*</span></label>
              <textarea
                name="description"
                className="form-control"
                placeholder="Detailed product description..."
                rows="5"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Tags</label>
              <input
                type="text"
                name="tags"
                className="form-control"
                placeholder="Comma-separated tags (e.g., buttons, eco-friendly, wholesale)"
                value={formData.tags}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="form-section">
            <h2>Pricing & Stock</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Price (USD) <span className="required">*</span></label>
                <input
                  type="number"
                  name="price"
                  className="form-control"
                  placeholder="0.02"
                  step="0.0001"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Original Price (USD)</label>
                <input
                  type="number"
                  name="originalPrice"
                  className="form-control"
                  placeholder="0.04"
                  step="0.0001"
                  min="0"
                  value={formData.originalPrice}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price Range Min (USD)</label>
                <input
                  type="number"
                  name="priceRangeMin"
                  className="form-control"
                  placeholder="0.02"
                  step="0.0001"
                  min="0"
                  value={formData.priceRangeMin}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Price Range Max (USD)</label>
                <input
                  type="number"
                  name="priceRangeMax"
                  className="form-control"
                  placeholder="0.05"
                  step="0.0001"
                  min="0"
                  value={formData.priceRangeMax}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Minimum Order Quantity</label>
                <input
                  type="number"
                  name="minimumOrderQty"
                  className="form-control"
                  placeholder="100"
                  min="1"
                  value={formData.minimumOrderQty}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Order Unit</label>
                <select
                  name="minimumOrderUnit"
                  className="form-control"
                  value={formData.minimumOrderUnit}
                  onChange={handleChange}
                >
                  <option value="pieces">Pieces</option>
                  <option value="rolls">Rolls</option>
                  <option value="boxes">Boxes</option>
                  <option value="kg">Kilograms</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  className="form-control"
                  placeholder="10000"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input
                  type="text"
                  name="sku"
                  className="form-control"
                  placeholder=" BTN-PEARL-001"
                  value={formData.sku}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Category & Status */}
          <div className="form-section">
            <h2>Category & Status</h2>
            
            <div className="form-group">
              <label>Category <span className="required">*</span></label>
              <select
                name="category"
                className="form-control"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span>Active (visible on store)</span>
              </label>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                />
                <span>Featured product</span>
              </label>
            </div>

            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="ecoFriendly"
                  checked={formData.ecoFriendly}
                  onChange={handleChange}
                />
                <span>Eco-friendly product</span>
              </label>
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="form-section full-width">
          <h2>Product Images</h2>
          
          <div className="image-upload-area">
            <label className="upload-label">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <div className="upload-box">
                {uploading ? (
                  <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
                ) : (
                  <><i className="fas fa-cloud-upload-alt"></i> Click to upload images</>
                )}
              </div>
            </label>
          </div>

          {formData.images.length > 0 && (
            <div className="image-preview-grid">
              {formData.images.map((img, index) => (
                <div key={index} className={`image-preview ${img.isPrimary ? 'primary' : ''}`}>
                  <img src={assetUrl(img.url)} alt={img.alt || 'Product'} />
                  <div className="image-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setPrimaryImage(index)}
                      title="Set as primary"
                    >
                      <i className="fas fa-star"></i>
                    </button>
                    <button
                      type="button"
                      className="btn-icon delete"
                      onClick={() => removeImage(index)}
                      title="Remove image"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  {img.isPrimary && <span className="primary-badge">Primary</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Specifications */}
        <div className="form-section full-width">
          <div className="section-header">
            <h2>Specifications</h2>
            <button type="button" className="btn btn-outline btn-sm" onClick={addSpecification}>
              <i className="fas fa-plus"></i> Add Spec
            </button>
          </div>
          
          {specifications.map((spec, index) => (
            <div key={index} className="spec-row">
              <input
                type="text"
                placeholder="Name (e.g., Material)"
                value={spec.name}
                onChange={(e) => handleSpecChange(index, 'name', e.target.value)}
                className="form-control"
              />
              <input
                type="text"
                placeholder="Value (e.g., Eco-friendly Resin)"
                value={spec.value}
                onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                className="form-control"
              />
              <button
                type="button"
                className="btn-icon delete"
                onClick={() => removeSpecification(index)}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/products')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <><i className="fas fa-spinner fa-spin"></i> Saving...</>
            ) : (
              <><i className="fas fa-save"></i> {isEditing ? 'Update Product' : 'Create Product'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
