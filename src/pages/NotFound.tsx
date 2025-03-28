
import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-casino-background to-black p-4">
      <div className="text-center max-w-md w-full bg-casino-card rounded-xl p-8 shadow-2xl border border-casino-primary/30">
        <h1 className="text-6xl font-bold mb-4 text-white">404</h1>
        <div className="w-16 h-1 bg-casino-primary mx-auto mb-6"></div>
        <p className="text-xl text-gray-300 mb-6">Oops! The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button className="neon-button">
            <Home className="mr-2" size={18} />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
