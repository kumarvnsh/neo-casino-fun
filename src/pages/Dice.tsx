import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCoins } from '@/contexts/CoinContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Dice3, 
  ArrowDown, 
  ArrowUp, 
  RefreshCcw, 
  Coins,
  Calculator,
  Trophy,
  X,
  HelpCircle
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

const DiceGame = () => {
  const { coins, updateCoins } = useCoins();
  const [betAmount, setBetAmount] = useState(100);
  const [targetNumber, setTargetNumber] = useState(50);
  const [isRollOver, setIsRollOver] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [win, setWin] = useState(false);
  
  // Calculate win chance and multiplier based on current settings
  const winChance = isRollOver 
    ? 100 - targetNumber 
    : targetNumber;
  
  const multiplier = parseFloat((100 / winChance).toFixed(2));
  
  // Calculate potential win
  const potentialWin = Math.floor(betAmount * multiplier);
  
  const handleSetTarget = (value: number[]) => {
    setTargetNumber(value[0]);
  };
  
  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };
  
  const placeBet = () => {
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
    
    // Set game as active and start rolling animation
    setGameActive(true);
    setIsRolling(true);
    setResult(null);
    setWin(false);
    
    // Simulate the roll with a delay for animation
    setTimeout(() => {
      // Generate a random number between 0 and 100
      const rollResult = parseFloat((Math.random() * 100).toFixed(2));
      setResult(rollResult);
      
      // Determine if player won based on roll and bet type
      const isWin = isRollOver 
        ? rollResult > targetNumber 
        : rollResult < targetNumber;
      
      setWin(isWin);
      
      // Award winnings if player won
      if (isWin) {
        const winAmount = potentialWin;
        updateCoins(winAmount);
        
        toast({
          title: "You Win!",
          description: `You won ${winAmount} coins!`,
        });
      } else {
        toast({
          title: "You Lost",
          description: "Better luck next time!",
          variant: "destructive",
        });
      }
      
      setIsRolling(false);
    }, 1500);
  };
  
  const resetGame = () => {
    setGameActive(false);
    setResult(null);
  };
  
  // Predefined difficulty settings
  const setDifficulty = (level: 'easy' | 'medium' | 'hard') => {
    if (level === 'easy') {
      setTargetNumber(isRollOver ? 25 : 75);
    } else if (level === 'medium') {
      setTargetNumber(50);
    } else if (level === 'hard') {
      setTargetNumber(isRollOver ? 70 : 30);
    }
  };
  
  // Toggle between roll over and roll under
  const toggleRollMode = () => {
    setIsRollOver(!isRollOver);
  };
  
  return (
    <MainLayout>
      <div className="game-layout">
        <h1 className="game-title">Dice</h1>
        
        <div className="game-interface">
          <div className="game-controls bg-casino-card rounded-xl p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Bet Amount</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                    className="bg-casino-background border-casino-muted text-white"
                    disabled={gameActive && isRolling}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-white border-casino-muted bg-casino-background hover:bg-casino-accent/20"
                    onClick={() => setBetAmount(Math.max(0, Math.floor(betAmount / 2)))}
                    disabled={betAmount <= 10 || (gameActive && isRolling)}
                  >
                    ½
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-white border-casino-muted bg-casino-background hover:bg-casino-accent/20"
                    onClick={() => setBetAmount(Math.min(coins, betAmount * 2))}
                    disabled={betAmount * 2 > coins || (gameActive && isRolling)}
                  >
                    2×
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Difficulty</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDifficulty('easy')}
                    className={`text-white border-casino-muted bg-casino-background hover:bg-green-800/50 ${
                      (isRollOver && targetNumber === 25) || (!isRollOver && targetNumber === 75) 
                        ? 'bg-green-800/50 border-green-500' 
                        : ''
                    }`}
                    disabled={gameActive && isRolling}
                  >
                    Easy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDifficulty('medium')}
                    className={`text-white border-casino-muted bg-casino-background hover:bg-yellow-800/50 ${
                      targetNumber === 50 ? 'bg-yellow-800/50 border-yellow-500' : ''
                    }`}
                    disabled={gameActive && isRolling}
                  >
                    Medium
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDifficulty('hard')}
                    className={`text-white border-casino-muted bg-casino-background hover:bg-red-800/50 ${
                      (isRollOver && targetNumber === 70) || (!isRollOver && targetNumber === 30) 
                        ? 'bg-red-800/50 border-red-500' 
                        : ''
                    }`}
                    disabled={gameActive && isRolling}
                  >
                    Hard
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isRollOver}
                    onCheckedChange={toggleRollMode}
                    disabled={gameActive && isRolling}
                  />
                  <Label className="text-white">Roll {isRollOver ? 'Over' : 'Under'}</Label>
                </div>
                <div className="text-sm text-gray-400">
                  Win Chance: {winChance}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-casino-background p-2 rounded-lg">
                  <p className="text-xs text-gray-400">Multiplier</p>
                  <p className="text-lg font-bold text-blue-400">{multiplier}x</p>
                </div>
                <div className="bg-casino-background p-2 rounded-lg">
                  <p className="text-xs text-gray-400">Potential Win</p>
                  <p className="text-lg font-bold text-green-400">{potentialWin}</p>
                </div>
              </div>

              {!gameActive ? (
                <Button 
                  className="neon-button w-full" 
                  onClick={placeBet}
                  disabled={betAmount <= 0 || betAmount > coins || isRolling}
                >
                  <Dice3 className="mr-2 w-4 h-4" />
                  Roll Dice
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={resetGame}
                  disabled={isRolling}
                >
                  <RefreshCcw className="mr-2 w-4 h-4" />
                  New Bet
                </Button>
              )}
            </div>
          </div>
          
          <div className="game-display bg-casino-card rounded-xl p-4 md:p-6">
            <div className="relative h-[100px] md:h-[150px] flex items-center">
              {/* Gradient background */}
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <div className={`absolute inset-0 ${isRollOver ? 'bg-gradient-to-r from-red-500/50 via-yellow-500/50 to-green-500/50' : 'bg-gradient-to-r from-green-500/50 via-yellow-500/50 to-red-500/50'}`}></div>
                
                {/* Target line */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-blue-400 z-10" 
                  style={{ left: `${targetNumber}%` }}
                ></div>
                
                {/* Result marker */}
                {result !== null && (
                  <div 
                    className={`absolute top-0 bottom-0 w-1 z-20 ${win ? 'bg-green-400' : 'bg-red-400'}`} 
                    style={{ left: `${result}%` }}
                  ></div>
                )}
              </div>
              
              {/* Slider */}
              <div className="w-full px-4 md:px-8 z-10">
                <Slider
                  value={[targetNumber]}
                  min={1}
                  max={99}
                  step={1}
                  onValueChange={handleSetTarget}
                  disabled={gameActive && isRolling}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-blue-400 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-lg [&_[role=slider]]:cursor-pointer [&_[role=slider]]:hover:bg-blue-500 [&_[role=slider]]:focus:ring-2 [&_[role=slider]]:focus:ring-blue-400 [&_[role=slider]]:focus:ring-offset-2 [&_[role=slider]]:focus:ring-offset-casino-card [&_[role=slider]]:transition-all [&_[role=slider]]:duration-200"
                />
                <div className="text-center mt-4">
                  <span className="text-white font-medium text-lg">Target: {formatNumber(targetNumber)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-xl font-bold mb-2 flex items-center text-white">
                {isRollOver ? (
                  <ArrowUp className="text-green-400 mr-2 w-6 h-6" />
                ) : (
                  <ArrowDown className="text-green-400 mr-2 w-6 h-6" />
                )}
                Roll {isRollOver ? 'Over' : 'Under'} {formatNumber(targetNumber)}
              </div>
            </div>
          </div>
        </div>

        {/* How to Play Section - Below Game Board */}
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
                    Set your bet amount and choose a target number (1-99).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">2.</span>
                    Select Roll Over/Under to bet if the roll will be higher/lower than your target.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">3.</span>
                    Use preset difficulties (Easy, Medium, Hard) or set your own target.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">4.</span>
                    The closer your target is to the edge, the higher the multiplier!
                  </li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Strategy Tips</h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-600"></span>
                    <span>Lower risk: Choose targets near 50</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-600"></span>
                    <span>Medium risk: Use preset difficulties</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600"></span>
                    <span>High risk: Set targets near 1 or 99</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <span>Use Auto mode for consistent strategy</span>
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

export default DiceGame;
