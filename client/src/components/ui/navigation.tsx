import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  FileText, 
  Users, 
  BarChart3, 
  Shield, 
  Bell, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronDown,
  Eye
} from "lucide-react";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/reports", label: "My Reports", icon: FileText },
    { href: "/community", label: "Community", icon: Users },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  if ((user as any)?.role === "official" || (user as any)?.role === "admin") {
    navItems.push({
      href: "/official-dashboard",
      label: "Official Dashboard",
      icon: Shield,
    });
  }

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-3" data-testid="link-home">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground">CivicLens AI</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Smart Civic Reporting</p>
            </div>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActiveLink(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                data-testid={`nav-${item.href.substring(1) || 'dashboard'}`}
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative">
            <Button variant="ghost" size="sm" className="relative p-2" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
            </Button>
          </div>

          {/* User Role Badge */}
          <Badge 
            variant={
              (user as any)?.role === "official" || (user as any)?.role === "admin"
                ? "default"
                : "secondary"
            }
            data-testid="badge-user-role"
          >
            {(user as any)?.role === "official" ? (
              <>
                <Shield className="h-3 w-3 mr-1" />
                Official
              </>
            ) : (user as any)?.role === "admin" ? (
              <>
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </>
            ) : (
              <>
                <User className="h-3 w-3 mr-1" />
                Citizen
              </>
            )}
          </Badge>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                <img 
                  className="h-8 w-8 rounded-full object-cover" 
                  src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"} 
                  alt="User profile" 
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount data-testid="dropdown-user-menu">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild data-testid="menu-profile">
                <Link href="/profile" className="w-full">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild data-testid="menu-preferences">
                <Link href="/preferences" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild data-testid="menu-help">
                <Link href="/help" className="w-full">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => window.location.href = "/api/logout"}
                className="text-destructive focus:text-destructive"
                data-testid="menu-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-border">
        <nav className="flex overflow-x-auto p-4 space-x-4">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center min-w-0 flex-shrink-0 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActiveLink(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                data-testid={`mobile-nav-${item.href.substring(1) || 'dashboard'}`}
              >
                <IconComponent className="h-4 w-4 mb-1" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
