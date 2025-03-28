
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCoins, setCoins, updateCoins, resetCoins } from '@/utils/coinManager';
import { toast } from "@/components/ui/use-toast";

interface CoinContextType {
  coins: number;
  setCoins: (amount: number) => void;
  updateCoins: (changeAmount: number) => void;
  resetCoins: () => void;
}

const CoinContext = createContext<CoinContextType | undefined>(undefined);

export const CoinProvider = ({ children }: { children: ReactNode }) => {
  const [coins, setCoinsState] = useState<number>(0);

  useEffect(() => {
    // Initialize coins from local storage on component mount
    const initialCoins = getCoins();
    setCoinsState(initialCoins);
  }, []);

  const handleSetCoins = (amount: number) => {
    setCoins(amount);
    setCoinsState(amount);
  };

  const handleUpdateCoins = (changeAmount: number) => {
    const newAmount = updateCoins(changeAmount);
    setCoinsState(newAmount);
    
    // Show toast for coin updates
    if (changeAmount > 0) {
      toast({
        title: "Coins added!",
        description: `+${changeAmount} coins added to your balance`,
        variant: "default",
      });
    } else if (changeAmount < 0) {
      toast({
        title: "Coins deducted",
        description: `${changeAmount} coins removed from your balance`,
        variant: "destructive",
      });
    }
    
    return newAmount;
  };

  const handleResetCoins = () => {
    const defaultAmount = resetCoins();
    setCoinsState(defaultAmount);
    
    toast({
      title: "Coins reset",
      description: "Your balance has been reset to 10,000 coins",
    });
    
    return defaultAmount;
  };

  return (
    <CoinContext.Provider
      value={{
        coins,
        setCoins: handleSetCoins,
        updateCoins: handleUpdateCoins,
        resetCoins: handleResetCoins,
      }}
    >
      {children}
    </CoinContext.Provider>
  );
};

export const useCoins = () => {
  const context = useContext(CoinContext);
  if (context === undefined) {
    throw new Error('useCoins must be used within a CoinProvider');
  }
  return context;
};
