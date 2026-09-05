"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Building2,
  LayoutDashboard,
  FileText,
  LogOut,
  Bell,
  Menu,
  KeyRound,
  User as UserIcon,
  Compass,
  ShieldCheck,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Demo journey steps for breadcrumb hint
const CITIZEN_JOURNEY = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Services", href: "/services" },
  { label: "Apply", href: "/applications/create" },
  { label: "Consent", href: "/consents" },
  { label: "Journey", href: "/applications" },
];

function DemoJourneyBreadcrumb() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (user?.role !== "CITIZEN" && !(!user?.role)) return null;

  // Find current step
  let currentStep = -1;
  CITIZEN_JOURNEY.forEach((step, i) => {
    if (pathname.startsWith(step.href)) currentStep = i;
  });
  // Application detail counts as "Journey"
  if (pathname.startsWith("/applications/") && pathname !== "/applications/create") currentStep = 4;

  return (
    <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400 font-medium">
      <span className="text-gray-300 text-[10px] uppercase tracking-wider mr-1">Demo path:</span>
      {CITIZEN_JOURNEY.map((step, i) => (
        <div key={step.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
          <Link href={step.href}>
            <span className={cn(
              "px-2 py-0.5 rounded text-[11px] transition-colors",
              currentStep === i
                ? "bg-gov-blue text-white font-semibold"
                : "text-gray-400 hover:text-gray-600"
            )}>
              {step.label}
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  if (user?.role === "CITIZEN" || !user?.role) {
    navItems.push({ name: "Services", href: "/services", icon: Compass });
  }

  navItems.push({ name: "Application Journeys", href: "/applications", icon: FileText });

  if (user?.role === "CITIZEN" || !user?.role) {
    navItems.push({ name: "Data Permissions", href: "/consents", icon: KeyRound });
  }

  if (user?.role === "ADMIN") {
    navItems.push({ name: "Control Centre", href: "/admin", icon: Settings2 });
  }

  const roleLabel =
    user?.role === "OFFICER" ? "Officer Portal" :
    user?.role === "ADMIN" ? "Admin Portal" :
    "Citizen Portal";

  return (
    <div className="hidden md:flex flex-col w-64 bg-gov-blue-dark text-white shadow-xl min-h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
        <div className="w-7 h-7 bg-gov-gold/20 rounded-lg flex items-center justify-center">
          <Building2 className="w-4 h-4 text-gov-gold" />
        </div>
        <div>
          <span className="font-bold tracking-wide text-base leading-none">GovBridge</span>
          <p className="text-[10px] text-white/40 mt-0.5">{roleLabel}</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                  isActive
                    ? "text-white bg-white/12"
                    : "text-white/65 hover:text-white hover:bg-white/6"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gov-gold rounded-r-md"
                  />
                )}
                <item.icon className="w-4.5 h-4.5" />
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      {user?.role === "CITIZEN" && (
        <div className="mx-3 mb-3 bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Demo Journey</p>
          <p className="text-xs text-white/60 leading-relaxed">
            Services → Apply → Consent → Track → Done
          </p>
        </div>
      )}

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/6 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function Header() {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const data = await apiFetch("/notifications/");
        setNotifications(Array.isArray(data) ? data : data.notifications || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchNotifs();
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2">
        <Button variant="ghost" size="icon" className="-ml-2">
          <Menu className="w-5 h-5" />
        </Button>
        <Building2 className="w-5 h-5 text-gov-blue" />
      </div>

      {/* Demo journey breadcrumb — desktop citizen only */}
      <DemoJourneyBreadcrumb />

      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-500 h-9 w-9"
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-100 bg-gray-50 font-semibold text-sm flex justify-between items-center">
                <span>Notifications {unreadCount > 0 && <span className="ml-1 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}</span>
                {unreadCount > 0 && (
                  <span
                    className="text-xs font-normal text-gov-blue cursor-pointer hover:underline"
                    onClick={async () => {
                      try {
                        await apiFetch("/notifications/read-all", { method: "PATCH" });
                      } catch (e) {}
                      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
                    }}
                  >
                    Mark all read
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No notifications yet.</div>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-100">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          if (!n.is_read) {
                            try {
                              setNotifications(notifications.map((notif) =>
                                notif.id === n.id ? { ...notif, is_read: true } : notif
                              ));
                              await apiFetch(`/notifications/${n.id}/read`, { method: "PATCH" });
                            } catch (e) {}
                          }
                        }}
                        className={`p-4 text-sm cursor-pointer transition-colors hover:bg-gray-50 ${!n.is_read ? "bg-blue-50/50" : ""}`}
                      >
                        <p className={`text-gray-900 ${!n.is_read ? "font-medium" : ""}`}>{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="w-7 h-7 rounded-full bg-gov-blue/10 flex items-center justify-center text-gov-blue">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 leading-none">
              {user?.fullName || user?.email?.split("@")[0]}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {user?.role === "OFFICER"
                ? `Officer · ${user?.department || "Licensing"}`
                : user?.role === "ADMIN"
                ? "Administrator"
                : "Citizen"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
