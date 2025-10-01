import React from 'react';
import { Mail, MapPin, Phone, PartyPopper, Sparkles } from 'lucide-react';


const supportEmail = 'freshers-support@adityauniversity.edu';
const supportPhone = '+91 98765 43210';
const campusAddress = 'Aditya University Main Campus, Vizag, India';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
      <footer>
        <div className="relative z-10 border-t border-white/10 bg-black/20">
          <div className="mx-auto px-6 py-4 items-center text-center text-sm text-white/60">
            <p>© {currentYear} Ghost All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
};

export default Footer;
