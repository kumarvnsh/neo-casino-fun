
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCoins } from '@/contexts/CoinContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Trophy, 
  ArrowRight, 
  Skull, 
  Coins,
  AlertTriangle,
  RefreshCcw,
  List,
  Check,
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCoins } from '@/utils/coinManager';
import { Skeleton } from "@/components/ui/skeleton";

// Game configuration
const MAX_ROWS = 9; // Fixed 9 rows as per requirement

// Difficulty presets
const DIFFICULTY_PRESETS = {
  easy: { 
    name: "Easy", 
    columns: 4, 
    dragonCount: 1, 
    baseMultiplier: 1.2,
    color: "bg-green-600",
    textColor: "text-green-500",
    description: "4 columns, 1 dragon per row" 
  },
  medium: { 
    name: "Medium", 
    columns: 3, 
    dragonCount: 1, 
    baseMultiplier: 1.5,
    color: "bg-yellow-600",
    textColor: "text-yellow-500",
    description: "3 columns, 1 dragon per row" 
  },
  hard: { 
    name: "Hard", 
    columns: 2, 
    dragonCount: 1, 
    baseMultiplier: 2.0,
    color: "bg-red-600",
    textColor: "text-red-500",
    description: "2 columns, 1 dragon per row" 
  }
};

