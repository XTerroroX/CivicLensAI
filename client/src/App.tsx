import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
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

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/reports" component={Reports} />
          <Route path="/community" component={Community} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/official-dashboard" component={OfficialDashboard} />
          <Route path="/profile" component={Profile} />
          <Route path="/preferences" component={Preferences} />
          <Route path="/help" component={Help} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="dark min-h-screen bg-background text-foreground">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </div>
    </QueryClientProvider>
  );
}

export default App;
