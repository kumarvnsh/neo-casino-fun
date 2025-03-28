
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCoins } from '@/contexts/CoinContext';
import { Coins, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { coins, resetCoins } = useCoins();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gradient-to-b from-casino-background to-black">
      <header className="border-b border-casino-card shadow-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-casino-primary">Neo</span>
            <span className="text-casino-secondary">Vegas</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="coin-display animate-pulse-glow">
              <Coins className="text-yellow-400" size={20} />
              <span>{coins.toLocaleString()}</span>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <RefreshCw size={18} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-casino-card text-white border-casino-primary">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Coins?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    This will reset your balance to 10,000 coins. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={resetCoins} 
                    className="bg-casino-primary text-white hover:bg-opacity-90"
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {!isHome && (
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-white">
                  <Home size={20} />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main>
        {children}
      </main>
      
      <footer className="py-6 border-t border-casino-card mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>NeoVegas - A Fun Casino Experience with Virtual Coins</p>
          <p className="text-sm mt-2">All games are for entertainment purposes only. No real money involved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
