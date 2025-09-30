import React, { useState } from 'react';
import { 
  Share2, 
  Download, 
  X, 
  Copy, 
  FileImage, 
  FileText,
  MessageCircle,
  Mail,
  Send,
  ExternalLink,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  WhatsappShareButton,
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  TelegramShareButton,
  RedditShareButton,
  EmailShareButton,
  WhatsappIcon,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  TelegramIcon,
  RedditIcon,
  EmailIcon
} from 'react-share';
import {
  shareTicketAsImage,
  downloadTicketAsPDF,
  downloadTicketAsImage,
  generateShareUrls,
  copyTicketLink,
  generateTicketUrl
} from '../utils/ticketUtils';

const ShareModal = ({ isOpen, onClose, ticket, ticketElement }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [notification, setNotification] = useState(null);

  const ticketUrl = generateTicketUrl(ticket.id);
  const shareUrls = generateShareUrls(ticket, ticketUrl);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleShare = async (platform) => {
    setIsLoading(true);
    setLoadingAction(`Sharing to ${platform}`);

    try {
      if (platform === 'native') {
        const result = await shareTicketAsImage(ticketElement, ticket, 'native');
        if (result === true) {
          showNotification('Shared successfully!');
        } else {
          showNotification(result.message);
        }
      } else if (platform === 'image') {
        await shareTicketAsImage(ticketElement, ticket, 'download');
        showNotification('Ticket image downloaded! You can now share it anywhere.');
      } else if (platform === 'copy') {
        const success = await copyTicketLink(ticketUrl, ticket);
        if (success) {
          showNotification('Ticket link copied to clipboard!');
        } else {
          showNotification('Failed to copy link', 'error');
        }
      } else {
        // Open external sharing URL
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        showNotification(`Opening ${platform} share...`);
      }
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      showNotification(`Failed to share: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  const handleDownload = async (format) => {
    setIsLoading(true);
    setLoadingAction(`Downloading as ${format.toUpperCase()}`);

    try {
      if (format === 'pdf') {
        await downloadTicketAsPDF(ticketElement, ticket);
        showNotification('PDF downloaded successfully!');
      } else if (format === 'image') {
        await downloadTicketAsImage(ticketElement, ticket);
        showNotification('Image downloaded successfully!');
      }
    } catch (error) {
      console.error(`Error downloading as ${format}:`, error);
      showNotification(`Failed to download: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
      setLoadingAction('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-600">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Share & Download
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
            notification.type === 'success' 
              ? 'bg-green-500/20 border border-green-400/30 text-green-200' 
              : 'bg-red-500/20 border border-red-400/30 text-red-200'
          }`}>
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-4 p-3 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-200 flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">{loadingAction}...</span>
          </div>
        )}

        {/* Download Options */}
        <div className="mb-6">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Download Options
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 p-3 bg-red-600/20 border border-red-500/30 rounded-lg text-red-200 hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">PDF</span>
            </button>
            <button
              onClick={() => handleDownload('image')}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 p-3 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-200 hover:bg-purple-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileImage className="w-4 h-4" />
              <span className="text-sm">Image</span>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <Send className="w-4 h-4 mr-2" />
            Quick Share
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleShare('native')}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-200 hover:bg-blue-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Native Share</span>
            </button>
            <button
              onClick={() => handleShare('copy')}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 p-3 bg-green-600/20 border border-green-500/30 rounded-lg text-green-200 hover:bg-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm">Copy Link</span>
            </button>
          </div>
        </div>

        {/* Social Media Platforms */}
        <div className="mb-6">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <ExternalLink className="w-4 h-4 mr-2" />
            Social Platforms
          </h4>
          <div className="grid grid-cols-4 gap-3">
            <WhatsappShareButton
              url={ticketUrl}
              title={`Freshers Welcome 2025 🎉\\n\\nI'm attending the Freshers Welcome event!\\n\\n#FreshersWelcome2025`}
              className="w-full"
            >
              <div className="flex flex-col items-center space-y-1 p-2 hover:bg-slate-700 rounded-lg transition-colors group">
                <WhatsappIcon size={32} round />
                <span className="text-xs text-slate-400 group-hover:text-white">WhatsApp</span>
              </div>
            </WhatsappShareButton>

            <FacebookShareButton
              url={ticketUrl}
              quote="I'm attending the Freshers Welcome 2025! 🎊"
              hashtag="#FreshersWelcome2025"
              className="w-full"
            >
              <div className="flex flex-col items-center space-y-1 p-2 hover:bg-slate-700 rounded-lg transition-colors group">
                <FacebookIcon size={32} round />
                <span className="text-xs text-slate-400 group-hover:text-white">Facebook</span>
              </div>
            </FacebookShareButton>

            <TwitterShareButton
              url={ticketUrl}
              title="I'm attending the Freshers Welcome 2025! 🎊"
              hashtags={['FreshersWelcome2025', 'AdityaUniversity']}
              className="w-full"
            >
              <div className="flex flex-col items-center space-y-1 p-2 hover:bg-slate-700 rounded-lg transition-colors group">
                <TwitterIcon size={32} round />
                <span className="text-xs text-slate-400 group-hover:text-white">Twitter</span>
              </div>
            </TwitterShareButton>

            <LinkedinShareButton
              url={ticketUrl}
              title="Freshers Welcome 2025"
              summary="I'm attending the Freshers Welcome event at Aditya University!"
              className="w-full"
            >
              <div className="flex flex-col items-center space-y-1 p-2 hover:bg-slate-700 rounded-lg transition-colors group">
                <LinkedinIcon size={32} round />
                <span className="text-xs text-slate-400 group-hover:text-white">LinkedIn</span>
              </div>
            </LinkedinShareButton>

            <TelegramShareButton
              url={ticketUrl}
              title="I'm attending the Freshers Welcome 2025! 🎊"
              className="w-full"
            >
              <div className="flex flex-col items-center space-y-1 p-2 hover:bg-slate-700 rounded-lg transition-colors group">
                <TelegramIcon size={32} round />
                <span className="text-xs text-slate-400 group-hover:text-white">Telegram</span>
              </div>
            </TelegramShareButton>

            <RedditShareButton
              url={ticketUrl}
              title="Freshers Welcome 2025 🎉"
              className="w-full"
            >
              <div className="flex flex-col items-center space-y-1 p-2 hover:bg-slate-700 rounded-lg transition-colors group">
                <RedditIcon size={32} round />
                <span className="text-xs text-slate-400 group-hover:text-white">Reddit</span>
              </div>
            </RedditShareButton>

            <EmailShareButton
              url={ticketUrl}
              subject="Freshers Welcome 2025 🎉"
              body="I'm attending the Freshers Welcome event! Check out my ticket:"
              className="w-full"
            >
              <div className="flex flex-col items-center space-y-1 p-2 hover:bg-slate-700 rounded-lg transition-colors group">
                <EmailIcon size={32} round />
                <span className="text-xs text-slate-400 group-hover:text-white">Email</span>
              </div>
            </EmailShareButton>

            <button
              onClick={() => handleShare('image')}
              disabled={isLoading}
              className="w-full"
            >
              <div className="flex flex-col items-center space-y-1 p-2 hover:bg-slate-700 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <FileImage className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-slate-400 group-hover:text-white">Image</span>
              </div>
            </button>
          </div>
        </div>

        {/* Ticket Info */}
        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
          <h5 className="text-white font-semibold mb-2 text-sm">Ticket Details</h5>
          <div className="space-y-1 text-xs text-slate-300">
            <p>ID: {ticket.id.substring(0, 12)}...</p>
            <p>Event: {ticket.eventName || 'Freshers Welcome 2025'}</p>
            <p>Date: {ticket.eventDate || 'Thursday, October 2, 2025'}</p>
            <p className="text-blue-300">Online Link: {ticketUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;