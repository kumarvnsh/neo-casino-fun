import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  Play,
  HelpCircle,
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

// Define the type for difficulty keys
type DifficultyKey = keyof typeof DIFFICULTY_PRESETS;

const DragonTower = () => {
  const { coins, updateCoins } = useCoins();
  const [betAmount, setBetAmount] = useState(100);
  const [difficulty, setDifficulty] = useState<DifficultyKey>("medium");
  const [gameActive, setGameActive] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [multipliers, setMultipliers] = useState<Array<number>>([]);
  const [tiles, setTiles] = useState<Array<Array<number>>>([]);
  const [revealedTiles, setRevealedTiles] = useState<Array<Array<boolean>>>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const actionCompletedRef = useRef(false);
  
  // Reset game state when component unmounts or page reloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Reset game state before page reload
      setGameActive(false);
      setCurrentLevel(0);
      setIsGameOver(false);
      setWin(false);
      setIsLoading(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Reset game state when component unmounts
      setGameActive(false);
      setCurrentLevel(0);
      setIsGameOver(false);
      setWin(false);
      setIsLoading(false);
    };
  }, []);
  
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
    // Reset any existing game state first
    setGameActive(false);
    setCurrentLevel(0);
    setIsGameOver(false);
    setWin(false);
    setIsLoading(false);

    // Small delay to ensure state is reset
    setTimeout(() => {
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
      
      // Generate dragon position for each row (only one dragon per row)
      const dragonPositions = Array(MAX_ROWS)
        .fill(0)
        .map(() => Math.floor(Math.random() * columns));
      
      // Initialize tiles with dragons (0 = safe, 1 = dragon)
      const newTiles = Array(MAX_ROWS)
        .fill(0)
        .map((_, rowIndex) => {
          return Array(columns).fill(0).map((_, colIndex) => {
            return colIndex === dragonPositions[rowIndex] ? 1 : 0;
          });
        });
      
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
      }, 200);
    }, 100);
  };
  
  // Handle tile click
  const handleTileClick = (rowIndex: number, colIndex: number) => {
    if (!gameActive || isGameOver || isLoading || revealedTiles[rowIndex][colIndex]) return;
    
    setIsLoading(true);
    
    // Reset completion guard
    actionCompletedRef.current = false;

    // Update revealed tiles
    const newRevealedTiles = [...revealedTiles];
    newRevealedTiles[rowIndex][colIndex] = true;
    setRevealedTiles(newRevealedTiles);
    
    // Check if hit dragon
    if (tiles[rowIndex][colIndex] === 1) {
      setTimeout(() => {
        // Guard against multiple completions
        if (actionCompletedRef.current) return;
        actionCompletedRef.current = true;

        setIsGameOver(true);
        setWin(false);
        
        toast({
          title: "Game Over!",
          description: "You hit a dragon!",
          variant: "destructive",
        });
        
        // Reveal all tiles
        const finalRevealedTiles = [...revealedTiles];
        for (let row = 0; row < MAX_ROWS; row++) {
          for (let col = 0; col < tiles[row].length; col++) {
            finalRevealedTiles[row][col] = true;
          }
        }
        setRevealedTiles(finalRevealedTiles);
        
        setIsLoading(false);
      }, 400);
    } else {
      // Safe tile - move to next level
      const newLevel = currentLevel + 1;
      
      setTimeout(() => {
        // Guard against multiple completions
        if (actionCompletedRef.current) return;
        actionCompletedRef.current = true;

        setCurrentLevel(newLevel);
        setIsLoading(false);
        
        // Check if player reached the top
        if (newLevel >= MAX_ROWS) {
          const winAmount = Math.floor(betAmount * multipliers[MAX_ROWS - 1]);
          updateCoins(winAmount);
          setIsGameOver(true);
          setWin(true);
          
          // Reveal all tiles when winning
          const finalRevealedTiles = [...revealedTiles];
          for (let row = 0; row < MAX_ROWS; row++) {
            for (let col = 0; col < tiles[row].length; col++) {
              finalRevealedTiles[row][col] = true;
            }
          }
          setRevealedTiles(finalRevealedTiles);
          
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
      }, 400);
    }
  };
  
  // Cash out current winnings
  const cashOut = () => {
    if (!gameActive || isGameOver || currentLevel === 0 || isLoading) return;
    
    setIsLoading(true);
    
    // Reset completion guard
    actionCompletedRef.current = false;
    
    const cashOutMultiplier = multipliers[currentLevel - 1];
    const winAmount = Math.floor(betAmount * cashOutMultiplier);
    
    setTimeout(() => {
      // Guard against multiple completions
      if (actionCompletedRef.current) return;
      actionCompletedRef.current = true;

      updateCoins(winAmount);
      
      // Reveal all tiles in all rows
      const finalRevealedTiles = [...revealedTiles];
      for (let row = 0; row < MAX_ROWS; row++) {
        for (let col = 0; col < tiles[row].length; col++) {
          finalRevealedTiles[row][col] = true;
        }
      }
      
      setRevealedTiles(finalRevealedTiles);
      setIsGameOver(true);
      setWin(true);
      
      toast({
        title: "Cashed Out!",
        description: `You cashed out and won ${formatCoins(winAmount)} coins!`,
      });
      setIsLoading(false);
    }, 400);
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
  
  // Handler for difficulty selection - typed to handle DifficultyKey instead of string
  const handleDifficultyChange = (value: DifficultyKey) => {
    setDifficulty(value);
  };
  
  return (
    <MainLayout>
      <div className="game-layout">
        <h1 className="game-title">Dragon Tower</h1>
        
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
                    disabled={gameActive && !isGameOver}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-white border-casino-muted bg-casino-background hover:bg-casino-accent/20"
                    onClick={() => setBetAmount(Math.max(0, Math.floor(betAmount / 2)))}
                    disabled={betAmount <= 10 || (gameActive && !isGameOver)}
                  >
                    ½
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-white border-casino-muted bg-casino-background hover:bg-casino-accent/20"
                    onClick={() => setBetAmount(Math.min(coins, betAmount * 2))}
                    disabled={betAmount * 2 > coins || (gameActive && !isGameOver)}
                  >
                    2×
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-2">Difficulty</p>
                <Select 
                  value={difficulty} 
                  onValueChange={handleDifficultyChange}
                  disabled={gameActive && !isGameOver && !isLoading}
                >
                  <SelectTrigger className="w-full bg-casino-background border-casino-muted text-white">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="bg-casino-card border-casino-muted text-white">
                    {Object.entries(DIFFICULTY_PRESETS).map(([key, diffSettings]) => (
                      <SelectItem 
                        key={key} 
                        value={key as DifficultyKey}
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

              <div>
                <p className="text-sm mt-2 text-gray-400">
                  Max Win: {formatCoins(Math.floor(betAmount * multipliers[MAX_ROWS - 1]))} coins
                </p>
              </div>
              
              {/* Game controls that change based on game state */}
              {!gameActive ? (
                <Button 
                  className="neon-button w-full" 
                  onClick={startGame}
                  disabled={betAmount <= 0 || betAmount > coins}
                >
                  <Play className="mr-2" size={16} />
                  Start Game
                </Button>
              ) : (
                <>
                  {!isGameOver && currentLevel > 0 && (
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
                </>
              )}

              {/* Current game stats */}
              {gameActive && (
                <>
                  <div className="h-px bg-casino-muted my-2"></div>
                  
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
                </>
              )}

              {/* Game stats */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Multipliers:</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {multipliers.slice(0, 5).map((mult, i) => (
                    <div key={i} className={`px-2 py-1 rounded-full ${DIFFICULTY_PRESETS[difficulty].color}/30 ${DIFFICULTY_PRESETS[difficulty].textColor}`}>
                      {i + 1}: {mult}x
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="game-display bg-casino-card rounded-xl p-4 md:p-6 relative min-h-[400px] md:min-h-[500px]">
            <div className="flex flex-col-reverse gap-2 mx-auto h-full items-center justify-center">
              {Array(MAX_ROWS).fill(0).map((_, rowIndex) => {
                const isCurrentLevel = rowIndex === currentLevel && !isGameOver;
                const isFutureLevel = rowIndex > currentLevel;
                const isPastLevel = rowIndex < currentLevel;
                const columnsCount = DIFFICULTY_PRESETS[difficulty].columns;
                
                return (
                  <div 
                    key={rowIndex} 
                    className={`grid gap-2 relative ${isCurrentLevel ? 'z-10' : ''}`}
                    style={{ 
                      gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
                      width: '100%',
                      maxWidth: `${columnsCount * 80}px`
                    }}
                  >
                    {Array(columnsCount).fill(0).map((_, colIndex) => {
                      const isRevealed = revealedTiles[rowIndex]?.[colIndex];
                      const isDragon = tiles[rowIndex]?.[colIndex] === 1;
                      const isClickable = isCurrentLevel && !isLoading;
                      
                      return (
                        <div
                          key={colIndex}
                          onClick={() => handleTileClick(rowIndex, colIndex)}
                          className={`
                            w-full h-[30px] md:h-[40px]
                            flex items-center justify-center rounded-md transition-all duration-300
                            ${isClickable 
                              ? `cursor-pointer border-2 border-${DIFFICULTY_PRESETS[difficulty].color}/50 ${DIFFICULTY_PRESETS[difficulty].color}/30 hover:${DIFFICULTY_PRESETS[difficulty].color}/50` 
                              : isFutureLevel ? 'bg-casino-background/50 cursor-not-allowed opacity-50' : 'bg-casino-background'}
                            ${isPastLevel && !isRevealed ? 'bg-green-800/30' : ''}
                            ${isRevealed && isDragon ? 'bg-red-900/50 border-red-600 border-2' : ''}
                            ${isRevealed && !isDragon ? 'bg-green-700/50 border-green-500 border-2' : ''}
                            ${isLoading && isCurrentLevel ? 'animate-pulse' : ''}
                            ${isCurrentLevel ? 'shadow-lg shadow-primary/20' : ''}
                          `}
                        >
                          {!isRevealed && isClickable ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-casino-muted/30 animate-pulse"></div>
                          ) : isRevealed ? (
                            isDragon ? (
                              <Skull className="text-red-500 w-4 h-4 md:w-5 md:h-5" />
                            ) : (
                              <Check className="text-green-400 w-4 h-4 md:w-5 md:h-5" />
                            )
                          ) : rowIndex === MAX_ROWS - 1 && isCurrentLevel ? (
                            <Trophy className="text-yellow-400 opacity-50 w-4 h-4 md:w-5 md:h-5" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            
            {/* Progress indicator */}
            {gameActive && !isGameOver && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-casino-muted/20">
                <div 
                  className="bg-gradient-to-b from-green-500 to-yellow-500"
                  style={{ 
                    height: `${(currentLevel / MAX_ROWS) * 100}%`,
                    transition: 'height 0.5s ease-out' 
                  }}
                ></div>
              </div>
            )}
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
                    Choose your bet amount and difficulty level (Easy: 4 columns, Medium: 3 columns, Hard: 2 columns).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">2.</span>
                    Click on tiles to find a safe path to the top, avoiding dragons.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">3.</span>
                    Each successful step increases your multiplier.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">4.</span>
                    Cash out anytime to secure your winnings, or reach the top for maximum reward!
                  </li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Difficulty Levels</h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-600"></span>
                    <span>Easy: 4 columns, safer but lower multipliers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-600"></span>
                    <span>Medium: 3 columns, balanced risk and reward</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600"></span>
                    <span>Hard: 2 columns, highest risk but best multipliers</span>
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

export default DragonTower;
