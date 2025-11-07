import React, { useState } from 'react';

function ProgramsList({ programs, refreshData, apiUrl }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await fetch(`${apiUrl}/programs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      });

      setFormData({
        name: '',
        price: ''
      });
      setShowForm(false);
      refreshData();
    } catch (error) {
      console.error('Error saving program:', error);
    }
  };

  const handleDelete = async (programId) => {
    if (window.confirm('Are you sure you want to delete this program? Clients enrolled in this program will need to be reassigned.')) {
      try {
        await fetch(`${apiUrl}/programs/${programId}`, {
          method: 'DELETE'
        });
        refreshData();
      } catch (error) {
        console.error('Error deleting program:', error);
      }
    }
  };

  return (
    <div className="programs-list">
      <div className="section-header">
        <h2>Programs</h2>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Add Program'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>Add New Program</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Program Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Personal Training, Group Classes, Yoga"
              />
            </div>

            <div className="form-group">
              <label>Monthly Price *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                step="0.01"
                placeholder="99.99"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Add Program
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '', price: '' });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="programs-grid">
        {programs.length === 0 ? (
          <p className="no-data">No programs yet. Add your first program to get started!</p>
        ) : (
          programs.map((program) => (
            <div key={program.id} className="program-card">
              <div className="program-info">
                <h3>{program.name}</h3>
                <p className="program-price">${program.price}/month</p>
              </div>
              <div className="program-actions">
                <button
                  className="btn-small btn-delete"
                  onClick={() => handleDelete(program.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProgramsList;
