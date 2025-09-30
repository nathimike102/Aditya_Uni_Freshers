import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Check,
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  PartyPopper, 
  Sparkles, 
  ExternalLink, 
  Shield,
  AlertTriangle,
  Loader
} from 'lucide-react';
import { realtimeDB } from '../firebase';

const TicketVerification = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventDetails, setEventDetails] = useState(null);

  useEffect(() => {
    if (ticketId) {
      verifyTicket();
      loadEventDetails();
    }
  }, [ticketId]);

  const loadEventDetails = async () => {
    try {
      const details = await realtimeDB.admin.getEventDetails();
      setEventDetails(details);
    } catch (error) {
      console.error('Error loading event details:', error);
    }
  };

  const verifyTicket = async () => {
    setLoading(true);
    setError('');

    try {
      const allTickets = await realtimeDB.admin.getAllTickets();
      const foundTicket = allTickets.find(t => t.id === ticketId);

      if (!foundTicket) {
        setError('Ticket not found. Please verify the ticket ID.');
        return;
      }

      setTicket(foundTicket);
    } catch (error) {
      console.error('Error verifying ticket:', error);
      setError('Failed to verify ticket. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getTicketStatus = () => {
    if (!ticket) return null;
    
    if (ticket.isScanned) {
      return {
        status: 'scanned',
        icon: Check,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-400/30',
        message: 'This ticket has been scanned and is valid for entry.'
      };
    }
    
    return {
      status: 'valid',
      icon: Shield,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/30',
      message: 'This ticket is valid and ready for scanning at the event.'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Verifying ticket...</p>
          <p className="text-slate-400 mt-2">Please wait while we check your ticket</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-effect rounded-2xl p-8 text-center border border-red-400/30">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Verification Failed</h1>
          <p className="text-red-200 mb-6">{error}</p>
          <button 
            onClick={verifyTicket}
            className="btn-primary w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const ticketStatus = getTicketStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-glow">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-30 animate-pulse"></div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Ticket Verification</h1>
          <p className="text-xl text-white/80">Official Aditya University Event Ticket</p>
        </div>

        {/* Ticket Status */}
        <div className={`glass-effect rounded-2xl p-6 mb-8 border ${ticketStatus.borderColor} ${ticketStatus.bgColor}`}>
          <div className="flex items-center justify-center space-x-4">
            <ticketStatus.icon className={`w-8 h-8 ${ticketStatus.color}`} />
            <div className="text-center">
              <h2 className={`text-2xl font-bold ${ticketStatus.color}`}>
                {ticketStatus.status === 'scanned' ? 'Ticket Scanned' : 'Valid Ticket'}
              </h2>
              <p className="text-white/80 mt-2">{ticketStatus.message}</p>
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="glass-effect rounded-2xl overflow-hidden border border-white/20">
          {/* Event Header */}
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 p-8 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold mb-1">Aditya University</h2>
                <p className="text-white/80">International Students Community</p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-lg">Official Ticket</p>
                <p className="text-xs text-white/60">ID: {ticket.id.substring(0, 8)}</p>
              </div>
            </div>
          </div>

          {/* Ticket Content */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Event Information */}
              <div className="space-y-6">
                <h3 className="text-3xl font-bold gradient-text mb-6 flex items-center">
                  <PartyPopper className="w-8 h-8 mr-3 animate-bounce" />
                  {eventDetails?.eventName || ticket.eventName || 'Freshers Welcome 2025'} ✨
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <User className="w-6 h-6 text-purple-400" />
                    <div>
                      <p className="text-base text-white/70">Attendee</p>
                      <p className="font-semibold text-white text-lg">{ticket.userName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Calendar className="w-6 h-6 text-pink-400" />
                    <div>
                      <p className="text-base text-white/70">Date</p>
                      <p className="font-semibold text-white text-lg">
                        {formatDate(eventDetails?.eventDate || ticket.eventDate || 'Thursday, October 2, 2025')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Clock className="w-6 h-6 text-cyan-400" />
                    <div>
                      <p className="text-base text-white/70">Time</p>
                      <p className="font-semibold text-white text-lg">
                        {eventDetails?.eventTime || ticket.eventTime || '12:00 PM - 6:00 PM'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <MapPin className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-base text-white/70">Venue</p>
                      <p className="font-semibold text-white text-lg">
                        {eventDetails?.venue || ticket.venue || 'Aditya University Campus'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Purchase Information */}
                <div className="glass-effect border border-purple-300/30 rounded-xl p-4 mt-6">
                  <h4 className="font-semibold text-purple-300 mb-3">Purchase Details</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-white/70">
                      Purchased: {new Date(ticket.purchaseDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-white/70">
                      Price: {eventDetails?.price || ticket.price || '₹300 INR'}
                    </p>
                    <p className="text-white/70">
                      Status: <span className={ticketStatus.color}>{ticketStatus.status.toUpperCase()}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="text-center">
                <div className="glass-effect p-6 rounded-xl border border-white/20">
                  <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center mx-auto mb-4">
                    <div className="text-center p-4">
                      <Shield className="w-16 h-16 text-slate-700 mx-auto mb-2" />
                      <p className="text-slate-700 text-sm font-semibold">QR Code Available</p>
                      <p className="text-slate-600 text-xs">In Official App</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/60">
                    Use the official app to display the scannable QR code
                  </p>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  <a
                    href={`${window.location.origin}`}
                    className="btn-primary inline-flex items-center space-x-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Open Official App</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="glass-effect border border-purple-300/30 rounded-xl p-6 mt-8">
              <h4 className="font-semibold text-purple-300 mb-4 flex items-center">
                <PartyPopper className="w-5 h-5 mr-2" />
                Event Description
                <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
              </h4>
              <p className="text-gray-300 leading-relaxed">
                {eventDetails?.description || 
                 "Join us for an unforgettable Freshers' Party! Dance, music, games, and lots of fun await you. Don't miss this amazing opportunity to connect with your fellow classmates and create memories that will last a lifetime."}
              </p>
            </div>

            {/* Important Notes */}
            <div className="glass-effect border border-yellow-300/30 rounded-xl p-6 mt-6">
              <h4 className="font-semibold text-yellow-200 mb-3">Important Notes:</h4>
              <ul className="text-yellow-100 space-y-2">
                <li>• This ticket is verified and authentic</li>
                <li>• Present the QR code from the official app at the entrance</li>
                <li>• Arrive 30 minutes before the event starts</li>
                <li>• {eventDetails?.dressCode || 'Smart Casual'} dress code applies</li>
                <li>• Ticket cannot be transferred after scanning</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/60">
          <p className="mb-2">© 2025 Aditya University - Official Event Ticketing System</p>
          <p className="text-sm">For support, contact the event organizers</p>
        </div>
      </div>
    </div>
  );
};

export default TicketVerification;