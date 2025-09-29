import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { Ticket, Users, CreditCard } from 'lucide-react';

const TicketPurchase = ({ user, userName, onTicketPurchased }) => {
  const [ticketCount, setTicketCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async () => {
    setLoading(true);
    setError('');

    try {
      const tickets = [];
      
      for (let i = 0; i < ticketCount; i++) {
        const ticketId = uuidv4();
        const ticket = {
          id: ticketId,
          userId: user.uid,
          userName: userName,
          eventName: 'Aditya University Freshers Welcome 2025',
          purchaseDate: new Date().toISOString(),
          isScanned: false,
          isExpired: false,
          qrData: ticketId
        };

        const docRef = await addDoc(collection(db, 'tickets'), ticket);
        tickets.push({ ...ticket, docId: docRef.id });
      }

      onTicketPurchased(tickets);
    } catch (error) {
      setError('Failed to purchase tickets. Please try again.');
      console.error('Error purchasing tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">Welcome to Aditya University!</h1>
          <p className="text-xl opacity-90">International Students Freshers Welcome Event 2025</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <Ticket className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Purchase Your Tickets</h2>
            <p className="text-gray-600">Join us for an amazing welcome celebration!</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-yellow-50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h3>
            <div className="grid md:grid-cols-2 gap-4 text-gray-700">
              <div>
                <p><strong>Event:</strong> Freshers Welcome 2025</p>
                <p><strong>Date:</strong> February 15, 2025</p>
                <p><strong>Time:</strong> 6:00 PM - 10:00 PM</p>
              </div>
              <div>
                <p><strong>Venue:</strong> University Main Auditorium</p>
                <p><strong>Dress Code:</strong> Smart Casual</p>
                <p><strong>Price:</strong> Free for All Students</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Users className="w-6 h-6 text-blue-600" />
              <label className="text-lg font-medium text-gray-700">Number of Tickets:</label>
              <select
                value={ticketCount}
                onChange={(e) => setTicketCount(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Tickets:</span>
                <span className="text-xl font-bold text-blue-600">{ticketCount}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-medium">Total Amount:</span>
                <span className="text-xl font-bold text-green-600">FREE</span>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-center">{error}</p>
            )}

            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Get Your Tickets</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPurchase;