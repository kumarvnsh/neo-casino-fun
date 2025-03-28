
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCoins } from '@/contexts/CoinContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Trophy, 
  ArrowRight, 
  Skull, 
  Coins,
  AlertTriangle,
  RefreshCcw,
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

const DragonTower = () => {
  const { coins, updateCoins } = useCoins();
  const [betAmount, setBetAmount] = useState(100);
  const [towerHeight, setTowerHeight] = useState(5);
  const [gameActive, setGameActive] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [towerState, setTowerState] = useState<Array<number>>([]);
  const [multipliers, setMultipliers] = useState<Array<number>>([]);
  const [tiles, setTiles] = useState<Array<Array<number>>>([]);
  const [revealedTiles, setRevealedTiles] = useState<Array<Array<boolean>>>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [win, setWin] = useState(false);
  
  // Calculate multipliers based on tower height
  useEffect(() => {
    const newMultipliers = Array(towerHeight)
      .fill(0)
      .map((_, i) => Number((1 + (i + 1) * 0.4).toFixed(2)));
    setMultipliers(newMultipliers);
  }, [towerHeight]);
  
  // Generate a new game
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
    
    // Generate safe path
    const safePath = Array(towerHeight)
      .fill(0)
      .map(() => Math.floor(Math.random() * 3));
    
    // Initialize tiles as empty (0 = empty, 1 = dragon)
    const newTiles = Array(towerHeight)
      .fill(0)
      .map(() => [0, 0, 0]);
      
    // Place dragons on unsafe tiles
    for (let row = 0; row < towerHeight; row++) {
      for (let col = 0; col < 3; col++) {
        if (col !== safePath[row]) {
          newTiles[row][col] = 1; // 1 = dragon
        }
      }
    }
    
    // Initialize revealed state for all tiles (all hidden)
    const newRevealedTiles = Array(towerHeight)
      .fill(0)
      .map(() => [false, false, false]);
    
    setTiles(newTiles);
    setTowerState(safePath);
    setRevealedTiles(newRevealedTiles);
    setCurrentLevel(0);
    setGameActive(true);
    setIsGameOver(false);
    setWin(false);
  };
  
  // Handle tile click
  const handleTileClick = (rowIndex: number, colIndex: number) => {
    if (!gameActive || rowIndex !== currentLevel || isGameOver) return;
    
    // Create a copy of the revealed state
    const newRevealedTiles = [...revealedTiles];
    newRevealedTiles[rowIndex][colIndex] = true;
    setRevealedTiles(newRevealedTiles);
    
    // Check if the tile is safe
    if (tiles[rowIndex][colIndex] === 1) {
      // Hit a dragon - game over
      setIsGameOver(true);
      
      // Reveal the safe path
      const finalRevealedTiles = Array(towerHeight)
        .fill(0)
        .map((_, rowIdx) => 
          Array(3).fill(0).map((_, colIdx) => 
            rowIdx <= currentLevel || tiles[rowIdx][colIdx] === 0
          )
        );
      
      setTimeout(() => {
        setRevealedTiles(finalRevealedTiles);
        toast({
          title: "Game Over!",
          description: "You hit a dragon! Better luck next time.",
          variant: "destructive",
        });
      }, 500);
    } else {
      // Safe tile - move to next level
      const newLevel = currentLevel + 1;
      setCurrentLevel(newLevel);
      
      // Check if player reached the top
      if (newLevel >= towerHeight) {
        const winAmount = Math.floor(betAmount * multipliers[towerHeight - 1]);
        updateCoins(winAmount);
        setIsGameOver(true);
        setWin(true);
        toast({
          title: "Congratulations!",
          description: `You reached the top and won ${winAmount} coins!`,
        });
      }
    }
  };
  
  // Cash out current winnings
  const cashOut = () => {
    if (!gameActive || isGameOver || currentLevel === 0) return;
    
    const cashOutMultiplier = multipliers[currentLevel - 1];
    const winAmount = Math.floor(betAmount * cashOutMultiplier);
    updateCoins(winAmount);
    
    // Reveal the safe path for current level
    const finalRevealedTiles = Array(towerHeight)
      .fill(0)
      .map((_, rowIdx) => 
        Array(3).fill(rowIdx <= currentLevel - 1)
      );
    
    setRevealedTiles(finalRevealedTiles);
    setIsGameOver(true);
    setWin(true);
    
    toast({
      title: "Cashed Out!",
      description: `You cashed out and won ${winAmount} coins!`,
    });
  };
  
  const resetGame = () => {
    setGameActive(false);
    setCurrentLevel(0);
    setIsGameOver(false);
    setWin(false);
  };
  
  // Calculate current potential win
  const currentWin = currentLevel > 0 ? Math.floor(betAmount * multipliers[currentLevel - 1]) : 0;
  
  return (
    <MainLayout>
      <div className="game-layout">
        <h1 className="game-title">Dragon Tower</h1>
        
        {!gameActive ? (
          <div className="control-panel">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-white">Game Setup</h2>
              <p className="text-gray-400 mb-4">Choose your bet amount and tower height</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bet Amount: {betAmount} coins
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={10}
                      max={coins}
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      className="bg-casino-background border-casino-muted text-white"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setBetAmount(Math.floor(betAmount / 2))}
                      className="text-white border-casino-muted"
                      disabled={betAmount <= 10}
                    >
                      ½
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setBetAmount(Math.min(betAmount * 2, coins))}
                      className="text-white border-casino-muted"
                      disabled={betAmount * 2 > coins}
                    >
                      2×
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tower Height: {towerHeight} levels
                  </label>
                  <Slider
                    value={[towerHeight]}
                    min={3}
                    max={10}
                    step={1}
                    onValueChange={(value) => setTowerHeight(value[0])}
                    className="py-4"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Potential Multipliers:</h3>
                <div className="flex flex-wrap gap-2">
                  {multipliers.map((mult, i) => (
                    <div key={i} className="px-3 py-1 bg-casino-muted/30 rounded-full text-sm">
                      Level {i + 1}: {mult}x
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <Button 
              className="neon-button w-full md:w-auto" 
              onClick={startGame}
              disabled={betAmount <= 0 || betAmount > coins}
            >
              Start Game
            </Button>
          </div>
        ) : (
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-start">
            <div className="bg-casino-card rounded-xl p-6 w-full md:w-64 flex flex-col gap-4">
              <div>
                <p className="text-gray-400 text-sm">Bet Amount</p>
                <p className="text-xl font-bold text-white">{betAmount} coins</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Current Level</p>
                <p className="text-xl font-bold text-white">{currentLevel} / {towerHeight}</p>
              </div>
              
              {currentLevel > 0 && (
                <div>
                  <p className="text-gray-400 text-sm">Current Win</p>
                  <p className="text-xl font-bold text-green-500">{currentWin} coins</p>
                </div>
              )}
              
              {!isGameOver && gameActive && currentLevel > 0 && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 mt-2" 
                  onClick={cashOut}
                >
                  <Coins className="mr-2" size={16} />
                  Cash Out ({multipliers[currentLevel - 1]}x)
                </Button>
              )}
              
              {isGameOver && (
                <Button 
                  className="w-full mt-2" 
                  onClick={resetGame}
                >
                  <RefreshCcw className="mr-2" size={16} />
                  Play Again
                </Button>
              )}
            </div>
            
            <div className="flex-1 bg-casino-card rounded-xl p-6">
              <div className="flex flex-col-reverse gap-2">
                {Array(towerHeight).fill(0).map((_, rowIndex) => (
                  <div 
                    key={rowIndex} 
                    className={`grid grid-cols-3 gap-3 ${rowIndex === currentLevel && !isGameOver ? 'animate-pulse-glow' : ''}`}
                  >
                    {[0, 1, 2].map((colIndex) => {
                      const isRevealed = revealedTiles[rowIndex]?.[colIndex];
                      const isDragon = tiles[rowIndex]?.[colIndex] === 1;
                      const isClickable = rowIndex === currentLevel && !isGameOver;
                      
                      return (
                        <div
                          key={colIndex}
                          onClick={() => handleTileClick(rowIndex, colIndex)}
                          className={`
                            aspect-square flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300
                            ${isClickable 
                              ? 'bg-casino-primary/30 hover:bg-casino-primary/50' 
                              : 'bg-casino-background'}
                            ${rowIndex < currentLevel ? 'bg-green-800/30' : ''}
                            ${isRevealed && isDragon ? 'bg-red-900/50' : ''}
                            ${isRevealed && !isDragon ? 'bg-green-700/50' : ''}
                          `}
                        >
                          {isRevealed ? (
                            isDragon ? (
                              <Skull className="text-red-500" size={24} />
                            ) : (
                              <ArrowRight className="text-green-400" size={24} />
                            )
                          ) : rowIndex === towerHeight - 1 && rowIndex === currentLevel ? (
                            <Trophy className="text-yellow-400 opacity-50" size={24} />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              
              {isGameOver && (
                <div className={`mt-4 p-4 rounded-lg ${win ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                  <div className="flex items-center gap-2">
                    {win ? (
                      <Trophy className="text-yellow-400" size={20} />
                    ) : (
                      <AlertTriangle className="text-red-400" size={20} />
                    )}
                    <h3 className="font-semibold text-white">
                      {win ? 'You Win!' : 'Game Over!'}
                    </h3>
                  </div>
                  <p className="text-gray-300 mt-1">
                    {win 
                      ? `You reached level ${currentLevel} and won ${currentWin} coins!` 
                      : 'You hit a dragon! Better luck next time.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-casino-card rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold mb-2 text-white">How to Play</h2>
          <div className="space-y-2 text-gray-300">
            <p>1. Choose your bet amount and tower height</p>
            <p>2. Each level has 3 tiles - one safe path and two dragons</p>
            <p>3. Click on a tile to reveal it - if it's safe, you'll move to the next level</p>
            <p>4. If you hit a dragon, you lose your bet</p>
            <p>5. You can cash out at any time to secure your winnings</p>
            <p>6. The higher you climb, the bigger the multiplier!</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DragonTower;
