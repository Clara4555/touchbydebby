import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-pink-50 to-nude-50 border-t border-pink-200 mt-auto">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-cormorant font-bold text-pink-700 mb-4">touchbydebby</h3>
            <p className="text-gray-600">
              Luxury makeup artistry specializing in bridal, events, and glam makeup. 
              Creating beautiful looks that enhance your natural beauty.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-pink-600 hover:text-pink-700">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-pink-600 hover:text-pink-700">
                <Facebook size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-600 hover:text-pink-600">About</Link></li>
              <li><Link to="/services" className="text-gray-600 hover:text-pink-600">Services</Link></li>
              <li><Link to="/portfolio" className="text-gray-600 hover:text-pink-600">Portfolio</Link></li>
              <li><Link to="/booking" className="text-gray-600 hover:text-pink-600">Book Now</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-pink-600" />
                <span className="text-gray-600">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-pink-600" />
                <span className="text-gray-600">hello@touchbydebby.com</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin size={18} className="text-pink-600" />
                <span className="text-gray-600">Los Angeles, CA</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-pink-200 mt-8 pt-8 text-center">
          <p className="text-gray-600">
            &copy; {new Date().getFullYear()} touchbydebby. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;