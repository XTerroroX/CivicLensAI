import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/ui/navigation";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Reports from "@/pages/reports";
import Community from "@/pages/community";
import Analytics from "@/pages/analytics";
import OfficialDashboard from "@/pages/official-dashboard";
import Profile from "@/pages/profile";
import Preferences from "@/pages/preferences";
import Help from "@/pages/help";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return <Route path="/" component={Landing} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/reports" component={Reports} />
          <Route path="/community" component={Community} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/official-dashboard" component={OfficialDashboard} />
          <Route path="/profile" component={Profile} />
          <Route path="/preferences" component={Preferences} />
          <Route path="/help" component={Help} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
