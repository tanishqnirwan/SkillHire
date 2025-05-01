import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PackageOpen, User, LogOut, Briefcase } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Cart from "@/components/Cart";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigateToDashboard = () => {
    navigate("/dashboard");
  };

  const navigateToOrders = () => {
    if (user?.role === "client") {
      navigate("/client/orders");
    } else if (user?.role === "freelancer") {
      navigate("/freelancer/orders");
    }
  };

  return (
    <nav className="border-b sticky top-0 z-50 backdrop-blur-sm bg-white/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              <Briefcase className="h-6 w-6 text-indigo-600 mr-2" />
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
                SkillHire
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {(user?.role === "client" || user?.role === "freelancer") && (
              <Button
                variant="ghost"
                className="flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-700"
                onClick={navigateToOrders}
              >
                <PackageOpen className="h-4 w-4" />
                <span>Orders</span>
              </Button>
            )}
            
            {user?.role === "client" && <Cart />}

            <Button
              variant="ghost"
              className="flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-700"
              onClick={navigateToDashboard}
            >
              <User className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full p-0 h-9 w-9 relative">
                  <Avatar className="h-9 w-9 border-2 border-indigo-100">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                      {user?.name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center p-2">
                  <div className="ml-2 space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={navigateToDashboard}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
