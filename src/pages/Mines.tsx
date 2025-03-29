
import React, { useState, useEffect } from 'react';
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
  };
  
  // Handle tile click
  const handleTileClick = (index: number) => {
    if (!gameActive || isGameOver || revealed[index]) return;
    
    // Create a copy of the revealed state
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);
    
    // Check if the tile is a mine
    if (grid[index] === 1) {
      // Hit a mine - game over
      setIsGameOver(true);
      
      // Reveal all mines
      const finalRevealed = grid.map((tile, i) => {
        return tile === 1 || revealed[i];
      });
      
      setTimeout(() => {
        setRevealed(finalRevealed);
        toast({
          title: "Game Over!",
          description: "You hit a mine! Better luck next time.",
          variant: "destructive",
        });
      }, 300);
    } else {
      // Safe tile - update multiplier
      setCurrentMultiplier(nextMultiplier);
      
      // If in auto mode, increment counter
      if (isAutoMode) {
        const newAutoRevealed = autoRevealed + 1;
        setAutoRevealed(newAutoRevealed);
        
        // Check if we've reached our auto target
        if (newAutoRevealed >= autoTarget) {
          cashOut();
        }
      }
    }
  };
  
  // Start auto mode
  const startAutoMode = () => {
    if (!gameActive || isGameOver) return;
    setIsAutoMode(true);
    toast({
      title: "Auto Mode Activated",
      description: `Will auto-cashout after revealing ${autoTarget} safe gems.`,
    });
  };
  
  // Cash out current winnings
  const cashOut = () => {
    if (!gameActive || isGameOver) return;
    
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
  };
  
  const resetGame = () => {
    setGameActive(false);
    setIsGameOver(false);
    setWin(false);
    setIsAutoMode(false);
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
        <h1 className="game-title flex items-center gap-2">
          <Bomb className="h-8 w-8 text-red-500" />
          Mines
        </h1>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start">
          <div className="bg-casino-card rounded-xl p-6 w-full md:w-80 flex flex-col gap-4">
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
                  disabled={gameActive && !isGameOver}
                />
                <Button 
                  variant="outline" 
                  onClick={() => setBetAmount(Math.floor(betAmount / 2))}
                  className="text-white border-casino-muted"
                  disabled={(betAmount <= 10) || (gameActive && !isGameOver)}
                >
                  ½
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setBetAmount(Math.min(betAmount * 2, coins))}
                  className="text-white border-casino-muted"
                  disabled={(betAmount * 2 > coins) || (gameActive && !isGameOver)}
                >
                  2×
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-2">
                Number of Mines: {mineCount} mines
              </p>
              <Slider
                value={[mineCount]}
                min={MIN_MINES}
                max={MAX_MINES}
                step={1}
                onValueChange={(value) => setMineCount(value[0])}
                className="py-4"
                disabled={gameActive && !isGameOver}
              />
              <div className="text-sm text-gray-400 mt-1">
                More mines = higher risk, higher reward
              </div>
            </div>
            
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
                <div>
                  <p className="text-gray-400 text-sm">Current Multiplier</p>
                  <p className="text-xl font-bold text-white">{currentMultiplier}x</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Current Win</p>
                  <p className="text-xl font-bold text-green-500">{formatCoins(currentWin)} coins</p>
                </div>
                
                {!isGameOver && (
                  <div>
                    <p className="text-gray-400 text-sm">Next Tile Multiplier</p>
                    <p className="text-lg font-bold text-blue-400">{nextMultiplier}x ({formatCoins(nextWin)} coins)</p>
                  </div>
                )}
                
                <div>
                  <p className="text-gray-400 text-sm">Gems Found</p>
                  <p className="text-lg font-bold text-purple-400">{openedSafeTiles} / {totalSafeTiles}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Safe Probability</p>
                  <p className="text-lg font-bold text-yellow-400">{safeProb}%</p>
                </div>
                
                {!isGameOver && !isAutoMode && (
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      onClick={cashOut}
                    >
                      <Coins className="mr-2" size={16} />
                      Cash Out ({currentMultiplier}x)
                    </Button>
                    
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
                      >
                        Auto
                      </Button>
                    </div>
                  </div>
                )}
                
                {isAutoMode && !isGameOver && (
                  <div>
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
                    >
                      Cancel Auto Mode
                    </Button>
                  </div>
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
          </div>
          
          <div className="flex-1 bg-casino-card rounded-xl p-6">
            <div className="grid grid-cols-5 gap-3">
              {Array(GRID_SIZE).fill(0).map((_, index) => {
                const isRevealed = revealed[index];
                const isMine = grid[index] === 1;
                
                return (
                  <div
                    key={index}
                    onClick={() => handleTileClick(index)}
                    className={`
                      aspect-square flex items-center justify-center rounded-lg cursor-pointer transition-all duration-300
                      ${isRevealed 
                        ? (isMine 
                          ? 'bg-red-900/50'
                          : 'bg-purple-700/50')
                        : 'bg-casino-background hover:bg-casino-primary/30'}
                      ${!isGameOver && !isRevealed && gameActive ? 'animate-pulse-glow' : ''}
                      ${!gameActive ? 'opacity-70' : ''}
                    `}
                  >
                    {isRevealed ? (
                      isMine ? (
                        <Bomb className="text-red-500" size={24} />
                      ) : (
                        <Gem className="text-purple-400" size={24} />
                      )
                    ) : (
                      <HelpCircle className="text-gray-600" size={20} />
                    )}
                  </div>
                );
              })}
            </div>
            
            {isGameOver && (
              <div className={`mt-4 p-4 rounded-lg ${win ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                <div className="flex items-center gap-2">
                  {win ? (
                    <Coins className="text-yellow-400" size={20} />
                  ) : (
                    <AlertTriangle className="text-red-400" size={20} />
                  )}
                  <h3 className="font-semibold text-white">
                    {win ? 'You Win!' : 'Game Over!'}
                  </h3>
                </div>
                <p className="text-gray-300 mt-1">
                  {win 
                    ? `You cashed out with a ${currentMultiplier}x multiplier and won ${formatCoins(currentWin)} coins!` 
                    : 'You hit a mine! Better luck next time.'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-casino-card rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold mb-2 text-white">How to Play</h2>
          <div className="space-y-2 text-gray-300">
            <p>1. Choose your bet amount and number of mines (1-24)</p>
            <p>2. The grid has 25 tiles total, with gems and mines</p>
            <p>3. Click on a tile to reveal it - if it's a gem, your multiplier increases</p>
            <p>4. If you hit a mine, you lose your bet</p>
            <p>5. You can cash out at any time to secure your winnings</p>
            <p>6. More mines = higher risk but higher potential rewards</p>
            <p>7. Use Auto mode to automatically stop after revealing a set number of gems</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Mines;
