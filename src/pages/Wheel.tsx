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
import { Skeleton } from "@/components/ui/skeleton";

// Game configuration
const DIFFICULTY_PRESETS = {
  easy: { 
    name: "Easy", 
    defaultSegments: 20,
    multipliers: [
      { value: 0, chance: 60, color: "#374151" },    // Gray
      { value: 1.5, chance: 20, color: "#22c55e" },  // Green
      { value: 1.7, chance: 10, color: "#ffffff" },  // White
    ],
    color: "bg-green-600",
    textColor: "text-green-500",
    description: "3 multipliers" 
  },
  medium: { 
    name: "Medium", 
    defaultSegments: 25,
    multipliers: [
      { value: 0, chance: 45, color: "#374151" },    // Gray
      { value: 1.5, chance: 20, color: "#22c55e" },  // Green
      { value: 1.7, chance: 15, color: "#ffffff" },  // White
      { value: 2.0, chance: 10, color: "#eab308" },  // Yellow
      { value: 3.0, chance: 10, color: "#3b82f6" },  // Blue
    ],
    color: "bg-yellow-600",
    textColor: "text-yellow-500",
    description: "5 multipliers" 
  },
  hard: { 
    name: "Hard", 
    defaultSegments: 30,
    multipliers: [
      { value: 0, chance: 50, color: "#374151" },    // Gray
      { value: 1.5, chance: 10, color: "#22c55e" },  // Green
      { value: 1.7, chance: 10, color: "#ffffff" },  // White
      { value: 2.0, chance: 10, color: "#eab308" },  // Yellow
      { value: 3.0, chance: 10, color: "#3b82f6" },  // Blue
      { value: 4.0, chance: 10, color: "#f97316" },  // Orange
    ],
    color: "bg-red-600",
    textColor: "text-red-500",
    description: "6 multipliers" 
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

// Define types
interface WheelSegment {
  multiplier: number;
  color: string;
  label: string;
}

// Define the type for difficulty keys
type DifficultyKey = keyof typeof DIFFICULTY_PRESETS;

type MultiplierKey = keyof typeof SEGMENT_COLORS;

// Helper function to create wheel segments
const createWheelSegments = (difficulty: DifficultyKey, numSegments: number) => {
  const difficultySettings = DIFFICULTY_PRESETS[difficulty];
  const segments: WheelSegment[] = [];
  
  // For Hard mode, create segments with the special formula
  if (difficulty === 'hard') {
    const winningMultiplier = (numSegments - 1) * 1.05;
    
    // Create one winning segment with 2 decimal places
    segments.push({
      multiplier: winningMultiplier,
      color: "#a855f7", // Purple
      label: `${winningMultiplier.toFixed(2)}x`
    });
    
    // Create losing segments
    for (let i = 1; i < numSegments; i++) {
      segments.push({
        multiplier: 0,
        color: "#374151", // Gray
        label: "0x"
      });
    }
  } else if (difficulty === 'medium' && (numSegments === 35 || numSegments === 40)) {
    // Special case for medium mode with 35 or 40 segments
    const totalChance = 100; // Total percentage
    const multiplierChances = [
      { value: 0, chance: 45, color: "#374151" },    // Gray
      { value: 1.5, chance: 20, color: "#22c55e" },  // Green
      { value: 1.7, chance: 15, color: "#ffffff" },  // White
      { value: 2.0, chance: 10, color: "#eab308" },  // Yellow
      { value: 3.0, chance: 10, color: "#3b82f6" },  // Blue
    ];
    
    // Create segments based on chances
    multiplierChances.forEach(({ value, chance, color }) => {
      const count = Math.round((chance / totalChance) * numSegments);
      for (let i = 0; i < count; i++) {
        segments.push({
          multiplier: value,
          color: color,
          label: `${value}x`
        });
      }
    });

    // Adjust total count to match requested segments
    const totalCount = segments.length;
    if (totalCount !== numSegments) {
      const diff = numSegments - totalCount;
      // Add or remove 0x segments to match the total
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          segments.push({
            multiplier: 0,
            color: "#374151",
            label: "0x"
          });
        }
      } else if (diff < 0) {
        // Remove excess 0x segments
        let removed = 0;
        segments.slice().reverse().forEach((segment, i) => {
          if (removed >= Math.abs(diff)) return;
          if (segment.multiplier === 0) {
            segments.splice(segments.length - 1 - i, 1);
            removed++;
          }
        });
      }
    }

    // Replace one 0x segment with 4.0x
    const zeroIndex = segments.findIndex(s => s.multiplier === 0);
    if (zeroIndex !== -1) {
      segments[zeroIndex] = {
        multiplier: 4.0,
        color: "#f97316", // Orange
        label: "4.0x"
      };
    }
  } else {
    // Standard probability-based distribution
    const totalChance = difficultySettings.multipliers.reduce((sum, m) => sum + m.chance, 0);
    const segmentCounts = difficultySettings.multipliers.map(m => ({
      multiplier: m,
      count: Math.round((m.chance / totalChance) * numSegments)
    }));
    
    // Adjust total count to match requested segments
    const totalCount = segmentCounts.reduce((sum, s) => sum + s.count, 0);
    if (totalCount !== numSegments) {
      const diff = numSegments - totalCount;
      const mostCommonIndex = segmentCounts.findIndex(s => s.multiplier.value === 0);
      if (mostCommonIndex !== -1) {
        segmentCounts[mostCommonIndex].count += diff;
      }
    }
    
    // Create segments
    segmentCounts.forEach(({ multiplier, count }) => {
      for (let i = 0; i < count; i++) {
        segments.push({
          multiplier: multiplier.value,
          color: multiplier.color,
          label: `${multiplier.value}x`
        });
      }
    });
  }
  
  // Shuffle segments
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
  const [numSegments, setNumSegments] = useState(DIFFICULTY_PRESETS.medium.defaultSegments);
  const [result, setResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [segments, setSegments] = useState(createWheelSegments("medium", numSegments));
  const [recentMultipliers, setRecentMultipliers] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameActive, setGameActive] = useState(true);
  const spinCompletedRef = useRef(false);

  // Update segments when difficulty or number of segments changes
  useEffect(() => {
    setSegments(createWheelSegments(difficulty, numSegments));
  }, [difficulty, numSegments]);

  // Helper function to calculate probability text
  const getProbabilityText = (segment: WheelSegment) => {
    const total = segments.length;
    const count = segments.filter(s => s.multiplier === segment.multiplier).length;
    return `${count}/${total} chances`;
  };

  // Helper function to render legend item
  const renderLegendItem = (segment: WheelSegment) => (
    <div 
      key={segment.multiplier}
      className="relative group"
    >
      <div className="px-6 py-2 rounded-md bg-[#1a1d1f] border border-[#2a2e32] text-white text-center min-w-[100px]">
        <span>{segment.label}</span>
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 rounded-b-md"
          style={{ backgroundColor: segment.color }}
        />
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          {getProbabilityText(segment)}
        </div>
      </div>
    </div>
  );

  // Update numSegments when difficulty changes
  useEffect(() => {
    setNumSegments(DIFFICULTY_PRESETS[difficulty].defaultSegments);
  }, [difficulty]);

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
      const startAngle = index * segmentAngle + (rotation * Math.PI / 180) - Math.PI / 2 + segmentAngle / 2;
      const endAngle = (index + 1) * segmentAngle + (rotation * Math.PI / 180) - Math.PI / 2 + segmentAngle / 2;

      // Draw outer colored ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 10, startAngle, endAngle);
      ctx.arc(centerX, centerY, radius - 10, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = segment.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(42, 46, 50, 0.1)'; // Very low opacity for segment dividers
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw main segment (dark background)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 10, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = '#1e2124';
      ctx.fill();
      ctx.strokeStyle = 'rgba(42, 46, 50, 0.1)'; // Very low opacity for segment dividers
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw center circle (solid color, no lines)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.15, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e2124';
    ctx.fill();

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

    // Reset completion guard
    spinCompletedRef.current = false;

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
        // Guard against multiple completions
        if (spinCompletedRef.current) return;
        spinCompletedRef.current = true;
        
        setIsSpinning(false);
        
        // Calculate winnings using the stored winning segment
        const winAmount = Math.floor(betAmount * winningSegment.multiplier);
        
        // Update recent multipliers only after wheel stops
        setRecentMultipliers(prev => {
          const updated = [winningSegment.label, ...prev];
          return updated.slice(0, 10); // Keep only last 10 multipliers
        });
        
        if (winAmount > 0) {
          updateCoins(winAmount);
          toast({
            title: "You Win!",
            description: `You won ${formatCoins(winAmount)} coins! (${winningSegment.label})`,
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
                        <span>{diffSettings.name}</span>
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
            {/* Recent multipliers display */}
            <div className="flex justify-center gap-2 mb-4 overflow-x-auto">
              {recentMultipliers.map((mult, index) => (
                <div
                  key={index}
                  className="px-3 py-1 rounded bg-casino-background text-white text-sm"
                >
                  {mult}
                </div>
              ))}
            </div>

            <div className="max-w-md mx-auto">
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={400} 
                className="w-full h-full"
              />
            </div>

            {/* Color legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {difficulty === 'hard' ? (
                <>
                  {renderLegendItem({
                    multiplier: 0,
                    color: "#374151",
                    label: "0.00x"
                  })}
                  {renderLegendItem({
                    multiplier: (numSegments - 1) * 1.05,
                    color: "#a855f7",
                    label: `${((numSegments - 1) * 1.05).toFixed(2)}x`
                  })}
                </>
              ) : (
                segments
                  .reduce((unique: WheelSegment[], segment) => 
                    unique.some(s => s.multiplier === segment.multiplier) 
                      ? unique 
                      : [...unique, segment]
                  , [])
                  .sort((a, b) => a.multiplier - b.multiplier)
                  .map((segment) => renderLegendItem(segment))
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-casino-background p-2 rounded-lg">
            <p className="text-xs text-gray-400">Multiplier</p>
            <p className="text-lg font-bold text-blue-400">{segments[result as number]?.label}</p>
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
                  {Object.entries(DIFFICULTY_PRESETS).map(([key, diffSettings]) => (
                    <li key={key} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${diffSettings.color}`}></span>
                      <span>{diffSettings.name}: {diffSettings.description}</span>
                    </li>
                  ))}
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