
import React from 'react';
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/medsync_logo.png" 
                alt="MedSync Logo" 
                className="h-14 w-auto object-contain" 
              />
              <div>
                <h3 className="text-xl font-bold">MedSync</h3>
                <p className="text-xs text-gray-400">Smart Healthcare</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Revolutionizing healthcare with AI-powered assistance and comprehensive hospital management solutions.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-400">Patient Portal</span></li>
              <li><span className="text-gray-400">Doctor Dashboard</span></li>
              <li><span className="text-gray-400">Admin Panel</span></li>
              <li><span className="text-gray-400">Pharmacy Management</span></li>
              <li><span className="text-gray-400">AI Health Assistant</span></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-400">Smart Scheduling</span></li>
              <li><span className="text-gray-400">E-Prescriptions</span></li>
              <li><span className="text-gray-400">Prescription Management</span></li>
              <li><span className="text-gray-400">Real-time Alerts</span></li>
              <li><span className="text-gray-400">Secure Data Storage</span></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-gray-400">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-gray-400">info@medsync.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-gray-400">
                  123 Healthcare Ave<br />
                  Medical Center, MC 12345
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 MedSync. All rights reserved. | Designed for healthcare excellence.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
