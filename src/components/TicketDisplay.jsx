import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Share2, Calendar, MapPin, Clock, User, PartyPopper, Sparkles } from 'lucide-react';
import { realtimeDB } from '../firebase';
import ShareModal from './ShareModal';
import { generateTicketUrl } from '../utils/ticketUtils';

const TicketDisplay = ({ tickets, user, userName }) => {
  const [qrCodes, setQrCodes] = useState({});
  const [eventDetails, setEventDetails] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadEventDetails();
  }, []);

  const loadEventDetails = async () => {
    try {
      const details = await realtimeDB.admin.getEventDetails();
      setEventDetails(details);
    } catch (error) {

    }
  };

  useEffect(() => {
    const generateQRCodes = async () => {
      const codes = {};
      for (const ticket of tickets) {
        try {
          const ticketUrl = generateTicketUrl(ticket.id);
          
          const qrDataURL = await QRCode.toDataURL(ticketUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#1e3a8a',
              light: '#ffffff'
            }
          });
          codes[ticket.id] = qrDataURL;
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
      setQrCodes(codes);
    };

    generateQRCodes();
  }, [tickets]);

  const openShareModal = (ticket) => {
    setSelectedTicket(ticket);
    setShareModalOpen(true);
  };

  const closeShareModal = () => {
    setShareModalOpen(false);
    setSelectedTicket(null);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block relative mb-6">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || userName}
                className="w-24 h-24 rounded-full border-4 border-purple-400/50 animate-glow object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-24 h-24 p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-glow flex items-center justify-center ${user?.photoURL ? 'hidden' : 'flex'}`}>
              <User className="w-12 h-12 text-white animate-float" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-30 animate-pulse"></div>
          </div>
          <h1 className="text-5xl font-bold gradient-text mb-4 animate-slide-right">Your Event Ticket</h1>
          <p className="text-2xl text-white/90 animate-fade-in">Save this to your phone and present at the event</p>
        </div>

        <div className="space-y-8">
          {tickets.map((ticket, index) => (
            <div
              key={ticket.id}
              id={`ticket-${ticket.id}`}
              className="glass-effect rounded-3xl shadow-2xl overflow-hidden animate-fade-in backdrop-blur-xl"
            >
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 p-8 text-white animate-glow">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold gradient-text mb-1">Aditya University</h2>
                    <p className="text-white/80">International Students Community</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-lg">Ticket #{index + 1}</p>
                    <p className="text-xs text-white/60">ID: {ticket.id.substring(0, 8)}</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    <h3 className="text-4xl font-bold gradient-text mb-6 flex items-center">
                      <PartyPopper className="w-8 h-8 mr-3 animate-bounce" />
                      {eventDetails?.eventName || ticket.eventName || 'Freshers Welcome 2025'} ✨
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {user?.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || userName}
                              className="w-10 h-10 rounded-full border-2 border-purple-400/50 animate-glow object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-glow ${user?.photoURL ? 'hidden' : 'flex'}`}>
                            <User className="w-6 h-6 text-white animate-float" />
                          </div>
                        </div>
                        <div>
                          <p className="text-base text-white/70">Attendee</p>
                          <p className="font-semibold text-white text-lg">{user?.displayName || ticket.userName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Calendar className="w-6 h-6 text-pink-400 animate-float" />
                        <div>
                          <p className="text-base text-white/70">Date</p>
                          <p className="font-semibold text-white text-lg">{eventDetails?.eventDate || ticket.eventDate || 'Thursday, October 2, 2025'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Clock className="w-6 h-6 text-cyan-400 animate-float" />
                        <div>
                          <p className="text-base text-white/70">Time</p>
                          <p className="font-semibold text-white text-lg">{eventDetails?.eventTime || ticket.eventTime || '12:00 PM - 6:00 PM'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <MapPin className="w-6 h-6 text-green-400 animate-float" />
                        <div>
                          <p className="text-base text-white/70">Venue</p>
                          <p className="font-semibold text-white text-lg">{eventDetails?.venue || ticket.venue || 'Mysterious Location'} 🎭</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-effect border border-orange-300/30 rounded-xl p-4 mt-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-yellow-500/10 animate-pulse"></div>
                      <div className="relative z-10 text-center">
                        <p className="text-orange-200 text-sm flex items-center justify-center">
                          <Sparkles className="w-4 h-4 mr-1 animate-spin" />
                          Ticket Price
                        </p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                          {eventDetails?.price || ticket.price || '₹300 INR'}
                        </p>
                      </div>
                    </div>

                    <div className="glass-effect border border-yellow-300/30 rounded-xl p-6 mt-6">
                      <h4 className="font-semibold text-yellow-200 mb-3 gradient-text">Important Notes:</h4>
                      <ul className="text-base text-yellow-100 space-y-2">
                        <li>• Present this QR code at the entrance</li>
                        <li>• Arrive 30 minutes before the event</li>
                        <li>• Ticket expires after scanning</li>
                        <li>• {eventDetails?.dressCode || 'Smart Casual'} dress code</li>
                      </ul>
                    </div>

                    <div className="glass-effect border border-purple-300/30 rounded-xl p-4 mt-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-pulse"></div>
                      <div className="relative z-10">
                        <h3 className="font-semibold text-purple-300 mb-2 flex items-center">
                          <PartyPopper className="w-5 h-5 mr-2 animate-bounce" />
                          Event Description
                          <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
                        </h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {eventDetails?.description || "Join us for an unforgettable Freshers' Party! Dance, music, games, and lots of fun await you. Don't miss this amazing opportunity to connect with your fellow classmates and create memories that will last a lifetime."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="glass-effect p-6 rounded-xl border border-white/20">
                      {qrCodes[ticket.id] ? (
                        <img
                          src={qrCodes[ticket.id]}
                          alt="QR Code"
                          className="mx-auto mb-3 animate-glow"
                        />
                      ) : (
                        <div className="w-[200px] h-[200px] bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 animate-pulse">
                          <p className="text-white/70">Generating QR...</p>
                        </div>
                      )}
                      <p className="text-sm text-white/60">Scan to enter event</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-white/20">
                  <button
                    onClick={() => openShareModal(ticket)}
                    className="btn-secondary flex items-center space-x-3 hover:scale-105 transition-transform"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Share & Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="glass-effect rounded-2xl p-8 border border-white/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold gradient-text mb-4 flex items-center justify-center">
                <PartyPopper className="w-6 h-6 mr-2 animate-bounce" />
                Your Event Ticket
                <Sparkles className="w-5 h-5 ml-2 animate-spin" />
              </h3>
              <p className="text-white/80 text-lg mb-4">
                🎉 You're all set for the {eventDetails?.eventName || 'Freshers Welcome 2025'}! 🎉
              </p>
              <div className="space-y-2 text-white/70">
                <p>✅ Present this QR code at the event entrance</p>
                <p>📱 Save this page or take a screenshot</p>
                <p>🎫 One ticket per student - Entry guaranteed!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Share Modal */}
        {shareModalOpen && selectedTicket && (
          <ShareModal
            isOpen={shareModalOpen}
            onClose={closeShareModal}
            ticket={selectedTicket}
            ticketElement={document.getElementById(`ticket-${selectedTicket.id}`)}
          />
        )}
      </div>
    </div>
  );
};

export default TicketDisplay;