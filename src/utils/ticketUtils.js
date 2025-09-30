import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

// Convert ticket HTML element to high-quality image
export const convertTicketToImage = async (ticketElement, options = {}) => {
  try {
    const {
      backgroundColor = '#ffffff',
      scale = 2, // Higher scale for better quality
      useCORS = true,
      allowTaint = true,
      ...otherOptions
    } = options;

    const canvas = await html2canvas(ticketElement, {
      backgroundColor,
      scale,
      useCORS,
      allowTaint,
      logging: false,
      width: ticketElement.scrollWidth,
      height: ticketElement.scrollHeight,
      ...otherOptions
    });

    return canvas;
  } catch (error) {
    console.error('Error converting ticket to image:', error);
    throw new Error('Failed to convert ticket to image');
  }
};

// Convert canvas to blob for sharing
export const canvasToBlob = (canvas, quality = 0.9) => {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
};

// Convert ticket to PDF and download
export const downloadTicketAsPDF = async (ticketElement, ticketInfo) => {
  try {
    const canvas = await convertTicketToImage(ticketElement, {
      backgroundColor: '#1a1a2e', // Match your dark theme
      scale: 3 // Higher quality for PDF
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    // Calculate PDF dimensions (A4 size)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate image dimensions to fit PDF
    const canvasAspectRatio = canvas.height / canvas.width;
    const imgWidth = pdfWidth - 20; // 10mm margin on each side
    const imgHeight = imgWidth * canvasAspectRatio;
    
    // Center the image
    const x = 10;
    const y = Math.max(10, (pdfHeight - imgHeight) / 2);

    // Add the ticket image to PDF
    pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
    
    // Add metadata
    pdf.setProperties({
      title: `Freshers Welcome 2025 - Ticket ${ticketInfo.id.substring(0, 8)}`,
      subject: 'Event Ticket',
      author: 'Aditya University',
      creator: 'Freshers Event System'
    });

    // Generate filename
    const fileName = `FreshersTicket_${ticketInfo.userName}_${ticketInfo.id.substring(0, 8)}.pdf`;
    
    // Save the PDF
    pdf.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

// Share ticket as image on social platforms
export const shareTicketAsImage = async (ticketElement, ticketInfo, platform = 'native') => {
  try {
    const canvas = await convertTicketToImage(ticketElement, {
      backgroundColor: '#1a1a2e',
      scale: 2
    });

    const blob = await canvasToBlob(canvas);
    
    // Create a File object from the blob
    const fileName = `FreshersTicket_${ticketInfo.userName}_${ticketInfo.id.substring(0, 8)}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });

    const shareData = {
      title: 'Freshers Welcome 2025 🎉',
      text: `I'm attending the Freshers Welcome 2025! 🎊\n\nEvent: ${ticketInfo.eventName || 'Freshers Welcome 2025'}\nDate: ${ticketInfo.eventDate || 'Thursday, October 2, 2025'}\nVenue: ${ticketInfo.venue || 'Aditya University'}\n\n#FreshersWelcome2025 #AdityaUniversity #FreshersParty`,
      files: [file]
    };

    // Use native sharing if supported and platform is native
    if (platform === 'native' && navigator.share && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }

    // Fallback: Download the image for manual sharing
    saveAs(blob, fileName);
    
    return {
      success: true,
      message: 'Image downloaded! You can now share it on your preferred platform.',
      blob,
      fileName
    };

  } catch (error) {
    console.error('Error sharing ticket:', error);
    throw new Error('Failed to share ticket');
  }
};

// Generate shareable URLs for different platforms
export const generateShareUrls = (ticketInfo, ticketUrl) => {
  const text = encodeURIComponent(`I'm attending the Freshers Welcome 2025! 🎊\n\nEvent: ${ticketInfo.eventName || 'Freshers Welcome 2025'}\nDate: ${ticketInfo.eventDate || 'Thursday, October 2, 2025'}\nVenue: ${ticketInfo.venue || 'Aditya University'}\n\n#FreshersWelcome2025 #AdityaUniversity`);
  const url = encodeURIComponent(ticketUrl);
  const title = encodeURIComponent('Freshers Welcome 2025 🎉');

  return {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=FreshersWelcome2025,AdityaUniversity`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    reddit: `https://reddit.com/submit?url=${url}&title=${title}`,
    email: `mailto:?subject=${title}&body=${decodeURIComponent(text)}%0A%0A${decodeURIComponent(url)}`
  };
};

// Copy ticket link to clipboard
export const copyTicketLink = async (ticketUrl, ticketInfo) => {
  try {
    const shareText = `Freshers Welcome 2025 🎉\n\nI'm attending the Freshers Welcome event!\n\nTicket: ${ticketUrl}\n\n#FreshersWelcome2025 #AdityaUniversity`;
    
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareText);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

// Generate online ticket verification URL
export const generateTicketUrl = (ticketId, domain = window.location.origin) => {
  return `${domain}/verify-ticket/${ticketId}`;
};

// Download image directly without sharing
export const downloadTicketAsImage = async (ticketElement, ticketInfo) => {
  try {
    const canvas = await convertTicketToImage(ticketElement, {
      backgroundColor: '#1a1a2e',
      scale: 3 // High quality for download
    });

    const blob = await canvasToBlob(canvas, 1.0); // Maximum quality
    const fileName = `FreshersTicket_${ticketInfo.userName}_${ticketInfo.id.substring(0, 8)}.jpg`;
    
    saveAs(blob, fileName);
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw new Error('Failed to download image');
  }
};