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
  X
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
        
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start">
          {/* Control Panel */}
          <div className="bg-casino-card rounded-xl p-6 w-full md:w-64 flex flex-col gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-2">Bet Amount</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={10}
                  max={coins}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="bg-casino-background border-casino-muted text-white"
                  disabled={gameActive && isRolling}
                />
                <Button 
                  variant="outline" 
                  onClick={() => setBetAmount(Math.floor(betAmount / 2))}
                  className="text-white border-casino-muted bg-casino-background hover:bg-casino-accent/20"
                  disabled={(betAmount <= 10) || (gameActive && isRolling)}
                >
                  ½
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setBetAmount(Math.min(betAmount * 2, coins))}
                  className="text-white border-casino-muted bg-casino-background hover:bg-casino-accent/20"
                  disabled={(betAmount * 2 > coins) || (gameActive && isRolling)}
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
            
            <div className="flex items-center space-x-2">
              <Switch 
                checked={isRollOver} 
                onCheckedChange={toggleRollMode} 
                disabled={gameActive && isRolling}
              />
              <Label>
                Roll {isRollOver ? 'Over' : 'Under'}
              </Label>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Multiplier</span>
                <span>{multiplier}x</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Win Chance</span>
                <span>{winChance}%</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Potential Win</span>
                <span>{potentialWin} coins</span>
              </div>
            </div>
            
            {!gameActive || !isRolling ? (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 mt-2" 
                onClick={placeBet}
                disabled={isRolling || betAmount <= 0 || betAmount > coins}
              >
                <Dice3 className="mr-2" size={16} />
                {gameActive ? 'Roll Again' : 'Roll Dice'}
              </Button>
            ) : (
              <Button className="w-full mt-2" disabled>
                <RefreshCcw className="mr-2 animate-spin" size={16} />
                Rolling...
              </Button>
            )}
            
            {gameActive && !isRolling && (
              <Button 
                variant="outline" 
                className="w-full mt-2" 
                onClick={resetGame}
              >
                <RefreshCcw className="mr-2" size={16} />
                Reset
              </Button>
            )}
          </div>
          
          {/* Game Display */}
          <div className="flex-1 bg-casino-card rounded-xl p-6">
            <div className="mb-6">
              <div className="flex justify-between mb-2 text-sm">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
              
              <div className="relative h-12 bg-casino-background rounded-md overflow-hidden">
                {/* Red zone (losing area) */}
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-red-600/70 h-full rounded-l-md" 
                  style={{ 
                    width: `${isRollOver ? targetNumber : 100 - targetNumber}%`,
                    right: isRollOver ? 'auto' : '0',
                    left: isRollOver ? '0' : 'auto',
                    borderRadius: isRollOver ? '0.375rem 0 0 0.375rem' : '0 0.375rem 0.375rem 0'
                  }}
                ></div>
                
                {/* Green zone (winning area) */}
                <div 
                  className="absolute top-0 bottom-0 right-0 bg-green-600/70 h-full rounded-r-md" 
                  style={{ 
                    width: `${isRollOver ? 100 - targetNumber : targetNumber}%`,
                    right: isRollOver ? '0' : 'auto',
                    left: isRollOver ? 'auto' : '0',
                    borderRadius: isRollOver ? '0 0.375rem 0.375rem 0' : '0.375rem 0 0 0.375rem'
                  }}
                ></div>
                
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
              <div className="py-8">
                <Slider
                  value={[targetNumber]}
                  min={1}
                  max={99}
                  step={1}
                  onValueChange={handleSetTarget}
                  disabled={gameActive && isRolling}
                />
                <div className="text-center mt-2">
                  <span className="text-white font-medium">Target: {formatNumber(targetNumber)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-xl font-bold mb-2 flex items-center">
                {isRollOver ? (
                  <ArrowUp className="text-green-400 mr-2" />
                ) : (
                  <ArrowDown className="text-green-400 mr-2" />
                )}
                Roll {isRollOver ? 'Over' : 'Under'} {formatNumber(targetNumber)}
              </div>
              
              {result !== null && (
                <div className="mt-4 p-6 rounded-lg bg-casino-background/50 w-full max-w-md">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{formatNumber(result)}</div>
                    <div className={`text-xl ${win ? 'text-green-400' : 'text-red-400'} font-semibold`}>
                      {win ? (
                        <div className="flex items-center justify-center">
                          <Trophy className="mr-2" />
                          You Win!
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <X className="mr-2" />
                          You Lose
                        </div>
                      )}
                    </div>
                    {win && (
                      <div className="text-green-400 mt-2 flex items-center justify-center">
                        <Coins className="mr-2" size={16} />
                        +{potentialWin} coins
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-casino-card rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold mb-2 text-white">How to Play</h2>
          <div className="space-y-2 text-gray-300">
            <p>1. Set your bet amount</p>
            <p>2. Choose a target number between 1 and 99</p>
            <p>3. Select whether to roll over or under your target number</p>
            <p>4. The dice will roll a random number between 0 and 100</p>
            <p>5. If your prediction is correct, you win the specified multiplier</p>
            <p>6. The lower your win chance, the higher your potential reward</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DiceGame;
