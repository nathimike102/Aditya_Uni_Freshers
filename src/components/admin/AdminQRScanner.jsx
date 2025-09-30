import React, { useState, useEffect, useRef } from 'react';
import { Camera, QrCode, CheckCircle, XCircle, Clock, User, MapPin, Scan, X } from 'lucide-react';
import { realtimeDB } from '../../firebase';
import jsQR from 'jsqr';

const AdminQRScanner = ({ adminEmail }) => {
  const [scanning, setScanning] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [eventTiming, setEventTiming] = useState(null);
  const [cameraMode, setCameraMode] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    loadEventDetails();
    loadRecentScans();
    
    return () => {
      stopCamera();
    };
  }, []);

  const loadEventDetails = async () => {
    try {
      const details = await realtimeDB.admin.getEventDetails();
      if (details) {
        setEventTiming(details);
      }
    } catch (error) {

    }
  };

  const loadRecentScans = async () => {
    try {
      const allTickets = await realtimeDB.admin.getAllTickets();
      const scannedTickets = allTickets
        .filter(ticket => ticket.isScanned)
        .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))
        .slice(0, 10);
      setRecentScans(scannedTickets);
    } catch (error) {

    }
  };

  const isEventTime = () => {
    if (!eventTiming?.eventDate || !eventTiming?.eventTime) return true;

    const now = new Date();
    const eventDate = eventTiming.eventDate;
    return true;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setCameraMode(true);
      setScanning(true);
      
      scanIntervalRef.current = setInterval(scanQRFromCamera, 100);
      
    } catch (error) {
      setScanResult({
        type: 'error',
        message: 'Camera access denied or not available'
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setCameraMode(false);
    setScanning(false);
  };

  const scanQRFromCamera = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0);

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);

      if (code) {
        const ticketData = code.data;
        setTicketId(ticketData);
        stopCamera();
        handleScan(ticketData);
      }
    } catch (error) {
    }
  };

  const handleScan = async (scannedTicketId = null) => {
    const targetTicketId = scannedTicketId || ticketId;
    
    if (!targetTicketId.trim()) {
      setScanResult({ type: 'error', message: 'Please enter a ticket ID or scan QR code' });
      return;
    }

    if (!isEventTime()) {
      setScanResult({ 
        type: 'error', 
        message: 'Ticket scanning is only available during event hours' 
      });
      return;
    }

    setLoading(true);
    setScanResult(null);

    try {
      const result = await realtimeDB.admin.scanTicket(targetTicketId, {
        adminEmail,
        location: 'Main Entrance',
        timestamp: new Date().toISOString()
      });

      setScanResult({
        type: 'success',
        message: 'Ticket scanned successfully!',
        ticket: result
      });
      
      await loadRecentScans();
      setTicketId('');
      
    } catch (error) {
      setScanResult({
        type: 'error',
        message: error.message || 'Failed to scan ticket'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <QrCode className="w-8 h-8 text-cyan-400 animate-bounce" />
          <div>
            <h2 className="text-2xl font-bold gradient-text">Ticket Scanner</h2>
            <p className="text-white/70">Scan and validate event tickets 📱</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-white/70">
          <Clock className="w-4 h-4 text-green-400" />
          <span className="text-sm">
            {isEventTime() ? '🟢 Event Active' : '🟡 Outside Event Hours'}
          </span>
        </div>
      </div>

      <div className="glass-effect rounded-lg p-4 border border-green-400/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-cyan-500/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${isEventTime() ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span className="text-white font-medium">
                🎉 {eventTiming?.eventName || 'Event'} - {eventTiming?.eventDate}
              </span>
            </div>
            <span className="text-white/70 text-sm">⏰ {eventTiming?.eventTime}</span>
          </div>
        </div>
      </div>

      <div className="glass-effect rounded-lg p-6 border border-purple-400/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="text-center mb-6">
            <QrCode className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-float" />
            <h3 className="text-xl font-semibold gradient-text">Scan Ticket ✨</h3>
            <p className="text-white/70">Enter ticket ID or scan QR code 📸</p>
          </div>

          <div className="space-y-4">
          {cameraMode ? (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full max-w-md mx-auto rounded-lg border-2 border-purple-400/50"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-cyan-400/50 rounded-lg animate-pulse pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-48 h-48 border-2 border-white/50 rounded-lg border-dashed animate-bounce"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={stopCamera}
                  className="glass-effect px-4 py-2 rounded-lg border border-red-400/30 text-red-400 hover:bg-red-400/20 transition-all flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Stop Camera</span>
                </button>
                {scanning && (
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                    <span className="text-sm">Scanning for QR codes...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value.toLowerCase())}
                  placeholder="Enter Ticket ID (e.g., ABC123DEF456)"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 font-mono focus:border-blue-400 transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                />
                <button
                  onClick={() => handleScan()}
                  disabled={loading || !ticketId.trim()}
                  className="btn-primary px-6 py-3 flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Scan className="w-5 h-5" />
                  )}
                  <span>Scan</span>
                </button>
              </div>
              
              <div className="text-center">
                <div className="text-white/50 text-sm mb-3">OR</div>
                <button
                  onClick={startCamera}
                  className="glass-effect px-6 py-3 rounded-lg border border-purple-400/30 text-purple-400 hover:bg-purple-400/20 transition-all flex items-center space-x-2 mx-auto"
                >
                  <Camera className="w-5 h-5" />
                  <span>Use Camera to Scan QR</span>
                </button>
              </div>
            </div>
          )}
          {scanResult && (
            <div className={`p-4 rounded-lg border ${
              scanResult.type === 'success'
                ? 'bg-green-500/20 border-green-400/30'
                : 'bg-red-500/20 border-red-400/30'
            }`}>
              <div className="flex items-center space-x-3 mb-3">
                {scanResult.type === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
                <span className={`font-medium ${
                  scanResult.type === 'success' ? 'text-green-300' : 'text-red-300'
                }`}>
                  {scanResult.message}
                </span>
              </div>

              {scanResult.ticket && (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-300">
                      <User className="w-4 h-4 inline mr-2" />
                      {scanResult.ticket.userName}
                    </p>
                    <p className="text-slate-300">
                      <QrCode className="w-4 h-4 inline mr-2" />
                      {scanResult.ticket.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-300">
                      <Clock className="w-4 h-4 inline mr-2" />
                      {formatDateTime(scanResult.ticket.scannedAt)}
                    </p>
                    <p className="text-slate-300">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      {scanResult.ticket.scanLocation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      <div className="glass-effect rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
          Recent Scans ({recentScans.length})
        </h3>

        {recentScans.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tickets scanned yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentScans.map((ticket, index) => (
              <div
                key={`${ticket.userId}-${ticket.id}-${index}`}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">{ticket.userName}</p>
                      <p className="text-slate-400 text-sm font-mono">{ticket.id.substring(0, 12)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300 text-sm">{formatDateTime(ticket.scannedAt)}</p>
                    <p className="text-slate-400 text-xs">by {ticket.scannedBy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-effect rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{recentScans.length}</div>
          <div className="text-slate-400 text-sm">Tickets Scanned</div>
        </div>
        <div className="glass-effect rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {isEventTime() ? 'ACTIVE' : 'PAUSED'}
          </div>
          <div className="text-slate-400 text-sm">Scanner Status</div>
        </div>
        <div className="glass-effect rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{adminEmail.split('@')[0]}</div>
          <div className="text-slate-400 text-sm">Scanner Operator</div>
        </div>
      </div>
    </div>
  );
};

export default AdminQRScanner;