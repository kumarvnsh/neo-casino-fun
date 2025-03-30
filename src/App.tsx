import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { CoinProvider } from "@/contexts/CoinContext";
import Index from "./pages/Index";
import DragonTower from "./pages/DragonTower";
import Mines from "./pages/Mines";
import Dice from "./pages/Dice";
import Wheel from "./pages/Wheel";
import HiLo from "./pages/HiLo";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CoinProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dragon-tower" element={<DragonTower />} />
            <Route path="/mines" element={<Mines />} />
            <Route path="/dice" element={<Dice />} />
            <Route path="/wheel" element={<Wheel />} />
            <Route path="/hi-lo" element={<HiLo />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </CoinProvider>
  </QueryClientProvider>
);

export default App;
