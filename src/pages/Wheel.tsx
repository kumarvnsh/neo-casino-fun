import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useCoins } from '@/contexts/CoinContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Disc,
  Play,
  RefreshCcw,
  Coins,
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

// Game configuration
const DIFFICULTY_PRESETS = {
  easy: {
    label: "Easy",
    color: "green",
    textColor: "text-green-400",
    segments: [
      { multiplier: 0, chance: 0.30, color: "#ef4444" },    // Red for 0x
      { multiplier: 1.5, chance: 0.50, color: "#22c55e" },  // Green for 1.5x
      { multiplier: 1.7, chance: 0.20, color: "#ffffff" }   // White for 1.7x
    ]
  },
  medium: {
    label: "Medium",
    color: "yellow",
    textColor: "text-yellow-400",
    segments: [
      { multiplier: 0, chance: 0.45, color: "#ef4444" },    // Red for 0x
      { multiplier: 1.5, chance: 0.20, color: "#22c55e" },  // Green for 1.5x
      { multiplier: 1.7, chance: 0.15, color: "#ffffff" },  // White for 1.7x
      { multiplier: 2.0, chance: 0.10, color: "#eab308" },  // Yellow for 2x
      { multiplier: 3.0, chance: 0.10, color: "#3b82f6" }   // Blue for 3x
    ]
  },
  hard: {
    label: "Hard",
    color: "red",
    textColor: "text-red-400",
    segments: [
      { multiplier: 0, chance: 0.50, color: "#ef4444" },    // Red for 0x
      { multiplier: 1.5, chance: 0.10, color: "#22c55e" },  // Green for 1.5x
      { multiplier: 1.7, chance: 0.10, color: "#ffffff" },  // White for 1.7x
      { multiplier: 2.0, chance: 0.10, color: "#eab308" },  // Yellow for 2x
      { multiplier: 3.0, chance: 0.10, color: "#3b82f6" },  // Blue for 3x
      { multiplier: 4.0, chance: 0.10, color: "#f97316" }   // Orange for 4x
    ]
  }
};

// Available segment counts
const SEGMENT_OPTIONS = [20, 25, 30, 35, 40];

// Colors for segments
const SEGMENT_COLORS = {
  '0': '#ef4444',    // Red for 0x (lose)
  '1.5': '#22c55e',  // Green for 1.5x
  '1.7': '#ffffff',  // White for 1.7x
  '2.0': '#eab308',  // Yellow for 2.0x
  '3.0': '#3b82f6',  // Blue for 3.0x
  '4.0': '#f97316'   // Orange for 4.0x
} as const;

// Define the type for difficulty keys
type DifficultyKey = keyof typeof DIFFICULTY_PRESETS;

type MultiplierKey = keyof typeof SEGMENT_COLORS;

// Helper function to create wheel segments
const createWheelSegments = (numSegments: number, difficulty: DifficultyKey) => {
  const segments = [];
  const multipliers = DIFFICULTY_PRESETS[difficulty].segments;
  
  // Calculate how many segments each multiplier should have based on its chance
  const segmentCounts = multipliers.map(m => ({
    multiplier: m.multiplier,
    color: m.color,
    count: Math.round(m.chance * numSegments)
  }));
  
  // Adjust total count to match numSegments
  const totalCount = segmentCounts.reduce((sum, s) => sum + s.count, 0);
  if (totalCount !== numSegments) {
    const diff = numSegments - totalCount;
    // Add or remove from the highest chance multiplier
    const highestChanceIndex = multipliers.reduce((maxIndex, m, i) => 
      m.chance > multipliers[maxIndex].chance ? i : maxIndex
    , 0);
    segmentCounts[highestChanceIndex].count += diff;
  }
  
  // Create segments array
  for (const segment of segmentCounts) {
    for (let i = 0; i < segment.count; i++) {
      segments.push({
        multiplier: segment.multiplier,
        color: segment.color
      });
    }
  }
  
  // Shuffle the segments
  for (let i = segments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [segments[i], segments[j]] = [segments[j], segments[i]];
  }
  
  return segments;
};

