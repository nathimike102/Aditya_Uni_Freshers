import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import TicketPurchase from './components/TicketPurchase';
import TicketDisplay from './components/TicketDisplay';
import QRScanner from './components/QRScanner';
import { LogOut, User } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('purchase'); // purchase, tickets, scanner
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (user, name) => {
    setUser(user);
    setUserName(name);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserName('');
      setTickets([]);
      setCurrentView('purchase');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleTicketPurchased = (newTickets) => {
    setTickets(newTickets);
    setCurrentView('tickets');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">{userName}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {currentView === 'purchase' && (
          <TicketPurchase
            user={user}
            userName={userName}
            onTicketPurchased={handleTicketPurchased}
          />
        )}

        {currentView === 'tickets' && (
          <TicketDisplay
            tickets={tickets}
            onScanTicket={() => setCurrentView('scanner')}
            onBackToPurchase={() => setCurrentView('purchase')}
          />
        )}

        {currentView === 'scanner' && (
          <QRScanner
            onBack={() => setCurrentView('tickets')}
          />
        )}
      </main>
    </div>
  );
}

export default App;