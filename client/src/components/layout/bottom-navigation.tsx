import { useLocation } from "wouter";
import { Home, History, TrendingUp, BarChart3, User } from "lucide-react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/timeline", icon: History, label: "History" },
    { path: "/analysis", icon: TrendingUp, label: "Analysis" },
    { path: "/correlation", icon: BarChart3, label: "Multi-Lag" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 z-30">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => setLocation(path)}
            className={`flex flex-col items-center py-2 px-3 ${
              location === path ? "text-primary" : "text-gray-500"
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
