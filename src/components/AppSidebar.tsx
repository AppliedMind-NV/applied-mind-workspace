import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Layers,
  HelpCircle,
  Code2,
  Clock,
  Settings,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Notes", path: "/notes", icon: FileText },
  { title: "Flashcards", path: "/flashcards", icon: Layers },
  { title: "Practice", path: "/practice", icon: HelpCircle },
  { title: "Code Lab", path: "/code-lab", icon: Code2 },
  { title: "Study", path: "/study", icon: Clock },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  return (
    <aside
      className={`h-full border-r bg-sidebar flex flex-col shrink-0 transition-all duration-200 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="h-12 flex items-center px-3 border-b gap-2">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
            AppliedMind
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              } ${collapsed ? "justify-center" : ""}`
            }
          >
            <item.icon size={16} className="shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="border-t py-2 px-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-sidebar-accent text-primary font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            } ${collapsed ? "justify-center" : ""}`
          }
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
