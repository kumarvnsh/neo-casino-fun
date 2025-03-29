
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useCoins } from '@/contexts/CoinContext';
import { 
  ArrowUpRight, 
  Layers, 
  Bomb, 
  Dice3, 
  Disc, 
  Target,
} from 'lucide-react';

const GameCard = ({ title, icon, description, to, comingSoon = false }: { 
  title: string; 
  icon: React.ReactNode; 
  description: string; 
  to: string;
  comingSoon?: boolean;
}) => {
  if (comingSoon) {
    return (
      <div className="game-card opacity-70 hover:opacity-80 cursor-not-allowed">
        <div className="relative h-32 bg-gradient-to-br from-casino-primary/30 to-casino-secondary/30 rounded-lg mb-3 flex items-center justify-center">
          {icon}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">Coming Soon</span>
          </div>
        </div>
        <h3 className="game-card-title">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    );
  }

  return (
    <Link to={to} className="block">
      <div className="game-card">
        <div className="relative h-32 bg-gradient-to-br from-casino-primary/30 to-casino-secondary/30 rounded-lg mb-3 flex items-center justify-center">
          {icon}
          <ArrowUpRight className="absolute top-2 right-2 text-white/70" size={20} />
        </div>
        <h3 className="game-card-title">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </Link>
  );
};

const Index = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to <span className="text-casino-primary">Neo</span>
            <span className="text-casino-secondary">Vegas</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Enjoy the thrill of casino games with 10,000 virtual coins. Play responsibly and have fun!
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          <GameCard 
            title="Dragon Tower" 
            icon={<Layers className="text-casino-primary" size={48} />}
            description="Climb the tower for higher multipliers. Watch out for dragons!"
            to="/dragon-tower"
          />
          
          <GameCard 
            title="Mines" 
            icon={<Bomb className="text-casino-secondary" size={48} />}
            description="Uncover gems and avoid the mines to win big rewards."
            to="/mines"
          />
          
          <GameCard 
            title="Dice" 
            icon={<Dice3 className="text-casino-accent" size={48} />}
            description="Predict if the dice will roll over or under your number."
            to="/dice"
          />
          
          <GameCard 
            title="Wheel" 
            icon={<Disc className="text-casino-primary" size={48} />}
            description="Spin the wheel and win multipliers based on where it lands."
            to="/wheel"
            comingSoon
          />
          
          <GameCard 
            title="Roulette" 
            icon={<Target className="text-casino-secondary" size={48} />}
            description="Classic casino roulette with multiple betting options."
            to="/roulette"
            comingSoon
          />
        </div>
        
        <div className="mt-16 bg-casino-card rounded-xl p-6 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">How to Play</h2>
          <div className="space-y-4 text-gray-300">
            <p>1. Start with 10,000 virtual coins (stored locally in your browser)</p>
            <p>2. Choose any game from the selection above</p>
            <p>3. Place bets and play to win more coins</p>
            <p>4. Your coin balance is saved automatically between sessions</p>
            <p>5. You can reset your coins to 10,000 anytime using the reset button</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
