import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import CommandBar from "./components/CommandBar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AuthPage from "./components/auth/AuthPage";
import DriverActivePage from "./pages/DriverActivePage";
import DriverJoinPage from "./pages/DriverJoinPage";
import DriverPendingPage from "./pages/DriverPendingPage";
import SenderDashboard from "./pages/SenderDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CommandBar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/driver/join" element={<DriverJoinPage />} />
            <Route path="/driver/pending" element={<DriverPendingPage />} />
            <Route path="/driver/active" element={<DriverActivePage />} />
            <Route path="/dashboard/sender" element={<SenderDashboard />} />
            <Route path="/dashboard/manager" element={<ManagerDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
