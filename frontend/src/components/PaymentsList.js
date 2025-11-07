import React from 'react';

function PaymentsList({ payments, refreshData, apiUrl }) {
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

  const groupedPayments = payments.reduce((acc, payment) => {
    const month = new Date(payment.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(payment);
    return acc;
  }, {});

  return (
    <div className="payments-list">
      <h2>Payment History</h2>

      {payments.length === 0 ? (
        <p className="no-data">No payment records yet</p>
      ) : (
        Object.entries(groupedPayments).map(([month, monthPayments]) => (
          <div key={month} className="payment-month-group">
            <h3 className="month-header">{month}</h3>
            <div className="table-responsive">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Program</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>SMS Sent</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {monthPayments.map((payment) => (
                    <tr key={payment.id} className={getStatusClass(payment)}>
                      <td>{payment.client_name}</td>
                      <td>{payment.program_name}</td>
                      <td>{payment.phone}</td>
                      <td>${payment.amount.toFixed(2)}</td>
                      <td>{formatDate(payment.due_date)}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(payment)}`}>
                          {getStatusText(payment)}
                        </span>
                      </td>
                      <td>
                        {payment.sms_sent ? (
                          <span className="sms-sent">✓ Sent</span>
                        ) : (
                          <span className="sms-not-sent">✕ Not sent</span>
                        )}
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
          </div>
        ))
      )}
    </div>
  );
}

export default PaymentsList;