const Wheel = () => {
  const { coins, updateCoins } = useCoins();
  const [betAmount, setBetAmount] = useState(100);
  const [difficulty, setDifficulty] = useState<DifficultyKey>("medium");
  const [isSpinning, setIsSpinning] = useState(false);
  const [numSegments, setNumSegments] = useState(30);
  const [result, setResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [segments, setSegments] = useState(createWheelSegments(30, "medium"));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameActive, setGameActive] = useState(true);

  // Update segments when difficulty or number of segments changes
  useEffect(() => {
    setSegments(createWheelSegments(numSegments, difficulty));
  }, [difficulty, numSegments]);

  // Draw the wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw outer ring with color segments
    const segmentAngle = (2 * Math.PI) / segments.length;
    segments.forEach((segment, index) => {
      // Adjust the angles to match the pointer at top
      // Add half segment angle to align segments with pointer
      const startAngle = index * segmentAngle + (rotation * Math.PI / 180) - Math.PI / 2 + segmentAngle / 2;
      const endAngle = (index + 1) * segmentAngle + (rotation * Math.PI / 180) - Math.PI / 2 + segmentAngle / 2;

      // Draw outer colored ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 10, startAngle, endAngle);
      ctx.arc(centerX, centerY, radius - 10, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();
      ctx.strokeStyle = '#2a2e32';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw main segment (dark background)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 10, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = '#1e2124';
      ctx.fill();
      ctx.strokeStyle = '#2a2e32';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Add multiplier labels
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`${segment.multiplier}x`, radius - 25, 5);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e2124';
    ctx.fill();
    ctx.strokeStyle = '#2a2e32';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw pointer
    const pointerHeight = 30;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX - 10, centerY - radius - pointerHeight);
    ctx.lineTo(centerX + 10, centerY - radius - pointerHeight);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [segments, rotation]);

  const handleDifficultyChange = (value: DifficultyKey) => {
    setDifficulty(value);
  };

  const spinWheel = () => {
    if (isSpinning) return;
    
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
    
    setIsSpinning(true);
    setResult(null);

    // Calculate result
    const resultIndex = Math.floor(Math.random() * segments.length);
    const resultSegment = segments[resultIndex];
    
    // Calculate final rotation to land on result
    const segmentAngle = 360 / segments.length;
    const extraSpins = 4; // Number of full rotations
    const finalRotation = 360 * extraSpins + (segmentAngle * resultIndex);
    
    // Store the winning segment for later use
    const winningSegment = segments[segments.length - resultIndex - 1];
    
    // Animate the spin
    let currentRotation = rotation;
    const animate = () => {
      const remaining = finalRotation - currentRotation;
      if (remaining <= 0) {
        setIsSpinning(false);
        
        // Calculate winnings using the stored winning segment
        const winAmount = Math.floor(betAmount * winningSegment.multiplier);
        if (winAmount > 0) {
          updateCoins(winAmount);
          toast({
            title: "You Win!",
            description: `You won ${formatCoins(winAmount)} coins! (${winningSegment.multiplier}x)`,
          });
        } else {
          toast({
            title: "You Lost",
            description: "Better luck next time!",
            variant: "destructive",
          });
        }
        
        setResult(resultIndex);
        return;
      }
      
      const step = Math.max(1, remaining * 0.05);
      currentRotation += step;
      setRotation(currentRotation % 360);
      requestAnimationFrame(animate);
    };
    
    animate();
  };

  return (
    <MainLayout>
      <div className="game-layout">
        <h1 className="game-title flex items-center gap-2">
          <Disc className="h-8 w-8 text-yellow-500" />
          Wheel
        </h1>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start">
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
                  disabled={isSpinning}
                />
                <Button 
                  variant="outline" 
                  onClick={() => setBetAmount(Math.floor(betAmount / 2))}
                  className="text-white border-casino-muted bg-casino-background hover:bg-casino-accent/20"
                  disabled={betAmount <= 10 || isSpinning}
                >
                  ½
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setBetAmount(Math.min(betAmount * 2, coins))}
                  className="text-white border-casino-muted bg-casino-background hover:bg-casino-accent/20"
                  disabled={betAmount * 2 > coins || isSpinning}
                >
                  2×
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm mb-2">Risk</p>
              <Select 
                value={difficulty} 
                onValueChange={handleDifficultyChange}
                disabled={isSpinning}
              >
                <SelectTrigger className="w-full bg-casino-background border-casino-muted text-white">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent className="bg-casino-card border-casino-muted text-white">
                  {Object.entries(DIFFICULTY_PRESETS).map(([key, diffSettings]) => (
                    <SelectItem 
                      key={key} 
                      value={key as DifficultyKey}
                      className="focus:bg-casino-primary/50 focus:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <span>{diffSettings.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-2">Segments</p>
              <Select 
                value={numSegments.toString()} 
                onValueChange={(value) => setNumSegments(Number(value))}
                disabled={isSpinning}
              >
                <SelectTrigger className="w-full bg-casino-background border-casino-muted text-white">
                  <SelectValue placeholder="Select number of segments" />
                </SelectTrigger>
                <SelectContent className="bg-casino-card border-casino-muted text-white">
                  {SEGMENT_OPTIONS.map((num) => (
                    <SelectItem 
                      key={num} 
                      value={num.toString()}
                      className="focus:bg-casino-primary/50 focus:text-white"
                    >
                      {num} segments
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="neon-button w-full" 
              onClick={spinWheel}
              disabled={isSpinning || betAmount <= 0 || betAmount > coins}
            >
              {isSpinning ? (
                <>
                  <RefreshCcw className="mr-2 animate-spin" size={16} />
                  Spinning...
                </>
              ) : (
                <>
                  <Play className="mr-2" size={16} />
                  Spin Wheel
                </>
              )}
            </Button>
          </div>
          
          <div className="flex-1 bg-casino-card rounded-xl p-6">
            <div className="max-w-md mx-auto">
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={400} 
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-casino-background p-2 rounded-lg">
            <p className="text-xs text-gray-400">Multiplier</p>
            <p className="text-lg font-bold text-blue-400">{segments[result as number]?.multiplier}x</p>
          </div>
          <div className="bg-casino-background p-2 rounded-lg">
            <p className="text-xs text-gray-400">Potential Win</p>
            <p className="text-lg font-bold text-green-400">{segments[result as number]?.multiplier ? Math.floor(betAmount * segments[result as number]?.multiplier) : 'N/A'}</p>
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
                    Set your bet amount and choose a segment (1-12).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">2.</span>
                    Click Spin to start the wheel animation.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">3.</span>
                    The wheel will stop on a random segment.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">4.</span>
                    If the wheel stops on your chosen segment, you win!
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
                    <span>Easy: 0x (30%), 1.5x (50%), 1.7x (20%)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-600"></span>
                    <span>Medium: 0x (45%), 1.5x (20%), 1.7x (15%), 2x (10%), 3x (10%)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600"></span>
                    <span>Hard: 0x (50%), 1.5x-4x (10% each)</span>
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

export default Wheel; 