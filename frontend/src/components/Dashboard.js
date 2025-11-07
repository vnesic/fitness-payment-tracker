import React, { useState, useEffect } from 'react';

function Dashboard({ payments, refreshData, apiUrl }) {
  const [stats, setStats] = useState({
    paid_count: 0,
    pending_count: 0,
    total_received: 0,
    total_pending: 0
  });

  useEffect(() => {
    fetchStats();
  }, [payments]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/dashboard/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const markAsPaid = async (paymentId) => {
    try {
      await fetch(`${apiUrl}/payments/${paymentId}/mark-paid`, {
        method: 'PUT'
      });
      refreshData();
    } catch (error) {
      console.error('Error marking payment as paid:', error);
    }
  };

  const getStatusClass = (payment) => {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = payment.due_date;

    if (payment.status === 'paid') {
      return 'status-paid';
    } else if (dueDate < today) {
      return 'status-overdue';
    } else {
      return 'status-pending';
    }
  };

  const getStatusText = (payment) => {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = payment.due_date;

    if (payment.status === 'paid') {
      return '✓ Paid';
    } else if (dueDate < today) {
      return '⚠️ Overdue';
    } else {
      return '⏳ Pending';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="dashboard">
      <h2>Dashboard - {currentMonth}</h2>

      <div className="stats-grid">
        <div className="stat-card paid">
          <div className="stat-icon">✓</div>
          <div className="stat-info">
            <div className="stat-value">{stats.paid_count}</div>
            <div className="stat-label">Paid Clients</div>
            <div className="stat-amount">${stats.total_received?.toFixed(2) || '0.00'}</div>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pending_count}</div>
            <div className="stat-label">Pending Payments</div>
            <div className="stat-amount">${stats.total_pending?.toFixed(2) || '0.00'}</div>
          </div>
        </div>

        <div className="stat-card total">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-value">{stats.paid_count + stats.pending_count}</div>
            <div className="stat-label">Total Expected</div>
            <div className="stat-amount">
              ${((stats.total_received || 0) + (stats.total_pending || 0)).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="payments-list">
        <h3>Current Month Payments</h3>
        {payments.length === 0 ? (
          <p className="no-data">No payments for this month</p>
        ) : (
          <div className="table-responsive">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Program</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className={getStatusClass(payment)}>
                    <td>{payment.client_name}</td>
                    <td>{payment.program_name}</td>
                    <td>${payment.amount.toFixed(2)}</td>
                    <td>{formatDate(payment.due_date)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(payment)}`}>
                        {getStatusText(payment)}
                      </span>
                    </td>
                    <td>
                      {payment.status === 'pending' && (
                        <button
                          className="btn-small btn-success"
                          onClick={() => markAsPaid(payment.id)}
                        >
                          Mark Paid
                        </button>
                      )}
                      {payment.status === 'paid' && (
                        <span className="paid-indicator">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
