import React, { useState } from 'react';

function ClientsList({ clients, programs, refreshData, apiUrl }) {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    program_id: '',
    payment_amount: '',
    due_date: 1
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Auto-fill payment amount when program is selected
    if (name === 'program_id' && value) {
      const selectedProgram = programs.find(p => p.id === parseInt(value));
      if (selectedProgram) {
        setFormData(prev => ({
          ...prev,
          payment_amount: selectedProgram.price
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingClient
        ? `${apiUrl}/clients/${editingClient.id}`
        : `${apiUrl}/clients`;

      const method = editingClient ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          program_id: parseInt(formData.program_id),
          payment_amount: parseFloat(formData.payment_amount),
          due_date: parseInt(formData.due_date)
        })
      });

      setFormData({
        name: '',
        phone: '',
        program_id: '',
        payment_amount: '',
        due_date: 1
      });
      setShowForm(false);
      setEditingClient(null);
      refreshData();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      program_id: client.program_id,
      payment_amount: client.payment_amount,
      due_date: client.due_date
    });
    setShowForm(true);
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client? This will also delete all their payment records.')) {
      try {
        await fetch(`${apiUrl}/clients/${clientId}`, {
          method: 'DELETE'
        });
        refreshData();
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData({
      name: '',
      phone: '',
      program_id: '',
      payment_amount: '',
      due_date: 1
    });
  };

  return (
    <div className="clients-list">
      <div className="section-header">
        <h2>Clients</h2>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Add Client'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Program *</label>
                <select
                  name="program_id"
                  value={formData.program_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} - ${program.price}/month
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Payment Amount *</label>
                <input
                  type="number"
                  name="payment_amount"
                  value={formData.payment_amount}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  placeholder="99.99"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Payment Due Date (Day of Month) *</label>
              <input
                type="number"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                required
                min="1"
                max="31"
                placeholder="1-31"
              />
              <small>Enter the day of the month when payment is due (e.g., 1 for 1st, 15 for 15th)</small>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingClient ? 'Update Client' : 'Add Client'}
              </button>
              <button type="button" className="btn-secondary" onClick={cancelForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="clients-grid">
        {clients.length === 0 ? (
          <p className="no-data">No clients yet. Add your first client to get started!</p>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="client-card">
              <div className="client-info">
                <h3>{client.name}</h3>
                <p className="client-program">📋 {client.program_name}</p>
                <p className="client-phone">📱 {client.phone}</p>
                <p className="client-payment">💰 ${client.payment_amount}/month</p>
                <p className="client-due">📅 Due: {client.due_date}{getDaySuffix(client.due_date)} of each month</p>
              </div>
              <div className="client-actions">
                <button className="btn-small btn-edit" onClick={() => handleEdit(client)}>
                  ✏️ Edit
                </button>
                <button className="btn-small btn-delete" onClick={() => handleDelete(client.id)}>
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

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export default ClientsList;
