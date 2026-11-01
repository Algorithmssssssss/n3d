import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/api';
import './CategoryList.css';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'fas fa-tag',
    sortOrder: '0'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // includeInactive: show every category, with product counts that include inactive
      // products (the same rule the server uses when it refuses to delete a category).
      const response = await axios.get(`${API_URL}/categories`, { params: { includeInactive: true } });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || 'fas fa-tag',
        sortOrder: category.sortOrder?.toString() || '0'
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: 'fas fa-tag', sortOrder: '0' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: 'fas fa-tag', sortOrder: '0' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        sortOrder: Number(formData.sortOrder)
      };

      if (editingCategory) {
        await axios.put(`${API_URL}/categories/${editingCategory._id}`, payload);
      } else {
        await axios.post(`${API_URL}/categories`, payload);
      }

      fetchCategories();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/categories/${id}`);
      setCategories(categories.filter(c => c._id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const iconOptions = [
    'fas fa-tag', 'fas fa-circle', 'fas fa-shirt', 'fas fa-paperclip',
    'fas fa-box', 'fas fa-scissors', 'fas fa-ribbon', 'fas fa-gem'
  ];

  if (loading) {
    return (
      <div className="page-loading">
        <i className="fas fa-spinner fa-spin"></i> Loading categories...
      </div>
    );
  }

  return (
    <div className="category-list-page">
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Manage product categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <i className="fas fa-plus"></i> Add Category
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {categories.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-tags"></i>
              <h3>No categories yet</h3>
              <p>Create your first category to organize products</p>
              <button className="btn btn-primary" onClick={() => openModal()}>
                <i className="fas fa-plus"></i> Add Category
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Icon</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Products</th>
                    <th>Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <tr key={category._id}>
                      <td>
                        <div className="icon-preview">
                          <i className={category.icon}></i>
                        </div>
                      </td>
                      <td><strong>{category.name}</strong></td>
                      <td>{category.description || '-'}</td>
                      <td>{category.productCount || 0}</td>
                      <td>{category.sortOrder || 0}</td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => openModal(category)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeleteConfirm(category._id)}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Category name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  className="form-control"
                  placeholder="Brief description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Icon</label>
                  <select
                    name="icon"
                    className="form-control"
                    value={formData.icon}
                    onChange={handleChange}
                  >
                    {iconOptions.map(icon => (
                      <option key={icon} value={icon}>
                        {icon.replace('fas fa-', '')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    name="sortOrder"
                    className="form-control"
                    value={formData.sortOrder}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-save"></i> {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Delete Category</h3>
            <p>Are you sure you want to delete this category? Products in this category will need to be reassigned.</p>
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

export default CategoryList;
