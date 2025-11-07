import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ClientsList from './components/ClientsList';
import ProgramsList from './components/ProgramsList';
import PaymentsList from './components/PaymentsList';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use environment variable for API URL, fallback to localhost for development
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsRes, programsRes, paymentsRes] = await Promise.all([
        fetch(`${API_URL}/clients`),
        fetch(`${API_URL}/programs`),
        fetch(`${API_URL}/payments/current-month`)
      ]);

      if (!clientsRes.ok || !programsRes.ok || !paymentsRes.ok) {
        throw new Error('Failed to fetch data from server');
      }

      const clientsData = await clientsRes.json();
      const programsData = await programsRes.json();
      const paymentsData = await paymentsRes.json();

      setClients(clientsData);
      setPrograms(programsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Unable to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading && clients.length === 0) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <div className="error-message">
            <h3>⚠️ Connection Error</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchData}>
              Try Again
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard payments={payments} refreshData={fetchData} apiUrl={API_URL} />;
      case 'clients':
        return <ClientsList clients={clients} programs={programs} refreshData={fetchData} apiUrl={API_URL} />;
      case 'programs':
        return <ProgramsList programs={programs} refreshData={fetchData} apiUrl={API_URL} />;
      case 'payments':
        return <PaymentsList payments={payments} refreshData={fetchData} apiUrl={API_URL} />;
      default:
        return <Dashboard payments={payments} refreshData={fetchData} apiUrl={API_URL} />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>💪 Fitness Payment Tracker</h1>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === 'clients' ? 'active' : ''}
          onClick={() => setActiveTab('clients')}
        >
          👥 Clients
        </button>
        <button
          className={activeTab === 'programs' ? 'active' : ''}
          onClick={() => setActiveTab('programs')}
        >
          🏋️ Programs
        </button>
        <button
          className={activeTab === 'payments' ? 'active' : ''}
          onClick={() => setActiveTab('payments')}
        >
          💳 Payments
        </button>
      </nav>

      <main className="app-content">
        {renderContent()}
      </main>

      <footer className="app-footer">
        <p>💪 Fitness Payment Tracker | Automated SMS Reminders</p>
      </footer>
    </div>
  );
}

export default App;
