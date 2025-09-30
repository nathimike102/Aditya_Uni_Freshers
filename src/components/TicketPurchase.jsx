import React, { useState, useEffect } from 'react';
import { realtimeDB } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { Ticket, PartyPopper, Sparkles } from 'lucide-react';
import Logger from '../utils/logger';

const TicketPurchase = ({ user, userName, onTicketPurchased }) => {
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventDetails, setEventDetails] = useState(null);

  useEffect(() => {
    loadEventDetails();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadEventDetails = async () => {
    try {
      const details = await realtimeDB.admin.getEventDetails();
      setEventDetails(details);
    } catch (error) {

      setEventDetails({
        eventName: 'Freshers Welcome 2025',
        eventDate: 'Thursday, October 2, 2025',
        eventTime: '12:00 PM - 6:00 PM',
        venue: 'Mysterious Location 🎭',
        price: '₹300',
        dressCode: 'Smart Casual',
        description: "Join us for an unforgettable Freshers' Party! Dance, music, games, and lots of fun await you. Don't miss this amazing opportunity to connect with your fellow classmates and create memories that will last a lifetime."
      });
    }
  };

  const handleGetTicket = async () => {
    if (!accessKey.trim()) {
      setError('Please enter the access key provided to you.');
      return;
    }

    if (accessKey.trim().length < 8) {
      setError('Access key must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const keyValidation = await realtimeDB.admin.validateAndUseAccessKey(
        accessKey.trim().toUpperCase(),
        user.uid
      );

      Logger.debug('Key validation successful:', keyValidation);
    } catch (keyError) {
      Logger.error('Key validation failed:', keyError);
      let errorMessage = keyError.message;
      
      if (errorMessage.includes('Invalid or inactive')) {
        errorMessage = 'Invalid access key. Please check and try again.';
      } else if (errorMessage.includes('already used')) {
        errorMessage = 'You have already used this access key.';
      } else if (errorMessage.includes('expired')) {
        errorMessage = 'This access key has expired.';
      } else if (errorMessage.includes('maximum usage')) {
        errorMessage = 'This access key has been used by someone else.';
      }
      
      setError(errorMessage);
      setLoading(false);
      return;
    }

    try {
      const existingTickets = await realtimeDB.getTickets(user.uid);
      if (existingTickets.length > 0) {
        setError('You have already received your ticket for this event.');
        setLoading(false);
        return;
      }

      const ticketId = uuidv4();
      const ticket = {
        id: ticketId,
        userId: user.uid,
        userName: userName,
        eventName: eventDetails?.eventName || 'Aditya University Freshers Welcome 2025',
        eventDate: eventDetails?.eventDate || 'Thursday, October 2, 2025',
        eventTime: eventDetails?.eventTime || '12:00 PM - 6:00 PM',
        venue: eventDetails?.venue || 'Mysterious Location',
        price: eventDetails?.price || '₹300',
        purchaseDate: new Date().toISOString(),
        isScanned: false,
        isExpired: false,
        qrData: ticketId,
        accessKey: accessKey.trim().toUpperCase()
      };

      const savedTicket = await realtimeDB.saveTicket(user.uid, ticket);
      
      onTicketPurchased([savedTicket]);
    } catch (error) {
      setError('Failed to get your ticket. Please try again.');

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="relative inline-block p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-glow mb-6">
            <PartyPopper className="w-12 h-12 text-white animate-bounce" />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-sparkle" />
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-4 animate-slide-right">Welcome to Aditya University! 🎉</h1>
          <p className="text-2xl text-white/90 animate-fade-in">Get Your Freshers Welcome Event 2025 Ticket ✨</p>
        </div>

        <div className="glass-effect rounded-3xl shadow-2xl p-10 animate-slide-right backdrop-blur-xl border border-purple-400/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 animate-pulse"></div>
          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full animate-spin"></div>
                <div className="relative bg-white rounded-full w-16 h-16 flex items-center justify-center">
                  <Ticket className="w-8 h-8 text-orange-500 animate-bounce" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-sparkle" />
              </div>
              <h2 className="text-4xl font-bold gradient-text mb-3">Get Your Ticket ✨</h2>
              <p className="text-white/80 text-lg">Enter the access key provided to you to get your event ticket! 🎫</p>
            </div>

            <div className="glass-effect rounded-2xl p-8 mb-10 border border-purple-400/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 animate-pulse"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-semibold gradient-text mb-6 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 animate-spin" />
                  Event Details ✨
                </h3>
                <div className="grid md:grid-cols-2 gap-6 text-white/90">
                  <div className="space-y-3">
                    <p className="flex items-center"><strong className="text-purple-300 mr-2">Event:</strong> {eventDetails?.eventName || 'Loading...'}</p>
                    <p className="flex items-center"><strong className="text-purple-300 mr-2">Date:</strong> {eventDetails?.eventDate || 'Loading...'}</p>
                    <p className="flex items-center"><strong className="text-cyan-300 mr-2">Time:</strong> {eventDetails?.eventTime || 'Loading...'}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="flex items-center"><strong className="text-green-300 mr-2">Venue:</strong> {eventDetails?.venue || 'Loading...'} 🎭</p>
                    <p className="flex items-center"><strong className="text-yellow-300 mr-2">Dress Code:</strong> Smart Casual ✨</p>
                    <p className="flex items-center"><strong className="text-orange-300 mr-2">Price:</strong> {eventDetails?.price || 'Loading...'}</p>
                  </div>
                </div>
              </div>
            </div>

          <div className="space-y-8">
            <div className="glass-effect rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-white mb-2 gradient-text">Access Key Required</h3>
                <p className="text-white/70">Enter the single-use access key provided to you</p>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter your access key (e.g., ABC123XYZ456)"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                  className="w-full px-6 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 text-center text-xl font-mono font-semibold backdrop-blur-sm focus:bg-white/20 focus:border-purple-400 transition-all"
                  maxLength="50"
                />
                {accessKey && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className={`w-3 h-3 rounded-full ${accessKey.length >= 8 ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-white/20">
              <div className="text-center">
                <div className="flex justify-center items-center mb-4">
                  <Ticket className="w-8 h-8 text-purple-400 mr-3" />
                  <span className="text-2xl font-medium text-white">Your Ticket</span>
                </div>
                <div className="space-y-2">
                  <p className="text-white/80">One ticket per student</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">₹300 INR</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 animate-fade-in">
                <p className="text-red-200 text-center text-lg">{error}</p>
              </div>
            )}

            <button
              onClick={handleGetTicket}
              disabled={loading}
              className="btn-primary w-full py-5 text-xl font-bold flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-300"
            >
              {loading ? (
                <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Ticket className="w-7 h-7" />
                  <span>Get My Ticket! �️</span>
                </>
              )}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPurchase;