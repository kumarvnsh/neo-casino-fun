import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCoins } from '@/contexts/CoinContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowUp,
  ArrowDown,
  Play,
  Coins,
  HelpCircle,
  AlertTriangle,
  RefreshCcw,
  Check,
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

// Card types and interfaces
interface Card {
  suit: '♠' | '♥' | '♣' | '♦';
  value: number; // 1 (Ace) to 13 (King)
  display: string; // Display value (A, 2, 3, ..., J, Q, K)
}

const SUITS: Array<Card['suit']> = ['♠', '♥', '♣', '♦'];
const VALUES = Array.from({ length: 13 }, (_, i) => i + 1);
const DISPLAY_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Create a fresh deck of cards
const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < VALUES.length; i++) {
      deck.push({
        suit,
        value: VALUES[i],
        display: DISPLAY_VALUES[i]
      });
    }
  }
  return deck;
};

// Shuffle the deck using Fisher-Yates algorithm
const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Calculate payout odds based on current card and direction
const getPayoutOdds = (currentValue: number, direction: 'higher' | 'lower'): number => {
  const remaining = direction === 'higher'
    ? 13 - currentValue
    : currentValue - 1;
  const probability = remaining / 12; // Exclude current value for fair odds
  return +(1 / probability).toFixed(2);
};

const HiLo = () => {
  const { coins, updateCoins } = useCoins();
  const [betAmount, setBetAmount] = useState(100);
  const [deck, setDeck] = useState<Card[]>(shuffleDeck(createDeck()));
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [streak, setStreak] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [potentialWin, setPotentialWin] = useState(0);
  const [cardHistory, setCardHistory] = useState<Card[]>([]);

  // Start a new game
  const startGame = () => {
    if (betAmount <= 0) {
      toast({
        title: "Invalid bet amount",
        description: "Please enter a bet amount greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    if (betAmount > coins) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough coins for this bet",
        variant: "destructive",
      });
      return;
    }

    // Deduct bet amount
    updateCoins(-betAmount);
    
    // Shuffle deck and draw first card
    const newDeck = shuffleDeck(createDeck());
    const firstCard = newDeck[0];
    const remainingDeck = newDeck.slice(1);
    
    setDeck(remainingDeck);
    setCurrentCard(firstCard);
    setNextCard(null);
    setIsGameActive(true);
    setStreak(0);
    setCurrentMultiplier(1);
    setPotentialWin(0);
    setCardHistory([firstCard]);
  };

  // Make a guess (higher or lower)
  const makeGuess = async (direction: 'higher' | 'lower') => {
    if (!currentCard || isRevealing) return;

    setIsRevealing(true);
    const nextCardFromDeck = deck[0];
    setNextCard(nextCardFromDeck);
    
    // Wait for card reveal animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const isCorrect = direction === 'higher' 
      ? nextCardFromDeck.value > currentCard.value
      : nextCardFromDeck.value < currentCard.value;
    
    const isSameValue = nextCardFromDeck.value === currentCard.value;
    
    // Handle same value (Stake variant)
    if (isSameValue) {
      if ((currentCard.value === 1 && direction === 'lower') || 
          (currentCard.value === 13 && direction === 'higher')) {
        handleLoss();
      } else {
        handleWin(nextCardFromDeck);
      }
      return;
    }
    
    if (isCorrect) {
      handleWin(nextCardFromDeck);
    } else {
      handleLoss();
    }
  };

  // Handle a winning guess
  const handleWin = (newCard: Card) => {
    const newStreak = streak + 1;
    const odds = getPayoutOdds(currentCard!.value, newCard.value > currentCard!.value ? 'higher' : 'lower');
    const newMultiplier = +(currentMultiplier * odds).toFixed(2);
    const newPotentialWin = Math.floor(betAmount * newMultiplier);
    
    setStreak(newStreak);
    setCurrentMultiplier(newMultiplier);
    setPotentialWin(newPotentialWin);
    setCurrentCard(newCard);
    setDeck(prev => prev.slice(1));
    setNextCard(null);
    setIsRevealing(false);
    setCardHistory(prev => [...prev, newCard]);
    
    toast({
      title: "Correct!",
      description: `Streak: ${newStreak} | Multiplier: ${newMultiplier}x`,
    });
  };

  // Handle a losing guess
  const handleLoss = () => {
    toast({
      title: "Game Over!",
      description: "Better luck next time!",
      variant: "destructive",
    });
    
    setIsGameActive(false);
    setIsRevealing(false);
    setStreak(0);
    setCurrentMultiplier(1);
    setPotentialWin(0);
    setCurrentCard(null);
    setNextCard(null);
    setCardHistory([]);
  };

  // Cash out current winnings
  const cashOut = () => {
    if (!isGameActive) return;
    
    const winAmount = Math.floor(betAmount * currentMultiplier);
    updateCoins(winAmount);
    
    toast({
      title: "Cashed Out!",
      description: `You won ${winAmount} coins! (${currentMultiplier}x)`,
    });
    
    setIsGameActive(false);
    setStreak(0);
    setCurrentMultiplier(1);
    setPotentialWin(0);
    setCurrentCard(null);
    setNextCard(null);
    setCardHistory([]);
  };

  // Calculate current odds
  const getOdds = (direction: 'higher' | 'lower'): number => {
    if (!currentCard) return 1;
    return getPayoutOdds(currentCard.value, direction);
  };

  // Get card color based on suit
  const getCardColor = (suit: Card['suit']) => {
    return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-white';
  };

  // Add skip card function
  const skipCard = () => {
    if (!currentCard || isRevealing) return;
    
    const nextCardFromDeck = deck[0];
    setCurrentCard(nextCardFromDeck);
    setDeck(prev => prev.slice(1));
    setCardHistory(prev => [...prev, nextCardFromDeck]);
  };

  // Update card display style with responsive sizes
  const CardDisplay = ({ card, isSmall = false }: { card: Card | null, isSmall?: boolean }) => {
    if (!card) return null;

    const isRed = card.suit === '♥' || card.suit === '♦';
    const baseClasses = `relative bg-white rounded-xl shadow-xl flex flex-col overflow-hidden ${
      isSmall 
        ? 'w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32' 
        : 'w-32 h-44 sm:w-40 sm:h-56 md:w-48 md:h-64'
    }`;

    return (
      <div className={baseClasses}>
        {/* Top-left value and suit */}
        <div className={`absolute top-2 left-2 flex flex-col items-center ${isRed ? 'text-red-500' : 'text-black'}`}>
          <span className={`font-bold ${isSmall ? 'text-sm sm:text-base md:text-xl' : 'text-xl sm:text-2xl md:text-3xl'}`}>
            {card.display}
          </span>
          <span className={`${isSmall ? 'text-xs sm:text-sm md:text-lg' : 'text-lg sm:text-xl md:text-2xl'}`}>
            {card.suit}
          </span>
        </div>

        {/* Center large suit */}
        <div className={`absolute inset-0 flex items-center justify-center ${isRed ? 'text-red-500' : 'text-black'}`}>
          <span className={`${isSmall ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-5xl sm:text-6xl md:text-8xl'}`}>
            {card.suit}
          </span>
        </div>

        {/* Bottom-right value and suit (inverted) */}
        <div className={`absolute bottom-2 right-2 flex flex-col items-center rotate-180 ${isRed ? 'text-red-500' : 'text-black'}`}>
          <span className={`font-bold ${isSmall ? 'text-sm sm:text-base md:text-xl' : 'text-xl sm:text-2xl md:text-3xl'}`}>
            {card.display}
          </span>
          <span className={`${isSmall ? 'text-xs sm:text-sm md:text-lg' : 'text-lg sm:text-xl md:text-2xl'}`}>
            {card.suit}
          </span>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="game-layout px-2 sm:px-4">
        <h1 className="game-title flex items-center gap-2 mb-4">
          <Play className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-yellow-500" />
          Hi-Lo
        </h1>
        
        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start">
          {/* Controls Panel - Full width on mobile/tablet, side panel on desktop */}
          <div className="bg-casino-card rounded-xl p-4 sm:p-5 md:p-6 w-full lg:w-72 flex flex-col gap-3 sm:gap-4 order-2 lg:order-1">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm mb-2">Bet Amount</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={10}
                  max={coins}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="bg-casino-background border-casino-muted text-white text-sm sm:text-base"
                  disabled={isGameActive}
                />
                <Button 
                  variant="outline" 
                  onClick={() => setBetAmount(Math.floor(betAmount / 2))}
                  className="text-white border-casino-muted bg-casino-background hover:bg-casino-accent/20 px-2 sm:px-3"
                  disabled={betAmount <= 10 || isGameActive}
                >
                  ½
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setBetAmount(Math.min(betAmount * 2, coins))}
                  className="text-white border-casino-muted bg-casino-background hover:bg-casino-accent/20 px-2 sm:px-3"
                  disabled={betAmount * 2 > coins || isGameActive}
                >
                  2×
                </Button>
              </div>
            </div>

            {isGameActive && !isRevealing && (
              <div className="flex flex-col gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 text-sm sm:text-base md:text-lg font-bold"
                  onClick={() => makeGuess('higher')}
                >
                  <ArrowUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Higher ({getOdds('higher')}x)
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white py-2 sm:py-3 text-sm sm:text-base md:text-lg font-bold"
                  onClick={() => makeGuess('lower')}
                >
                  <ArrowDown className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Lower ({getOdds('lower')}x)
                </Button>
                <Button
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 sm:py-3 text-sm sm:text-base"
                  onClick={skipCard}
                >
                  Skip Card
                </Button>
              </div>
            )}

            {!isGameActive ? (
              <Button 
                className="neon-button w-full py-2 sm:py-3 text-sm sm:text-base" 
                onClick={startGame}
                disabled={betAmount <= 0 || betAmount > coins}
              >
                <Play className="mr-2" size={16} />
                Start Game
              </Button>
            ) : (
              <Button 
                className="neon-button w-full bg-green-600 hover:bg-green-700 py-2 sm:py-3 text-sm sm:text-base" 
                onClick={cashOut}
                disabled={!isGameActive || isRevealing}
              >
                <Check className="mr-2" size={16} />
                Cash Out ({currentMultiplier}x)
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-casino-background p-2 rounded-lg">
                <p className="text-xs text-gray-400">Streak</p>
                <p className="text-base sm:text-lg font-bold text-blue-400">{streak}</p>
              </div>
              <div className="bg-casino-background p-2 rounded-lg">
                <p className="text-xs text-gray-400">Potential Win</p>
                <p className="text-base sm:text-lg font-bold text-green-400">{potentialWin}</p>
              </div>
            </div>
          </div>
          
          {/* Game Board - Full width with margin */}
          <div className="flex-1 bg-casino-card rounded-xl p-4 sm:p-5 md:p-6 w-full order-1 lg:order-2">
            <div className="mx-auto">
              <div className="flex flex-col items-center gap-6 sm:gap-8">
                {/* Current Card Display - Centered with more height */}
                <div className="relative min-h-[220px] sm:min-h-[280px] md:min-h-[320px] flex items-center justify-center w-full">
                  {currentCard && (
                    <div className={`${isRevealing ? 'animate-pulse' : ''} transform scale-110 sm:scale-125 md:scale-100`}>
                      <CardDisplay card={currentCard} />
                    </div>
                  )}
                  
                  {/* Next Card Animation */}
                  {isRevealing && nextCard && (
                    <div className="absolute inset-0 flex items-center justify-center animate-slide-left">
                      <div className="transform scale-110 sm:scale-125 md:scale-100">
                        <CardDisplay card={nextCard} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card History Row - Full width scroll */}
                <div className="w-full -mx-4 sm:-mx-5 md:-mx-6 px-4 sm:px-5 md:px-6 overflow-x-auto scrollbar-thin scrollbar-thumb-casino-muted scrollbar-track-casino-background">
                  <div className="flex gap-2 sm:gap-3 md:gap-4 justify-start min-h-[100px] sm:min-h-[120px] p-2 sm:p-3 md:p-4 min-w-max">
                    {cardHistory.map((card, index) => (
                      <div
                        key={index}
                        className={`transition-all duration-300 ${
                          index === cardHistory.length - 1 ? 'opacity-50' : ''
                        }`}
                      >
                        <CardDisplay card={card} isSmall />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multiplier Indicators - Full width grid */}
                <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 text-center">
                  <div className="bg-casino-background p-2 sm:p-3 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-gray-400 truncate">Higher ({getOdds('higher')}x)</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-green-400">{potentialWin * getOdds('higher')}</p>
                  </div>
                  <div className="bg-casino-background p-2 sm:p-3 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-gray-400 truncate">Total ({currentMultiplier}x)</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-blue-400">{potentialWin}</p>
                  </div>
                  <div className="bg-casino-background p-2 sm:p-3 rounded-lg">
                    <p className="text-[10px] sm:text-xs text-gray-400 truncate">Lower ({getOdds('lower')}x)</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-red-400">{potentialWin * getOdds('lower')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How to Play Section */}
        <div className="mt-8 bg-casino-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">How to Play</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Game Rules</h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">1.</span>
                    Place your bet and start the game.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">2.</span>
                    Guess if the next card will be higher or lower.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">3.</span>
                    Each correct guess increases your multiplier.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">4.</span>
                    Cash out anytime to secure your winnings!
                  </li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Special Rules</h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    Same value cards count as a win (except Ace-Low or King-High).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    Payouts are based on probability - riskier guesses pay more.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    Cards are ranked from Ace (1) to King (13).
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HiLo; 