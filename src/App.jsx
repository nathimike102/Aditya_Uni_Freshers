import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, realtimeDB, ADMIN_CONFIG } from './firebase';
import Login from './components/Login';
import TicketPurchase from './components/TicketPurchase';
import TicketDisplay from './components/TicketDisplay';
import AdminPanel from './components/AdminPanel';
import { LogOut, User } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('purchase');
  const [tickets, setTickets] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginKey, setLoginKey] = useState(0);

  useEffect(() => {
    realtimeDB.admin.initializeDefaultData();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const adminStatus = ADMIN_CONFIG.isAdmin(user.email);
        setIsAdmin(adminStatus);
        
        // Load user profile data to get persisted display name
        try {
          const userProfile = await realtimeDB.getUserProfile(user.uid);
          if (userProfile && userProfile.displayName) {
            console.log('Loaded user profile:', userProfile.displayName);
            setUserName(userProfile.displayName);
          } else {
            // Fallback to Firebase user data
            setUserName(user.displayName || 'Guest');
          }
        } catch (profileError) {
          console.error('Failed to load user profile:', profileError);
          setUserName(user.displayName || 'Guest');
        }
        
        if (!adminStatus) {
          try {
            const existingTickets = await realtimeDB.getTickets(user.uid);
            setTickets(existingTickets);
            if (existingTickets.length > 0) {
              setCurrentView('tickets');
            }
          } catch (error) {
            console.error('Failed to load tickets:', error);
          }
        }
      } else {
        // Clear user name when logged out
        setUserName('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isAdmin) {
      const handleBeforeUnload = async (event) => {
        try {
          await signOut(auth);
        } catch (error) {
          console.error('Error during auto-logout:', error);
        }
      };

      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'hidden') {
          try {
            await signOut(auth);
          } catch (error) {
            console.error('Error during auto-logout:', error);
          }
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user, isAdmin]);

  const handleLogin = async (user, name) => {
    setUser(user);
    setIsAdmin(ADMIN_CONFIG.isAdmin(user.email));
    
    try {
      const userProfile = await realtimeDB.getUserProfile(user.uid);
      if (userProfile && userProfile.displayName) {
        setUserName(userProfile.displayName);
      } else {
        setUserName(name);
      }
    } catch (error) {
      console.error('Failed to load user profile on login:', error);
      setUserName(name);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserName('');
      setTickets([]);
      setCurrentView('purchase');
      setIsAdmin(false);
      setLoginKey(prev => prev + 1);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleTicketPurchased = async (newTickets) => {
    try {
      const allTickets = await realtimeDB.getTickets(user.uid);
      setTickets(allTickets);
      setCurrentView('tickets');
    } catch (error) {
      console.error('Error loading updated tickets:', error);
      setTickets(newTickets);
      setCurrentView('tickets');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6 animate-glow"></div>
            <div className="absolute inset-0 w-16 h-16 border-2 border-purple-400 rounded-full animate-ping mx-auto"></div>
          </div>
          <p className="text-2xl font-semibold text-white animate-float">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login key={loginKey} onLogin={handleLogin} />;
  }

  if (isAdmin) {
    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen">
      <header className="glass-effect sticky top-0 z-50 animate-slide-right">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || userName}
                  className="w-12 h-12 rounded-full border-2 border-cyan-400/50 animate-glow object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center animate-glow ${user.photoURL ? 'hidden' : 'flex'}`}>
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur opacity-30 animate-pulse"></div>
            </div>
            <div>
              <h2 className="font-bold text-white text-lg gradient-text">{user.displayName || userName}</h2>
              <p className="text-sm text-white/70">{user.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="btn-secondary flex items-center space-x-2 hover:scale-105 transition-transform"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

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
            user={user}
            userName={userName}
            onBackToPurchase={() => setCurrentView('purchase')}
          />
        )}
      </main>
    </div>
  );
}

export default App;