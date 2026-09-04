"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
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
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  if (user?.role === "CITIZEN" || !user?.role) {
    navItems.push({ name: "Services", href: "/services", icon: Compass });
  }

  navItems.push({ name: "Applications", href: "/applications", icon: FileText });

  if (user?.role === "CITIZEN" || !user?.role) {
    navItems.push({ name: "Consents", href: "/consents", icon: KeyRound });
  }
  
  if (user?.role === "ADMIN" || user?.role === "OFFICER") {
    navItems.push({ name: "Admin", href: "/admin", icon: Building2 });
  }

  return (
    <div className="hidden md:flex flex-col w-64 bg-gov-blue-dark text-white shadow-xl min-h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
        <Building2 className="w-6 h-6 text-gov-gold" />
        <span className="font-bold tracking-wide text-lg">GovBridge</span>
      </div>
      
      <nav className="flex-1 px-3 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href}>
              <span
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative",
                  isActive ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gov-gold rounded-r-md" 
                  />
                )}
                <item.icon className="w-5 h-5" />
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
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
        const data = await apiFetch('/notifications/');
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
  
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="md:hidden flex items-center gap-2">
        <Button variant="ghost" size="icon" className="-ml-2">
          <Menu className="w-5 h-5" />
        </Button>
        <Building2 className="w-6 h-6 text-gov-blue" />
      </div>
      
      <div className="hidden md:block">
        <h2 className="font-semibold text-gray-800 text-lg">
          {user?.role === "OFFICER" ? "Officer Portal" : user?.role === "ADMIN" ? "Admin Portal" : "Citizen Portal"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-gray-500"
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell className="w-5 h-5" />
            {notifications.some(n => !n.is_read) && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-gov-red rounded-full"></span>
            )}
          </Button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-100 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-100 bg-gray-50 font-semibold text-sm flex justify-between items-center">
                <span>Notifications</span>
                {notifications.some(n => !n.is_read) && (
                  <span className="text-xs font-normal text-gov-blue cursor-pointer hover:underline" onClick={async () => {
                    try {
                      await apiFetch('/notifications/read-all', { method: 'PATCH' });
                    } catch (e) {
                      console.log("Ignored read-all error", e);
                    }
                    setNotifications(notifications.map(n => ({...n, is_read: true})));
                  }}>
                    Mark all as read
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">You have no new notifications.</div>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-100">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={async () => {
                          if (!n.is_read) {
                            try {
                              setNotifications(notifications.map(notif => notif.id === n.id ? {...notif, is_read: true} : notif));
                              await apiFetch(`/notifications/${n.id}/read`, { method: 'PATCH' });
                            } catch (e) {
                              console.log("Ignored read error", e);
                            }
                          }
                        }}
                        className={`p-4 text-sm cursor-pointer transition-colors hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                      >
                        <p className={`text-gray-900 ${!n.is_read ? 'font-medium' : ''}`}>{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gov-blue/10 flex items-center justify-center text-gov-blue">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">
              {user?.fullName || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {user?.role === "OFFICER" ? user?.department : user?.role === "ADMIN" ? "Administrator" : "Citizen"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
