import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Heart,
  DollarSign,
  Settings,
  User,
  PlusCircle,
  Menu,
  X,
  Home,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Heart, label: "My Campaigns", path: "/dashboard/campaigns" },
  { icon: DollarSign, label: "Donations", path: "/dashboard/donations" },
  { icon: Settings, label: "Withdrawals", path: "/dashboard/withdrawals" },
  { icon: User, label: "Profile", path: "/dashboard/profile" },
];

export const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [greeting, setGreeting] = useState("");

  // 🔥 Use GLOBAL USER from AuthContext (auto-updates after profile edit)
  const { user } = useAuth();

  // ⏰ Live Clock + Greeting
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const formattedDate = now.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const hour = now.getHours();
      let greet = "Hello!";
      if (hour < 12) greet = "Good Morning";
      else if (hour < 18) greet = "Good Afternoon";
      else greet = "Good Evening";

      setTime(formattedTime);
      setDate(formattedDate);
      setGreeting(greet);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed z-40 inset-y-0 left-0 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out flex flex-col shadow-lg",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:static md:flex"
        )}
      >
        {/* Top Section */}
        <div className="h-16 border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* Profile Photo */}
            <img
              src={user?.profile_photo || "/placeholder.jpg"}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border shadow"
            />

            <Link to="/">
              <span className="font-bold text-foreground">Dashboard</span>
            </Link>
          </div>

          {/* Mobile Close Button */}
          <button
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                asChild
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  !isActive && "text-foreground hover:bg-accent"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Link to={item.path}>
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </div>

        {/* Create Campaign */}
        <div className="p-4 border-t">
          <Button
            asChild
            className="w-full"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <Link to="/create-campaign">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-6 bg-background">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Button */}
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden md:block">
              <h1 className="text-2xl font-bold">{greeting}! 👋</h1>
              <p className="text-sm text-muted-foreground">{date}</p>
            </div>
          </div>

          {/* Clock + Home */}
          <div className="flex items-center gap-4">
            <span className="font-mono text-lg hidden md:inline">{time}</span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
              aria-label="Go Home"
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-muted/20">
          <Outlet />
        </main>
      </div>

      {/* Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