const DragonTower = () => {
  const { coins, updateCoins } = useCoins();
  const [betAmount, setBetAmount] = useState(100);
  const [difficulty, setDifficulty] = useState<keyof typeof DIFFICULTY_PRESETS>("medium");
  const [gameActive, setGameActive] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [multipliers, setMultipliers] = useState<Array<number>>([]);
  const [tiles, setTiles] = useState<Array<Array<number>>>([]);
  const [revealedTiles, setRevealedTiles] = useState<Array<Array<boolean>>>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate multipliers based on difficulty
  useEffect(() => {
    const difficultySettings = DIFFICULTY_PRESETS[difficulty];
    const baseMultiplier = difficultySettings.baseMultiplier;
    
    // Calculate progressive multipliers for each row
    const newMultipliers = Array(MAX_ROWS)
      .fill(0)
      .map((_, i) => {
        return parseFloat((Math.pow(baseMultiplier, i + 1)).toFixed(2));
      });
    
    setMultipliers(newMultipliers);
  }, [difficulty]);
  
  // Generate a new game
  const startGame = () => {
    setIsLoading(true);
    
    if (betAmount <= 0) {
      toast({
        title: "Invalid bet amount",
        description: "Please enter a bet amount greater than 0",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    if (betAmount > coins) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough coins for this bet",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Deduct bet amount
    updateCoins(-betAmount);
    
    const difficultySettings = DIFFICULTY_PRESETS[difficulty];
    const columns = difficultySettings.columns;
    
    // Generate safe paths for each row
    const safePaths = Array(MAX_ROWS)
      .fill(0)
      .map(() => Math.floor(Math.random() * columns));
    
    // Initialize tiles as empty (0 = empty, 1 = dragon)
    const newTiles = Array(MAX_ROWS)
      .fill(0)
      .map(() => Array(columns).fill(0));
      
    // Place dragons on unsafe tiles
    for (let row = 0; row < MAX_ROWS; row++) {
      for (let col = 0; col < columns; col++) {
        if (col !== safePaths[row]) {
          newTiles[row][col] = 1; // 1 = dragon
        }
      }
    }
    
    // Initialize revealed state for all tiles (all hidden)
    const newRevealedTiles = Array(MAX_ROWS)
      .fill(0)
      .map(() => Array(columns).fill(false));
    
    setTiles(newTiles);
    setRevealedTiles(newRevealedTiles);
    setCurrentLevel(0);
    setGameActive(true);
    setIsGameOver(false);
    setWin(false);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };
  
  // Handle tile click
  const handleTileClick = (rowIndex: number, colIndex: number) => {
    if (!gameActive || rowIndex !== currentLevel || isGameOver || isLoading) return;
    
    setIsLoading(true);
    
    // Create a copy of the revealed state
    const newRevealedTiles = [...revealedTiles];
    newRevealedTiles[rowIndex][colIndex] = true;
    setRevealedTiles(newRevealedTiles);
    
    // Check if the tile is safe
    if (tiles[rowIndex][colIndex] === 1) {
      // Hit a dragon - game over
      setIsGameOver(true);
      
      // Reveal the safe path for the current row
      const finalRevealedTiles = [...newRevealedTiles];
      for (let col = 0; col < tiles[rowIndex].length; col++) {
        finalRevealedTiles[rowIndex][col] = true;
      }
      
      setTimeout(() => {
        setRevealedTiles(finalRevealedTiles);
        toast({
          title: "Game Over!",
          description: "You hit a dragon! Better luck next time.",
          variant: "destructive",
        });
        setIsLoading(false);
      }, 800);
    } else {
      // Safe tile - move to next level
      const newLevel = currentLevel + 1;
      
      setTimeout(() => {
        setCurrentLevel(newLevel);
        setIsLoading(false);
        
        // Check if player reached the top
        if (newLevel >= MAX_ROWS) {
          const winAmount = Math.floor(betAmount * multipliers[MAX_ROWS - 1]);
          updateCoins(winAmount);
          setIsGameOver(true);
          setWin(true);
          toast({
            title: "Congratulations!",
            description: `You reached the top and won ${formatCoins(winAmount)} coins!`,
          });
        } else {
          toast({
            title: "Safe Path!",
            description: `You found the safe path. Current multiplier: ${multipliers[currentLevel]}x`,
          });
        }
      }, 800);
    }
  };
  
  // Cash out current winnings
  const cashOut = () => {
    if (!gameActive || isGameOver || currentLevel === 0 || isLoading) return;
    
    setIsLoading(true);
    
    const cashOutMultiplier = multipliers[currentLevel - 1];
    const winAmount = Math.floor(betAmount * cashOutMultiplier);
    updateCoins(winAmount);
    
    // Reveal the safe path for current level
    const finalRevealedTiles = [...revealedTiles];
    for (let row = 0; row <= currentLevel - 1; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        finalRevealedTiles[row][col] = true;
      }
    }
    
    setRevealedTiles(finalRevealedTiles);
    setIsGameOver(true);
    setWin(true);
    
    setTimeout(() => {
      toast({
        title: "Cashed Out!",
        description: `You cashed out and won ${formatCoins(winAmount)} coins!`,
      });
      setIsLoading(false);
    }, 800);
  };
  
  const resetGame = () => {
    setGameActive(false);
    setCurrentLevel(0);
    setIsGameOver(false);
    setWin(false);
    setIsLoading(false);
  };
  
  // Calculate current potential win
  const currentWin = currentLevel > 0 ? Math.floor(betAmount * multipliers[currentLevel - 1]) : 0;
  
  return (
    <MainLayout>
      <div className="game-layout pb-20">
        <h1 className="game-title flex items-center gap-2">
          <Skull className="h-8 w-8 text-red-500" />
          Dragon Tower
        </h1>
        
        {!gameActive ? (
          <div className="control-panel">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-white">Game Setup</h2>
              <p className="text-gray-400 mb-4">Choose your difficulty and bet amount</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bet Amount: {formatCoins(betAmount)} coins
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
                    <Button 
                      variant="outline" 
                      onClick={() => setBetAmount(Math.min(coins, 1000))}
                      className="text-white border-casino-muted"
                    >
                      Max
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="w-full bg-casino-background border-casino-muted text-white">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-casino-card border-casino-muted text-white">
                      {Object.entries(DIFFICULTY_PRESETS).map(([key, diffSettings]) => (
                        <SelectItem 
                          key={key} 
                          value={key}
                          className="focus:bg-casino-primary/50 focus:text-white"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${diffSettings.color}`}></span>
                            <span>{diffSettings.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm mt-2 text-gray-400">
                    {DIFFICULTY_PRESETS[difficulty].description}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Potential Multipliers:</h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  {multipliers.map((mult, i) => (
                    <div key={i} className={`px-3 py-1 rounded-full text-sm ${DIFFICULTY_PRESETS[difficulty].color}/30 ${DIFFICULTY_PRESETS[difficulty].textColor}`}>
                      Row {i + 1}: {mult}x
                    </div>
                  ))}
                </div>
                <p className="text-sm mt-2 text-gray-400">
                  Max Win: {formatCoins(Math.floor(betAmount * multipliers[MAX_ROWS - 1]))} coins
                </p>
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
                <p className="text-xl font-bold text-white">{formatCoins(betAmount)} coins</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Difficulty</p>
                <p className={`text-xl font-bold ${DIFFICULTY_PRESETS[difficulty].textColor}`}>
                  {DIFFICULTY_PRESETS[difficulty].name}
                </p>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm">Current Level</p>
                <p className="text-xl font-bold text-white">{currentLevel} / {MAX_ROWS}</p>
              </div>
              
              {currentLevel > 0 && (
                <div>
                  <p className="text-gray-400 text-sm">Current Win</p>
                  <p className="text-xl font-bold text-green-500">{formatCoins(currentWin)} coins</p>
                </div>
              )}
              
              {!isGameOver && gameActive && currentLevel > 0 && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 mt-2" 
                  onClick={cashOut}
                  disabled={isLoading}
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
              <div className="flex flex-col-reverse gap-3">
                {Array(MAX_ROWS).fill(0).map((_, rowIndex) => {
                  const isCurrentLevel = rowIndex === currentLevel && !isGameOver;
                  const isFutureLevel = rowIndex > currentLevel;
                  const columnsCount = DIFFICULTY_PRESETS[difficulty].columns;
                  
                  return (
                    <div 
                      key={rowIndex} 
                      className={`grid grid-cols-${columnsCount} gap-3`}
                      style={{ gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))` }}
                    >
                      {Array(columnsCount).fill(0).map((_, colIndex) => {
                        const isRevealed = revealedTiles[rowIndex]?.[colIndex];
                        const isDragon = tiles[rowIndex]?.[colIndex] === 1;
                        const isClickable = isCurrentLevel && !isLoading;
                        const isPastLevel = rowIndex < currentLevel;
                        
                        return (
                          <div
                            key={colIndex}
                            onClick={() => handleTileClick(rowIndex, colIndex)}
                            className={`
                              aspect-square flex items-center justify-center rounded-lg transition-all duration-300
                              ${isClickable 
                                ? `cursor-pointer ${DIFFICULTY_PRESETS[difficulty].color}/30 hover:${DIFFICULTY_PRESETS[difficulty].color}/50` 
                                : isFutureLevel ? 'bg-casino-background/50 cursor-not-allowed opacity-50' : 'bg-casino-background'}
                              ${isPastLevel && !isRevealed ? 'bg-green-800/30' : ''}
                              ${isRevealed && isDragon ? 'bg-red-900/50' : ''}
                              ${isRevealed && !isDragon ? 'bg-green-700/50' : ''}
                              ${isLoading && isCurrentLevel ? 'animate-pulse' : ''}
                            `}
                          >
                            {isLoading && rowIndex === currentLevel && !isRevealed ? (
                              <Skeleton className="w-6 h-6 rounded-full bg-casino-muted/30" />
                            ) : isRevealed ? (
                              isDragon ? (
                                <Skull className="text-red-500" size={24} />
                              ) : (
                                <Check className="text-green-400" size={24} />
                              )
                            ) : rowIndex === MAX_ROWS - 1 && isCurrentLevel ? (
                              <Trophy className="text-yellow-400 opacity-50" size={24} />
                            ) : isFutureLevel ? (
                              <span className="text-xs text-gray-500 opacity-50">{rowIndex + 1}</span>
                            ) : null}
                          </div>
                        );
                      })}
                      <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 hidden md:block">
                        <span className={`px-2 py-1 rounded ${isCurrentLevel ? DIFFICULTY_PRESETS[difficulty].color : 'bg-casino-muted/30'} text-xs font-bold`}>
                          {multipliers[rowIndex]}x
                        </span>
                      </div>
                    </div>
                  );
                })}
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
                      ? `You reached level ${currentLevel} and won ${formatCoins(currentWin)} coins!` 
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
            <p>1. Choose your difficulty level and bet amount</p>
            <p>2. Each row has multiple tiles - only one safe path and the rest are dragons</p>
            <p>3. Click on a tile to reveal it - if it's safe, you'll move up to the next row</p>
            <p>4. Each level has a different multiplier - the higher you climb, the bigger the reward!</p>
            <p>5. You can cash out at any time to secure your winnings</p>
            <p>6. If you hit a dragon, you lose your entire bet</p>
            <p>7. Reach the top of the tower for the maximum reward!</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {Object.entries(DIFFICULTY_PRESETS).map(([key, diffSettings]) => (
              <div key={key} className={`p-3 rounded-lg ${diffSettings.color}/20 border border-${diffSettings.color}/30`}>
                <h3 className={`font-semibold ${diffSettings.textColor} mb-1`}>{diffSettings.name}</h3>
                <p className="text-sm text-gray-400">{diffSettings.description}</p>
                <p className="text-xs mt-1 text-gray-500">Base Multiplier: {diffSettings.baseMultiplier}x</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DragonTower;
