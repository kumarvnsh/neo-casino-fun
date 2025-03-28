
// Local storage key for coins
const COIN_STORAGE_KEY = 'neovegas_coins';
const DEFAULT_COINS = 10000;

/**
 * Get current coin balance from local storage
 */
export const getCoins = (): number => {
  const storedCoins = localStorage.getItem(COIN_STORAGE_KEY);
  if (storedCoins) {
    return parseInt(storedCoins, 10);
  }
  // If no coins found, set default and return
  setCoins(DEFAULT_COINS);
  return DEFAULT_COINS;
};

/**
 * Set the coin balance in local storage
 */
export const setCoins = (amount: number): void => {
  localStorage.setItem(COIN_STORAGE_KEY, amount.toString());
};

/**
 * Update coins by adding or subtracting the specified amount
 */
export const updateCoins = (changeAmount: number): number => {
  const currentCoins = getCoins();
  const newAmount = Math.max(0, currentCoins + changeAmount);
  setCoins(newAmount);
  return newAmount;
};

/**
 * Reset coins to default amount
 */
export const resetCoins = (): number => {
  setCoins(DEFAULT_COINS);
  return DEFAULT_COINS;
};
