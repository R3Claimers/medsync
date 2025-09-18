
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ServiceCards from '@/components/ServiceCards';
import AIHealthAssistantDemo from '@/components/AIHealthAssistantDemo';
import Footer from '@/components/Footer';

const Index = () => {
  useEffect(() => {
    // Ensure page loads at the top and prevent any auto-scroll behavior
    window.scrollTo(0, 0);
    
    // Disable browser scroll restoration for this page
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    return () => {
      // Restore scroll restoration when leaving the page
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <ServiceCards />
        <AIHealthAssistantDemo />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
