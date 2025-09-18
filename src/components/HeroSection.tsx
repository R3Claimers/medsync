
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MessageSquare, Users, Activity, ArrowRight, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  const scrollToAIDemo = () => {
    const aiSection = document.querySelector('[data-ai-demo]');
    if (aiSection) {
      aiSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    navigate('/register');
  };
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50 py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-primary font-medium">
                <Activity className="h-5 w-5" />
                <span>Smart Hospital Management</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  MedSync
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-lg">
                Revolutionizing healthcare with AI-powered assistance, seamless patient management, and instant medical guidance for hospitals and clinics.
              </p>
            </div>

            {/* Feature Points */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-gray-700">24/7 AI Health Assistant</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-gray-700">Secure Patient Records</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-gray-700">Multi-Role Dashboard</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-gray-700">Smart Scheduling</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="medical-gradient text-white group hover:opacity-90 transition-all"
                onClick={handleGetStarted}
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="hover:bg-primary hover:text-white transition-colors"
                onClick={scrollToAIDemo}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Try AI Assistant
              </Button>
            </div>
          </div>

          {/* Visual/Dashboard Preview */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Patient Dashboard</h3>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Active
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Next Appointment</span>
                    </div>
                    <p className="text-blue-800 font-semibold mt-1">Today, 2:30 PM</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Health Score</span>
                    </div>
                    <p className="text-green-800 font-semibold mt-1">Excellent</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="h-5 w-5 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">AI Assistant:</span> Based on your symptoms, I recommend scheduling a consultation with Dr. Smith.
                      </p>
                      <Button size="sm" className="mt-2 text-xs">
                        Ask Another Question
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white p-3 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-gray-700">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
