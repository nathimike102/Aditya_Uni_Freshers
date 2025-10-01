import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [cameraStatus, setCameraStatus] = useState('');
  const [previewReady, setPreviewReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const scanningRef = useRef(false);
  const previewReadyRef = useRef(false);

  const loadEventDetails = async () => {
    try {
      const details = await realtimeDB.admin.getEventDetails();
      if (details) {
        setEventTiming(details);
      }
    } catch (error) {
      console.error('Failed to load event details', error);
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
      console.error('Failed to load recent scans', error);
    }
  };

  const isEventTime = () => {
    if (!eventTiming?.eventDate || !eventTiming?.eventTime) return true;

    return true;
  };

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.onloadeddata = null;
    }

    setCameraMode(false);
    setScanning(false);
    setCameraStatus('');
    setPreviewReady(false);
    scanningRef.current = false;
    previewReadyRef.current = false;
  }, []);

  useEffect(() => {
    loadEventDetails();
    loadRecentScans();
    
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const awaitVideoReady = (videoEl) => new Promise((resolve) => {
    if (!videoEl) {
      resolve();
      return;
    }

    const handleLoaded = () => {
      videoEl.removeEventListener('loadedmetadata', handleLoaded);
      resolve();
    };

    if (videoEl.readyState >= 1) {
      resolve();
    } else {
      videoEl.addEventListener('loadedmetadata', handleLoaded);
    }
  });

  const waitForVideoElement = useCallback(() => {
    return new Promise((resolve, reject) => {
      const maxWaitMs = 2000;
      const start = typeof performance !== 'undefined' ? performance.now() : Date.now();

      const poll = () => {
        const node = videoRef.current;
        if (node) {
          resolve(node);
          return;
        }

        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (now - start >= maxWaitMs) {
          reject(new Error('Unable to initialize camera preview.'));
          return;
        }

        requestAnimationFrame(poll);
      };

      poll();
    });
  }, []);

  const startCamera = async () => {
    try {
      stopCamera();
      setScanResult(null);
      setCameraStatus('Initializing camera…');
      setPreviewReady(false);
      scanningRef.current = false;
      previewReadyRef.current = false;

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      setCameraMode(true);
      setCameraStatus('Preparing camera preview…');

      const videoEl = await waitForVideoElement();

      videoEl.srcObject = stream;
      videoEl.muted = true;
      videoEl.autoplay = true;
      videoEl.playsInline = true;
      videoEl.setAttribute('playsinline', 'true');
      videoEl.setAttribute('autoplay', 'true');

      await awaitVideoReady(videoEl);

      setCameraStatus('Waiting for camera preview…');

      await new Promise((resolve, reject) => {
        let settled = false;

        const cleanup = () => {
          settled = true;
          videoEl.removeEventListener('playing', handlePlaying);
          videoEl.removeEventListener('loadeddata', handleLoadedData);
          videoEl.removeEventListener('error', handleError);
          clearInterval(fallbackCheck);
        };

        const handlePlaying = () => {
          if (settled) return;
          cleanup();
          resolve();
        };

        const handleLoadedData = () => {
          if (settled) return;
          if (videoEl.readyState >= videoEl.HAVE_CURRENT_DATA && videoEl.videoWidth > 0) {
            cleanup();
            resolve();
          }
        };

        const handleError = (event) => {
          if (settled) return;
          cleanup();
          reject(event instanceof Error ? event : new Error('Unable to start camera preview.'));
        };

        const fallbackCheck = setInterval(() => {
          if (videoEl.readyState >= videoEl.HAVE_CURRENT_DATA && videoEl.videoWidth > 0) {
            handlePlaying();
          }
        }, 150);

        videoEl.addEventListener('playing', handlePlaying, { once: true });
        videoEl.addEventListener('loadeddata', handleLoadedData);
        videoEl.addEventListener('error', handleError, { once: true });

        const playPromise = videoEl.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((err) => {
            if (settled) return;
            cleanup();
            reject(err);
          });
        }
      });

      setPreviewReady(true);
  previewReadyRef.current = true;

      setScanning(true);
  scanningRef.current = true;
      setCameraStatus('Camera ready – scanning…');

      scanIntervalRef.current = setInterval(scanQRFromCamera, 200);

    } catch (error) {
      console.error('Camera error:', error);
      stopCamera();
      setPreviewReady(false);
      setScanResult({
        type: 'error',
        message: error.message || 'Camera access denied or not available'
      });
    }
  };

  const scanQRFromCamera = () => {
  if (!videoRef.current || !canvasRef.current || !scanningRef.current || !previewReadyRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth === 0) {
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

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
      console.error('Failed to process camera frame', error);
    }
  };

  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);

  useEffect(() => {
    previewReadyRef.current = previewReady;
  }, [previewReady]);

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
              <div className="relative w-full max-w-md mx-auto scanner-preview">
                <video
                  ref={videoRef}
                  className={`absolute inset-0 w-full h-full rounded-lg object-cover bg-black/70 transition-opacity duration-300 ${previewReady ? 'opacity-100' : 'opacity-50'}`}
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                <div className="absolute inset-0 border-2 border-cyan-400/50 rounded-lg animate-pulse pointer-events-none z-20">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-48 h-48 border-2 border-white/50 rounded-lg border-dashed animate-bounce"></div>
                  </div>
                </div>
              </div>
              {cameraStatus && (
                <p className="text-center text-white/70 text-sm">{cameraStatus}</p>
              )}
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
              {!cameraMode && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={startCamera}
                    className="glass-effect px-4 py-2 rounded-lg border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/20 transition-all flex items-center space-x-2"
                  >
                    <Scan className="w-4 h-4" />
                    <span>Scan Next Ticket</span>
                  </button>
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