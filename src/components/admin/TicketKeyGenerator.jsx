import React, { useState, useEffect } from 'react';
import { Key, Plus, Lock, Eye, EyeOff, Shield, Trash2, Copy, CheckCircle, Filter, PartyPopper, Sparkles } from 'lucide-react';
import { realtimeDB, ADMIN_CONFIG } from '../../firebase';
import Logger from '../../utils/logger';

const TicketKeyGenerator = ({ adminEmail }) => {
  const [accessKeys, setAccessKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    keyCode: '',
    expiresAt: ''
  });
  const [eventDetails, setEventDetails] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copying, setCopying] = useState('');
  const [filterUsed, setFilterUsed] = useState('all');

  useEffect(() => {
    loadAccessKeys();
  }, []);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  const loadEventDetails = async () => {
    try {
      const details = await realtimeDB.admin.getEventDetails();
      setEventDetails(details);
    } catch (error) {
      Logger.error('Failed to load event details:', error);
    }
  };

  const loadAccessKeys = async () => {
    setLoading(true);
    try {
      const keys = await realtimeDB.admin.getAccessKeys();
      setAccessKeys(keys);
      await loadEventDetails();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load access keys' });
    } finally {
      setLoading(false);
    }
  };

  const validateAdminPassword = () => {
    if (adminPassword === ADMIN_CONFIG.adminPassword) {
      setShowPasswordPrompt(false);
      setAdminPassword('');
      handleGenerateKey();
      return true;
    }
    setMessage({ type: 'error', text: 'Invalid admin password' });
    return false;
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateKey = () => {
    try {
      const newKey = generateRandomKey();
      Logger.debug('Generated new key:', newKey);
      setNewKeyForm(prev => ({
        ...prev,
        keyCode: newKey
      }));
      setMessage({ type: 'success', text: '🎉 New access key generated successfully!' });
    } catch (error) {
      Logger.error('Error generating key:', error);
      setMessage({ type: 'error', text: 'Failed to generate key' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newKeyForm.keyCode) {
      setMessage({ type: 'error', text: 'Please generate a key code first' });
      return;
    }

    setLoading(true);
    try {
      const keyData = {
        keyCode: newKeyForm.keyCode,
        keyName: eventDetails?.eventName || 'Event Access Key',
        description: eventDetails?.description || 'Single-use access key for event',
        maxUses: 1,
        expiresAt: newKeyForm.expiresAt,
        createdBy: adminEmail,
        usedCount: 0,
        usedBy: [],
        createdAt: new Date().toISOString()
      };

      Logger.debug('Submitting key data:', keyData);
      await realtimeDB.admin.generateAccessKey(keyData);
      setMessage({ type: 'success', text: 'Single-use access key created successfully!' });
      
      setNewKeyForm({
        keyCode: '',
        expiresAt: ''
      });
      
      await loadAccessKeys();
    } catch (error) {
      Logger.error('Error creating access key:', error);
      setMessage({ type: 'error', text: `Failed to create access key: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, keyId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(keyId);
      setTimeout(() => setCopying(''), 2000);
    } catch (error) {

    }
  };

  const getFilteredKeys = () => {
    switch (filterUsed) {
      case 'used':
        return accessKeys.filter(key => (key.usedCount || 0) > 0);
      case 'unused':
        return accessKeys.filter(key => (key.usedCount || 0) === 0);
      default:
        return accessKeys;
    }
  };

  const filteredKeys = getFilteredKeys();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PartyPopper className="w-8 h-8 text-yellow-400 animate-bounce" />
          <div>
            <h2 className="text-2xl font-bold gradient-text">Single-Use Access Key Generator</h2>
            <p className="text-white/70">Generate single-use access keys for event tickets 🎫</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-white/70">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-sm">Secure Admin Zone</span>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-500/20 border-green-400/30 text-green-300'
            : 'bg-red-500/20 border-red-400/30 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-effect rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white">Admin Verification</h3>
              <p className="text-slate-400">Enter admin password to proceed</p>
            </div>
            
            <div className="relative mb-6">
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin password"
                className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && validateAdminPassword()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setAdminPassword('');
                }}
                className="flex-1 btn-secondary py-2"
              >
                Cancel
              </button>
              <button
                onClick={validateAdminPassword}
                className="flex-1 btn-primary py-2"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-effect rounded-lg p-6 border border-purple-400/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-semibold gradient-text mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
            Generate New Access Key ✨
          </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/70 mb-2">Event: <span className="text-white font-medium">{eventDetails?.eventName || 'Loading...'}</span></p>
              <p className="text-white/70 text-sm">Each key is single-use only and automatically inherits event details</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Generated Key Code</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newKeyForm.keyCode}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white font-mono text-center"
                    placeholder="Click generate to create key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordPrompt(true)}
                    className="btn-admin px-4 py-3 flex items-center space-x-2"
                    title="Generate new single-use access key"
                  >
                    <Key className="w-4 h-4" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  value={newKeyForm.expiresAt}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-400 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading || !newKeyForm.keyCode}
              className="btn-primary px-8 py-3 flex items-center space-x-2 disabled:opacity-50"
            >
              <Key className="w-5 h-5" />
              <span>Create Single-Use Access Key</span>
            </button>
          </div>
        </form>
        </div>
      </div>

      <div className="glass-effect rounded-lg p-6 border border-cyan-400/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold gradient-text flex items-center">
              <Key className="w-5 h-5 mr-2 text-cyan-400" />
              Existing Access Keys ({filteredKeys.length})
            </h3>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-white/70" />
              <div className="flex bg-white/5 rounded-lg p-1">
                {[
                  { key: 'all', label: 'All', count: accessKeys.length },
                  { key: 'used', label: 'Used', count: accessKeys.filter(k => (k.usedCount || 0) > 0).length },
                  { key: 'unused', label: 'Unused', count: accessKeys.filter(k => (k.usedCount || 0) === 0).length }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterUsed(filter.key)}
                    className={`px-3 py-1 rounded text-sm transition-all ${
                      filterUsed === filter.key
                        ? 'bg-purple-500/50 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Loading access keys...</p>
          </div>
        ) : accessKeys.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No access keys generated yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredKeys.map((key) => (
              <div
                key={key.firebaseKey}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{key.keyName}</h4>
                    <p className="text-slate-400 text-sm">
                      Created by {key.createdBy} • {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      key.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {key.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-6 gap-4 mb-3">
                  <div>
                    <p className="text-slate-400 text-sm">Key Code</p>
                    <div className="flex items-center space-x-6">
                      <code className="text-blue-300 font-mono bg-blue-900/20 px-4 py-1 rounded">
                        {key.keyCode}
                      </code>
                      <button
                        onClick={() => copyToClipboard(key.keyCode, key.firebaseKey)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {copying === key.firebaseKey ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 md:col-span-2"> 
                    <p className="text-slate-400 text-sm">Usage</p>
                    <p className="text-white">{key.usedCount || 0} / {key.maxUses}</p>
                  </div>

                  {key.expiresAt && (
                    <div>
                      <p className="text-slate-400 text-sm">Expires</p>
                      <p className="text-white">{new Date(key.expiresAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {key.description && (
                  <p className="text-slate-400 text-sm">{key.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default TicketKeyGenerator;