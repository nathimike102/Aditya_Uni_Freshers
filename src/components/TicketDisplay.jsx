import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, Calendar, MapPin, Clock, User } from 'lucide-react';

const TicketDisplay = ({ tickets, onScanTicket, onBackToPurchase }) => {
  const [qrCodes, setQrCodes] = useState({});

  useEffect(() => {
    const generateQRCodes = async () => {
      const codes = {};
      for (const ticket of tickets) {
        try {
          const qrDataURL = await QRCode.toDataURL(ticket.qrData, {
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

  const shareTicket = async (ticket) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aditya University Freshers Welcome 2025',
          text: `My ticket for the Freshers Welcome event! Ticket ID: ${ticket.id.substring(0, 8)}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying ticket info
      navigator.clipboard.writeText(`Aditya University Freshers Welcome 2025 - Ticket ID: ${ticket.id}`);
      alert('Ticket info copied to clipboard!');
    }
  };

  const downloadTicket = (ticket) => {
    const ticketElement = document.getElementById(`ticket-${ticket.id}`);
    // In a real app, you'd use html2canvas or similar to convert to image
    alert('Download feature would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">Your Tickets</h1>
          <p className="text-xl opacity-90">Save these to your phone and present at the event</p>
        </div>

        <div className="space-y-6">
          {tickets.map((ticket, index) => (
            <div
              key={ticket.id}
              id={`ticket-${ticket.id}`}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Ticket Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Aditya University</h2>
                    <p className="text-blue-100">International Students Community</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-sm">Ticket #{index + 1}</p>
                    <p className="text-xs text-blue-200">ID: {ticket.id.substring(0, 8)}</p>
                  </div>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Event Details */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-3xl font-bold text-gray-800 mb-4">
                      Freshers Welcome 2025
                    </h3>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Attendee</p>
                          <p className="font-semibold text-gray-800">{ticket.userName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-semibold text-gray-800">February 15, 2025</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="font-semibold text-gray-800">6:00 PM - 10:00 PM</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Venue</p>
                          <p className="font-semibold text-gray-800">Main Auditorium</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Present this QR code at the entrance</li>
                        <li>• Arrive 30 minutes before the event</li>
                        <li>• Ticket expires after scanning</li>
                        <li>• Smart casual dress code</li>
                      </ul>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="text-center">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {qrCodes[ticket.id] ? (
                        <img
                          src={qrCodes[ticket.id]}
                          alt="QR Code"
                          className="mx-auto mb-2"
                        />
                      ) : (
                        <div className="w-[200px] h-[200px] bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <p className="text-gray-500">Generating QR...</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">Scan to enter event</p>
                    </div>
                  </div>
                </div>

                {/* Ticket Actions */}
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => shareTicket(ticket)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  
                  <button
                    onClick={() => downloadTicket(ticket)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mt-8 justify-center">
          <button
            onClick={onBackToPurchase}
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Purchase More Tickets
          </button>
          
          <button
            onClick={onScanTicket}
            className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Scan QR Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDisplay;