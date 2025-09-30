import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, DollarSign, Save, RefreshCw, Edit3, PartyPopper, Sparkles } from 'lucide-react';
import { realtimeDB } from '../../firebase';

const EventManager = () => {
  const [eventDetails, setEventDetails] = useState({
    eventName: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    price: '',
    currency: 'INR',
    description: '',
    dressCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' }
  ];

  useEffect(() => {
    loadEventDetails();
  }, []);

  const loadEventDetails = async () => {
    setLoading(true);
    try {
      const details = await realtimeDB.admin.getEventDetails();
      if (details) {
        const processedDetails = { ...details };
        
        if (details.eventTime && !details.startTime && !details.endTime) {
          const timeRange = details.eventTime.split(' - ');
          if (timeRange.length === 2) {
            processedDetails.startTime = convertTo24Hour(timeRange[0].trim());
            processedDetails.endTime = convertTo24Hour(timeRange[1].trim());
          }
        }
        if (details.price && typeof details.price === 'string') {
          const priceMatch = details.price.match(/[\d.]+/);
          if (priceMatch) {
            processedDetails.price = priceMatch[0];
          }
        }
        
        setEventDetails(processedDetails);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load event details' });
    } finally {
      setLoading(false);
    }
  };

  const convertTo24Hour = (time12h) => {
    try {
      const [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      
      if (modifier === 'AM') {
        if (hours === 12) {
          hours = 0;
        }
      } else if (modifier === 'PM') {
        if (hours !== 12) {
          hours += 12;
        }
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } catch (error) {
      console.warn('Error converting time:', time12h, error);
      return time12h;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { auth } = await import('../../firebase');
      const currentUser = auth.currentUser;
      console.log('Current user:', currentUser?.email);
      console.log('User authenticated:', !!currentUser);
      
      const eventTime = `${eventDetails.startTime} - ${eventDetails.endTime}`;
      const currency = currencies.find(c => c.code === eventDetails.currency);
      const formattedPrice = `${currency.symbol}${eventDetails.price}`;
      
      const updatedDetails = {
        ...eventDetails,
        eventTime,
        price: formattedPrice
      };
      
      console.log('Updating event details with:', updatedDetails);
      await realtimeDB.admin.updateEventDetails(updatedDetails);
      setMessage({ type: 'success', text: '🎉 Event details updated successfully!' });
    } catch (error) {
      console.error('Error updating event details:', error);
      setMessage({ type: 'error', text: `Failed to update event details: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEventDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PartyPopper className="w-8 h-8 text-purple-400 animate-bounce" />
          <div>
            <h2 className="text-2xl font-bold gradient-text">Event Manager</h2>
            <p className="text-white/70">Update and manage event details ✨</p>
          </div>
        </div>
        <button
          onClick={loadEventDetails}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">
              <Edit3 className="w-4 h-4 inline mr-2" />
              Event Name
            </label>
            <input
              type="text"
              value={eventDetails.eventName}
              onChange={(e) => handleInputChange('eventName', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/20 focus:border-blue-400 transition-all"
              placeholder="Enter event name"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              <Calendar className="w-4 h-4 inline mr-2 text-purple-400" />
              Event Date
            </label>
            <input
              type="date"
              value={eventDetails.eventDate}
              onChange={(e) => handleInputChange('eventDate', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-sm focus:bg-white/20 focus:border-purple-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              <Clock className="w-4 h-4 inline mr-2 text-cyan-400" />
              Start Time
            </label>
            <input
              type="time"
              value={eventDetails.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-sm focus:bg-white/20 focus:border-cyan-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              <Clock className="w-4 h-4 inline mr-2 text-pink-400" />
              End Time
            </label>
            <input
              type="time"
              value={eventDetails.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              <MapPin className="w-4 h-4 inline mr-2 text-green-400" />
              Venue
            </label>
            <input
              type="text"
              value={eventDetails.venue}
              onChange={(e) => handleInputChange('venue', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/20 focus:border-green-400 transition-all"
              placeholder="e.g., Mysterious Location 🎭"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              <DollarSign className="w-4 h-4 inline mr-2 text-yellow-400" />
              Currency
            </label>
            <select
              value={eventDetails.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-sm focus:bg-white/20 focus:border-yellow-400 transition-all"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code} className="bg-slate-800">
                  {currency.symbol} {currency.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              <Sparkles className="w-4 h-4 inline mr-2 text-orange-400" />
              Ticket Price
            </label>
            <div className="flex space-x-2">
              <div className="w-16 px-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white text-center font-bold">
                {currencies.find(c => c.code === eventDetails.currency)?.symbol}
              </div>
              <input
                type="number"
                value={eventDetails.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/20 focus:border-orange-400 transition-all"
                placeholder="300"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              <Sparkles className="w-4 h-4 inline mr-2 text-pink-400" />
              Dress Code
            </label>
            <input
              type="text"
              value={eventDetails.dressCode}
              onChange={(e) => handleInputChange('dressCode', e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/20 focus:border-pink-400 transition-all"
              placeholder="e.g., Smart Casual, Formal, Party Attire"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-white font-medium mb-2">
              Event Description
            </label>
            <textarea
              value={eventDetails.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows="4"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 backdrop-blur-sm focus:bg-white/20 focus:border-blue-400 transition-all resize-none"
              placeholder="Enter event description and details..."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-8 py-3 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Event Details</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="glass-effect rounded-lg p-6 border border-purple-400/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 animate-pulse"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-semibold gradient-text mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
            Event Preview ✨
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-white/90">
            <div className="space-y-2">
              <p><strong className="text-purple-300">Event:</strong> {eventDetails.eventName || 'Freshers Welcome 2025'}</p>
              <p><strong className="text-purple-300">Date:</strong> {eventDetails.eventDate || 'Thursday, October 2, 2025'}</p>
              <p><strong className="text-cyan-300">Time:</strong> {eventDetails.startTime && eventDetails.endTime ? `${eventDetails.startTime} - ${eventDetails.endTime}` : '12:00 PM - 6:00 PM'}</p>
            </div>
            <div className="space-y-2">
              <p><strong className="text-green-300">Venue:</strong> {eventDetails.venue || 'Mysterious Location 🎭'}</p>
              <p><strong className="text-orange-300">Price:</strong> {eventDetails.price ? `${currencies.find(c => c.code === eventDetails.currency)?.symbol}${eventDetails.price}` : '₹300'}</p>
              <p><strong className="text-pink-300">Dress Code:</strong> {eventDetails.dressCode || 'Smart Casual'}</p>
            </div>
            <div className="md:col-span-2 mt-4">
              <p><strong className="text-pink-300">Description:</strong></p>
              <p className="text-white/70 mt-1">{eventDetails.description || "Join us for an unforgettable Freshers' Party! Dance, music, games, and lots of fun await you. Don't miss this amazing opportunity to connect with your fellow classmates and create memories that will last a lifetime."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManager;