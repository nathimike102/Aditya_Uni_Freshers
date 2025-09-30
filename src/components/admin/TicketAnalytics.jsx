import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Ticket, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { realtimeDB } from '../../firebase';

const TicketAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalTickets: 0,
    scannedTickets: 0,
    pendingTickets: 0,
    scanRate: 0,
    recentTickets: [],
    dailyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Loading analytics...');
      const allTickets = await realtimeDB.admin.getAllTickets();
      console.log('All tickets received:', allTickets);
      
      const totalTickets = allTickets.length;
      const scannedTickets = allTickets.filter(ticket => ticket.isScanned).length;
      const pendingTickets = totalTickets - scannedTickets;
      const scanRate = totalTickets > 0 ? Math.round((scannedTickets / totalTickets) * 100) : 0;
      
      const recentTickets = allTickets
        .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))
        .slice(0, 10);

      const dailyStats = {};
      allTickets.forEach(ticket => {
        const date = new Date(ticket.purchaseDate).toDateString();
        if (!dailyStats[date]) {
          dailyStats[date] = { date, total: 0, scanned: 0 };
        }
        dailyStats[date].total++;
        if (ticket.isScanned) {
          dailyStats[date].scanned++;
        }
      });

      setAnalytics({
        totalTickets,
        scannedTickets,
        pendingTickets,
        scanRate,
        recentTickets,
        dailyStats: Object.values(dailyStats).slice(-7) // Last 7 days
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError(error.message || 'Failed to load analytics data');
      setAnalytics({
        totalTickets: 0,
        scannedTickets: 0,
        pendingTickets: 0,
        scanRate: 0,
        recentTickets: [],
        dailyStats: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-slate-400">
            Real-time ticket statistics and insights
            {lastUpdated && (
              <span className="ml-2 text-xs">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 animate-fade-in">
          <p className="text-red-200 text-center">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-effect rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{analytics.totalTickets}</div>
          <div className="text-slate-400">Total Tickets</div>
        </div>

        <div className="glass-effect rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{analytics.scannedTickets}</div>
          <div className="text-slate-400">Scanned</div>
        </div>

        <div className="glass-effect rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{analytics.pendingTickets}</div>
          <div className="text-slate-400">Pending</div>
        </div>

        <div className="glass-effect rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">{analytics.scanRate}%</div>
          <div className="text-slate-400">Scan Rate</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Daily Statistics
          </h3>
          
          {analytics.dailyStats.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.dailyStats.map((day, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="text-right">
                      <span className="text-blue-400">{day.total} tickets</span>
                      {day.scanned > 0 && (
                        <span className="text-green-400 ml-2">• {day.scanned} scanned</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: day.total > 0 ? `${Math.max(10, (day.total / Math.max(...analytics.dailyStats.map(d => d.total))) * 100)}%` : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Ticket className="w-5 h-5 mr-2" />
            Recent Tickets
          </h3>
          
          {analytics.recentTickets.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tickets issued yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {analytics.recentTickets.map((ticket, index) => (
                <div
                  key={`${ticket.userId}-${ticket.id}-${index}`}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        ticket.isScanned ? 'bg-green-400' : 'bg-orange-400'
                      }`}></div>
                      <div>
                        <p className="text-white font-medium">{ticket.userName}</p>
                        <p className="text-slate-400 text-sm font-mono">
                          {ticket.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-300 text-sm">
                        {formatDateTime(ticket.purchaseDate)}
                      </p>
                      <p className="text-xs">
                        <span className={`font-medium ${
                          ticket.isScanned ? 'text-green-400' : 'text-orange-400'
                        }`}>
                          {ticket.isScanned ? 'Scanned' : 'Pending'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-effect rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Event Summary</h3>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {analytics.totalTickets > 0 ? 
                ((analytics.totalTickets * 100 / 200).toFixed(2)) + '%' : '0.00%'}
            </div>
            <div className="text-slate-400">Capacity Fill</div>
            <div className="text-xs text-slate-500 mt-1">Based on 300 max capacity</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-green-400 mb-2">
              {analytics.scanRate}%
            </div>
            <div className="text-slate-400">Attendance Rate</div>
            <div className="text-xs text-slate-500 mt-1">Tickets scanned vs issued</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-purple-400 mb-2">
              ₹{analytics.totalTickets * 300}
            </div>
            <div className="text-slate-400">Total Revenue</div>
            <div className="text-xs text-slate-500 mt-1">Based on ₹300 per ticket</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketAnalytics;