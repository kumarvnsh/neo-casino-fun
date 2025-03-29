import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCoins } from '@/contexts/CoinContext';
import { Coins, Home, RefreshCw, Menu, X } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-casino-background to-black">
      <header className="border-b border-casino-card shadow-md py-3 md:py-4 sticky top-0 bg-casino-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-casino-primary">Neo</span>
            <span className="text-casino-secondary">Vegas</span>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="coin-display">
              <Coins className="text-yellow-400 w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">{coins.toLocaleString()}</span>
              <span className="sm:hidden">{(coins / 1000).toFixed(1)}K</span>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="w-8 h-8 md:w-9 md:h-9">
                  <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-casino-card text-white border-casino-primary max-w-[90vw] md:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Coins?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    This will reset your balance to 10,000 coins. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={resetCoins} 
                    className="bg-casino-primary text-white hover:bg-opacity-90 w-full sm:w-auto"
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            {!isHome && (
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-white w-8 h-8 md:w-9 md:h-9">
                  <Home className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </Link>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white md:hidden w-8 h-8"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden bg-casino-card/95 backdrop-blur-sm border-t border-casino-muted mt-3">
            <div className="container py-4 space-y-2">
              <Link 
                to="/" 
                className="block px-4 py-2 text-white hover:bg-casino-accent/20 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/dragon-tower" 
                className="block px-4 py-2 text-white hover:bg-casino-accent/20 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dragon Tower
              </Link>
              <Link 
                to="/mines" 
                className="block px-4 py-2 text-white hover:bg-casino-accent/20 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Mines
              </Link>
              <Link 
                to="/dice" 
                className="block px-4 py-2 text-white hover:bg-casino-accent/20 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dice
              </Link>
              <Link 
                to="/wheel" 
                className="block px-4 py-2 text-white hover:bg-casino-accent/20 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Wheel
              </Link>
              <Link 
                to="/hi-lo" 
                className="block px-4 py-2 text-white hover:bg-casino-accent/20 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Hi-Lo
              </Link>
            </div>
          </nav>
        )}
      </header>
      
      <main className="min-h-[calc(100vh-theme(space.32))]">
        {children}
      </main>
      
      <footer className="py-4 md:py-6 border-t border-casino-card mt-8 md:mt-12">
        <div className="container mx-auto text-center text-gray-500">
          <p className="text-sm md:text-base">NeoVegas - A Fun Casino Experience with Virtual Coins</p>
          <p className="text-xs md:text-sm mt-2">All games are for entertainment purposes only. No real money involved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
