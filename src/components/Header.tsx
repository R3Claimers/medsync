
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, Calendar, MessageSquare, Activity } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (location.pathname === '/' && user) {
      switch (user.role) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'doctor':
          navigate('/doctor-dashboard');
          break;
        case 'patient':
          navigate('/patient-dashboard');
          break;
        case 'receptionist':
          navigate('/receptionist-dashboard');
          break;
        case 'pharmacist':
          navigate('/pharmacy-dashboard');
          break;
        case 'super-admin':
          navigate('/superadmin');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, location, navigate]);

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4">
            <img 
              src="/medsync_logo.png" 
              alt="MedSync Logo" 
              className="h-16 w-auto object-contain" 
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">MedSync</h1>
              <p className="text-xs text-gray-500">Smart Healthcare</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user?.role === 'super-admin' && (
              <Link to="/superadmin" className="text-blue-700 font-semibold hover:text-blue-900 transition-colors">Super Admin</Link>
            )}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Button variant="outline" className="hover:bg-primary hover:text-white transition-colors" onClick={handleLogout}>
                <User className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="hover:bg-primary hover:text-white transition-colors">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="medical-gradient text-white hover:opacity-90 transition-opacity">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              {user?.role === 'super-admin' && (
                <Link to="/superadmin" className="text-blue-700 font-semibold hover:text-blue-900 transition-colors px-2 py-1">Super Admin</Link>
              )}
              <div className="flex flex-col space-y-2 pt-4">
                {user ? (
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <User className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="outline" className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button className="medical-gradient text-white w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
