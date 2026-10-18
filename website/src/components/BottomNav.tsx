import React from "react";
import { Home, Search, Bookmark, Download, Settings } from "lucide-react";

export type NavTab = "home" | "search" | "library" | "downloads" | "settings";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  watchlistCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  watchlistCount = 0,
}) => {
  const tabs = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "search" as const, label: "Search", icon: Search },
    { id: "library" as const, label: "Library", icon: Bookmark, badge: watchlistCount },
    { id: "downloads" as const, label: "Downloads", icon: Download },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around safe-bottom">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center flex-1 py-1 transition-all group focus:outline-none"
          >
            {/* Active Pill Container around Icon */}
            <div
              className={`relative flex items-center justify-center transition-all ${
                isActive
                  ? "w-14 h-8 rounded-full bg-zinc-800 text-white shadow-sm"
                  : "w-10 h-7 text-zinc-400 group-hover:text-zinc-200"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? "scale-105 stroke-[2.2]" : "stroke-[1.8]"
                }`}
              />

              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#e50914] text-[9px] font-bold text-white flex items-center justify-center shadow-md">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span
              className={`text-[10px] tracking-tight mt-0.5 transition-colors ${
                isActive ? "font-bold text-white" : "font-medium text-zinc-400 group-hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
