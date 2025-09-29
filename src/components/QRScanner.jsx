import React, { useState, useRef, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Camera, CircleCheck as CheckCircle, Circle as XCircle, ArrowLeft } from 'lucide-react';

const QRScanner = ({ onBack }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setScanning(true);
      scanFrame();
    } catch (error) {
      setMessage('Camera access denied or not available');
      setMessageType('error');
    }
  };

  const stopScanning = () => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const scanFrame = () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple QR detection simulation - in a real app, use jsQR or similar
      // For demo purposes, we'll check if user manually enters ticket ID
    }

    if (scanning) {
      requestAnimationFrame(scanFrame);
    }
  };

  const verifyTicket = async (ticketId) => {
    setLoading(true);
    setMessage('');
    
    try {
      // In a real implementation, you'd query Firestore to find the ticket
      // For this demo, we'll simulate the verification process
      
      // Simulate finding ticket by ID
      const ticketQuery = {
        id: ticketId,
        isScanned: false,
        isExpired: false,
        eventName: 'Aditya University Freshers Welcome 2025'
      };

      if (ticketQuery.isExpired) {
        setMessage('This ticket has already been used and is expired.');
        setMessageType('error');
        return;
      }

      if (ticketQuery.isScanned) {
        setMessage('This ticket has already been scanned.');
        setMessageType('error');
        return;
      }

      // Mark ticket as scanned and expired
      // await updateDoc(doc(db, 'tickets', ticketDocId), {
      //   isScanned: true,
      //   isExpired: true,
      //   scannedAt: new Date().toISOString()
      // });

      setMessage(`Welcome to ${ticketQuery.eventName}! 
        
🎉 Entry Granted! 🎉

Thank you for joining us for this special welcome celebration for international students at Aditya University. 

Event Details:
📅 Date: February 15, 2025
⏰ Time: 6:00 PM - 10:00 PM  
📍 Venue: Main Auditorium

Please proceed to the registration desk to collect your welcome kit and event materials.

Have a wonderful time at the event!`);
      setMessageType('success');
      
      stopScanning();
    } catch (error) {
      setMessage('Error verifying ticket. Please try again.');
      setMessageType('error');
      console.error('Error verifying ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = () => {
    const ticketId = prompt('Enter ticket ID for verification:');
    if (ticketId) {
      verifyTicket(ticketId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">QR Code Scanner</h1>
          <p className="text-xl opacity-90">Scan tickets for event entry</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Tickets</span>
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Entry Verification</h2>
          </div>

          {/* Camera View */}
          <div className="relative bg-gray-100 rounded-xl overflow-hidden mb-6">
            {scanning ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-4 border-yellow-400 border-dashed animate-pulse"></div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
                  Position QR code within the frame
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Camera not active</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 justify-center">
              {!scanning ? (
                <button
                  onClick={startScanning}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  <span>Start Scanning</span>
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Stop Scanning</span>
                </button>
              )}
              
              <button
                onClick={handleManualInput}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
              >
                Manual Entry
              </button>
            </div>

            {loading && (
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-600 mt-2">Verifying ticket...</p>
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-lg ${
                messageType === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {messageType === 'success' ? (
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                  )}
                  <div className={`${
                    messageType === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    <pre className="whitespace-pre-wrap font-sans">{message}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;