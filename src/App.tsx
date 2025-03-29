import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CoinProvider } from "@/contexts/CoinContext";
import Index from "./pages/Index";
import DragonTower from "./pages/DragonTower";
import Mines from "./pages/Mines";
import Dice from "./pages/Dice";
import Wheel from "./pages/Wheel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const isProduction = import.meta.env.MODE === 'production';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CoinProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={isProduction ? "/neo-casino-fun" : ""}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dragon-tower" element={<DragonTower />} />
            <Route path="/mines" element={<Mines />} />
            <Route path="/dice" element={<Dice />} />
            <Route path="/wheel" element={<Wheel />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CoinProvider>
  </QueryClientProvider>
);

export default App;
