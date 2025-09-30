import React, { useState } from 'react';
import { Settings, Key, QrCode, Users, BarChart3, Shield } from 'lucide-react';
import EventManager from './admin/EventManager';
import TicketKeyGenerator from './admin/TicketKeyGenerator';
import AdminQRScanner from './admin/AdminQRScanner';
import TicketAnalytics from './admin/TicketAnalytics';

const AdminPanel = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('analytics');

  const adminTabs = [
    { id: 'analytics', name: 'Analytics', icon: BarChart3, description: 'View ticket statistics and user data 📊' },
    { id: 'events', name: 'Event Manager', icon: Settings, description: 'Update event details and configuration ⚙️' },
    { id: 'keys', name: 'Access Keys', icon: Key, description: 'Generate and manage ticket access keys 🗝️' },
    { id: 'scanner', name: 'Ticket Scanner', icon: QrCode, description: 'Scan and validate user tickets 📱' }
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'analytics':
        return <TicketAnalytics />;
      case 'events':
        return <EventManager />;
      case 'keys':
        return <TicketKeyGenerator adminEmail={user.email} />;
      case 'scanner':
        return <AdminQRScanner adminEmail={user.email} />;
      default:
        return <TicketAnalytics />;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="glass-effect border-b border-white/20 p-6 animate-slide-right">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center animate-glow">
                <Shield className="w-6 h-6 text-white animate-float" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl blur opacity-30 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Admin Control Panel ✨</h1>
              <p className="text-white/80">Aditya University Freshers Event Management 🎉</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-white font-medium">{user.displayName || user.email}</p>
              <p className="text-purple-300 text-sm">Administrator 👑</p>
            </div>
            <div className="relative">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || user.email}
                  className="w-10 h-10 rounded-full border-2 border-purple-400/50 animate-glow object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center animate-glow ${user.photoURL ? 'hidden' : 'flex'}`}>
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
            <button
              onClick={onLogout}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-xl p-6 space-y-2 border border-purple-400/20">
              <h2 className="text-lg font-semibold gradient-text mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 animate-float" />
                Admin Tools ⚡
              </h2>
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                      activeTab === tab.id
                        ? 'bg-purple-500/20 border border-purple-400/40 text-purple-300 animate-glow'
                        : 'hover:bg-white/5 text-white/70 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{tab.name}</div>
                      <div className="text-xs opacity-70">{tab.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="glass-effect rounded-xl p-8 min-h-[600px] border border-cyan-400/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-cyan-500/5 animate-pulse"></div>
              <div className="relative z-10">
                {renderActiveComponent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;