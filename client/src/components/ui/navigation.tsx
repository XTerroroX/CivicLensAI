import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "fas fa-home" },
    { href: "/reports", label: "My Reports", icon: "fas fa-file-alt" },
    { href: "/community", label: "Community", icon: "fas fa-users" },
    { href: "/analytics", label: "Analytics", icon: "fas fa-chart-line" },
  ];

  if ((user as any)?.role === "official" || (user as any)?.role === "admin") {
    navItems.push({
      href: "/official-dashboard",
      label: "Official Dashboard",
      icon: "fas fa-shield-alt",
    });
  }

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center" data-testid="link-home">
                <i className="fas fa-eye text-primary text-2xl mr-3"></i>
                <h1 className="text-xl font-semibold text-gray-900">CivicLens AI</h1>
              </Link>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`px-1 pt-1 pb-4 text-sm font-medium border-b-2 transition-colors ${
                    isActiveLink(item.href)
                      ? "text-primary border-primary"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                  }`}
                  data-testid={`nav-${item.href.substring(1) || 'dashboard'}`}
                >
                  <i className={`${item.icon} mr-2`}></i>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2" data-testid="button-notifications">
                <i className="fas fa-bell text-lg text-gray-400 hover:text-gray-500"></i>
              </Button>
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                3
              </span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <Badge 
                className={`${
                  (user as any)?.role === "official" || (user as any)?.role === "admin"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
                data-testid="badge-user-role"
              >
                <i className={`${
                  (user as any)?.role === "official" || (user as any)?.role === "admin"
                    ? "fas fa-shield-alt"
                    : "fas fa-user"
                } mr-1`}></i>
                {(user as any)?.role === "official" ? "Official" : (user as any)?.role === "admin" ? "Admin" : "Citizen"}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                    <img 
                      className="h-8 w-8 rounded-full object-cover" 
                      src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32"} 
                      alt="User profile" 
                    />
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {user?.firstName || "User"}
                    </span>
                    <i className="fas fa-chevron-down text-xs text-gray-400"></i>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" data-testid="dropdown-user-menu">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid="menu-profile">
                    <i className="fas fa-user mr-2"></i>
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-preferences">
                    <i className="fas fa-cog mr-2"></i>
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem data-testid="menu-help">
                    <i className="fas fa-question-circle mr-2"></i>
                    Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = "/api/logout"}
                    className="text-red-600 focus:text-red-600"
                    data-testid="menu-logout"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActiveLink(item.href)
                  ? "text-primary bg-blue-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              data-testid={`mobile-nav-${item.href.substring(1) || 'dashboard'}`}
            >
              <i className={`${item.icon} mr-2`}></i>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
