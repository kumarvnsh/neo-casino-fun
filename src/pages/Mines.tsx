import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCoins } from '@/contexts/CoinContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Bomb, 
  Gem, 
  HelpCircle, 
  RefreshCcw, 
  Coins,
  AlertTriangle,
  Play
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { formatCoins } from '@/utils/coinManager';

// Constants
const GRID_SIZE = 25; // 5x5 grid
const MIN_MINES = 1;
const MAX_MINES = 24;

const Mines = () => {
  const { coins, updateCoins } = useCoins();
  const [betAmount, setBetAmount] = useState(100);
  const [mineCount, setMineCount] = useState(5);
  const [gameActive, setGameActive] = useState(false);
  const [grid, setGrid] = useState<Array<number>>([]);
  const [revealed, setRevealed] = useState<Array<boolean>>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [nextMultiplier, setNextMultiplier] = useState(1);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [autoRevealed, setAutoRevealed] = useState(0);
  const [autoTarget, setAutoTarget] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const actionCompletedRef = useRef(false);
  
  // Calculate the next tile multiplier based on current state
  useEffect(() => {
    if (!gameActive) return;
    
    // Calculate how many safe tiles have been revealed
    const revealedCount = revealed.filter(r => r).length;
    const safeTiles = GRID_SIZE - mineCount;
    const remainingSafeTiles = safeTiles - revealedCount;
    
    if (remainingSafeTiles <= 0) {
      // Player has revealed all safe tiles - they win!
      setIsGameOver(true);
      setWin(true);
      const finalWin = Math.floor(betAmount * currentMultiplier);
      updateCoins(finalWin);
      toast({
        title: "Congratulations!",
        description: `You found all gems and won ${formatCoins(finalWin)} coins!`,
      });
      return;
    }
    
    // Calculate next multiplier (this is a simplified formula - can be adjusted)
    const odds = (remainingSafeTiles) / (GRID_SIZE - revealedCount);
    const nextMult = Number((currentMultiplier * (1 / odds)).toFixed(2));
    setNextMultiplier(nextMult);
  }, [revealed, gameActive, mineCount, currentMultiplier, betAmount, updateCoins]);
  
  // Start a new game
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
    
    // Reset completion guard
    actionCompletedRef.current = false;
    
    // Deduct bet amount
    updateCoins(-betAmount);
    
    // Create a grid of 25 tiles (0 = gem, 1 = mine)
    const newGrid = Array(GRID_SIZE).fill(0);
    
    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const randomIndex = Math.floor(Math.random() * GRID_SIZE);
      if (newGrid[randomIndex] === 0) {
        newGrid[randomIndex] = 1;
        minesPlaced++;
      }
    }
    
    setGrid(newGrid);
    setRevealed(Array(GRID_SIZE).fill(false));
    setGameActive(true);
    setIsGameOver(false);
    setWin(false);
    setCurrentMultiplier(1);
    setIsAutoMode(false);
    setAutoRevealed(0);
    
    // Calculate first multiplier
    const odds = (GRID_SIZE - mineCount) / GRID_SIZE;
    setNextMultiplier(Number((1 / odds).toFixed(2)));
    
    setIsLoading(false);
  };
  
  // Handle tile click
  const handleTileClick = (index: number) => {
    if (!gameActive || isGameOver || revealed[index] || isLoading) return;
    
    setIsLoading(true);
    
    // Reset completion guard
    actionCompletedRef.current = false;
    
    // Update revealed tiles
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);
    
    // Check if hit mine
    if (grid[index] === 1) {
      setTimeout(() => {
        // Guard against multiple completions
        if (actionCompletedRef.current) return;
        actionCompletedRef.current = true;

        setIsGameOver(true);
        setWin(false);
        setIsAutoMode(false);
        
        // Reveal all mines
        const finalRevealed = grid.map((tile, i) => {
          return tile === 1 || revealed[i];
        });
        setRevealed(finalRevealed);
        
        toast({
          title: "Game Over!",
          description: "You hit a mine!",
          variant: "destructive",
        });
        
        setIsLoading(false);
      }, 400);
    } else {
      setTimeout(() => {
        // Guard against multiple completions
        if (actionCompletedRef.current) return;
        actionCompletedRef.current = true;

        // Update multiplier
        setCurrentMultiplier(nextMultiplier);
        
        // Check if all safe tiles are revealed
        const safeTiles = GRID_SIZE - mineCount;
        const revealedSafeTiles = newRevealed.filter((r, i) => r && grid[i] === 0).length;
        
        if (revealedSafeTiles === safeTiles) {
          // Player has revealed all safe tiles - they win!
          const finalWin = Math.floor(betAmount * nextMultiplier);
          updateCoins(finalWin);
          setIsGameOver(true);
          setWin(true);
          setIsAutoMode(false);
          
          toast({
            title: "Congratulations!",
            description: `You found all gems and won ${formatCoins(finalWin)} coins!`,
          });
        } else {
          // Calculate next multiplier
          const remainingSafeTiles = safeTiles - revealedSafeTiles;
          const odds = remainingSafeTiles / (GRID_SIZE - revealedSafeTiles);
          const nextMult = Number((nextMultiplier * (1 / odds)).toFixed(2));
          setNextMultiplier(nextMult);
          
          if (isAutoMode) {
            setAutoRevealed(prev => prev + 1);
            if (autoRevealed + 1 >= autoTarget) {
              cashOut();
            }
          }
        }
        
        setIsLoading(false);
      }, 400);
    }
  };
  
  // Start auto mode
  const startAutoMode = () => {
    if (!gameActive || isGameOver || isLoading) return;
    setIsAutoMode(true);
    toast({
      title: "Auto Mode Activated",
      description: `Will auto-cashout after revealing ${autoTarget} safe gems.`,
    });
  };
  
  // Cash out current winnings
  const cashOut = () => {
    if (!gameActive || isGameOver || isLoading) return;
    
    setIsLoading(true);
    
    // Reset completion guard
    actionCompletedRef.current = false;
    
    setTimeout(() => {
      // Guard against multiple completions
      if (actionCompletedRef.current) return;
      actionCompletedRef.current = true;

      const winAmount = Math.floor(betAmount * currentMultiplier);
      updateCoins(winAmount);
      
      // Reveal all mines
      const finalRevealed = grid.map((tile, i) => {
        return tile === 1 || revealed[i];
      });
      
      setRevealed(finalRevealed);
      setIsGameOver(true);
      setWin(true);
      setIsAutoMode(false);
      
      toast({
        title: "Cashed Out!",
        description: `You cashed out and won ${formatCoins(winAmount)} coins!`,
      });
      
      setIsLoading(false);
    }, 400);
  };
  
  const resetGame = () => {
    setGameActive(false);
    setIsGameOver(false);
    setWin(false);
    setIsAutoMode(false);
    setIsLoading(false);
  };
  
  // Calculate current potential win
  const currentWin = Math.floor(betAmount * currentMultiplier);
  const nextWin = Math.floor(betAmount * nextMultiplier);
  
  // Calculate opened safe tiles count
  const openedSafeTiles = revealed.filter((r, i) => r && grid[i] === 0).length;
  const totalSafeTiles = GRID_SIZE - mineCount;
  
  // Calculate probability of next safe click
  const safeProb = Math.floor(((GRID_SIZE - mineCount - openedSafeTiles) / (GRID_SIZE - openedSafeTiles)) * 100);
  
  return (
    <MainLayout>
      <div className="game-layout">
        <h1 className="game-title">Mines</h1>
        
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
                <p className="text-gray-400 text-sm mb-2">Number of Mines</p>
                <div className="space-y-2">
                  <Slider
                    value={[mineCount]}
                    onValueChange={([value]) => setMineCount(value)}
                    min={MIN_MINES}
                    max={MAX_MINES}
                    step={1}
                    disabled={gameActive && !isGameOver}
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{MIN_MINES}</span>
                    <span>{mineCount} mines</span>
                    <span>{MAX_MINES}</span>
                  </div>
                </div>
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-casino-background p-2 rounded-lg">
                  <p className="text-xs text-gray-400">Next Multiplier</p>
                  <p className="text-lg font-bold text-blue-400">{nextMultiplier}x</p>
                </div>
                <div className="bg-casino-background p-2 rounded-lg">
                  <p className="text-xs text-gray-400">Safe Chance</p>
                  <p className="text-lg font-bold text-yellow-400">{safeProb}%</p>
                </div>
              </div>

              {/* Game Controls */}
              {!gameActive ? (
                <Button 
                  className="neon-button w-full" 
                  onClick={startGame}
                  disabled={betAmount <= 0 || betAmount > coins || isLoading}
                >
                  <Play className="mr-2 w-4 h-4" />
                  Start Game
                </Button>
              ) : (
                <>
                  {!isGameOver && (
                    <>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700" 
                        onClick={cashOut}
                        disabled={isLoading}
                      >
                        <Coins className="mr-2 w-4 h-4" />
                        Cash Out ({currentMultiplier}x)
                      </Button>
                      
                      {!isAutoMode && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min={1}
                              max={totalSafeTiles - openedSafeTiles}
                              value={autoTarget}
                              onChange={(e) => setAutoTarget(Number(e.target.value))}
                              className="bg-casino-background border-casino-muted text-white"
                              placeholder="# of clicks"
                            />
                            <Button 
                              className="bg-blue-600 hover:bg-blue-700" 
                              onClick={startAutoMode}
                              disabled={isLoading}
                            >
                              Auto
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {isGameOver && (
                    <Button 
                      className="w-full" 
                      onClick={resetGame}
                      disabled={isLoading}
                    >
                      <RefreshCcw className="mr-2 w-4 h-4" />
                      Play Again
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Game Grid */}
          <div className="game-display bg-casino-card rounded-xl p-4 md:p-6">
            <div className="grid grid-cols-5 gap-2 md:gap-3 max-w-[500px] mx-auto">
              {Array(GRID_SIZE).fill(0).map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleTileClick(index)}
                  disabled={!gameActive || isGameOver || revealed[index] || isLoading}
                  className={`
                    aspect-square w-full
                    rounded-lg flex items-center justify-center
                    transition-all duration-200
                    ${revealed[index]
                      ? grid[index] === 1
                        ? 'bg-red-500/20 border-red-500'
                        : 'bg-green-500/20 border-green-500'
                      : 'bg-casino-background hover:bg-casino-accent/20 border-casino-muted'
                    }
                    ${!gameActive || isGameOver || revealed[index] || isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    border-2
                  `}
                >
                  {revealed[index] ? (
                    grid[index] === 1 ? (
                      <Bomb className="text-red-500 w-6 h-6 md:w-8 md:h-8" />
                    ) : (
                      <Gem className="text-green-500 w-6 h-6 md:w-8 md:h-8" />
                    )
                  ) : (
                    <HelpCircle className="text-gray-500 w-6 h-6 md:w-8 md:h-8" />
                  )}
                </button>
              ))}
            </div>
            
            {isAutoMode && !isGameOver && (
              <div className="mt-4 max-w-[500px] mx-auto">
                <div className="mb-2 text-sm text-white">
                  Auto Mode: {autoRevealed} / {autoTarget} gems revealed
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(autoRevealed / autoTarget) * 100}%` }}
                  ></div>
                </div>
                <Button 
                  className="w-full mt-2 bg-red-600 hover:bg-red-700" 
                  onClick={() => setIsAutoMode(false)}
                  disabled={isLoading}
                >
                  Cancel Auto Mode
                </Button>
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
                    Set your bet amount and choose the number of mines (1-24).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">2.</span>
                    Click tiles to reveal gems (safe) or mines (game over).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">3.</span>
                    Each safe gem increases your multiplier.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">4.</span>
                    Use Auto mode to automatically reveal a set number of gems.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">5.</span>
                    Cash out anytime to secure your winnings!
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
                    <span>More mines = Higher risk but better multipliers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <span>Cash out early to secure smaller but safer wins</span>
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

export default Mines;
