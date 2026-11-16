"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import {
  LayoutDashboard, MessageSquare, FileText, CheckSquare, Users,
  Settings, LogOut, Search, ChevronDown, TrendingUp, Calendar, Zap,
  PanelLeftClose, PanelLeftOpen, Command
} from "lucide-react";

import { CommandPalette } from "@/components/command-palette";
import { IncomingCallPopup } from "@/components/incoming-call";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", shortcut: "G D" },
  { href: "/dashboard/chat", icon: MessageSquare, label: "Chat", shortcut: "G C" },
  { href: "/dashboard/docs", icon: FileText, label: "Documents", shortcut: "G O" },
  { href: "/dashboard/tasks", icon: CheckSquare, label: "Tasks", shortcut: "G T" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendar", shortcut: "G A" },
  { href: "/dashboard/team", icon: Users, label: "Team", shortcut: "G M" },
  { href: "/dashboard/analytics", icon: TrendingUp, label: "Analytics", shortcut: "G N" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const lastScrollRef = useRef(0);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-command-palette"));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    const ping = () => fetch("/api/presence/ping", { method: "POST" }).catch(() => {});
    ping();
    const interval = window.setInterval(ping, 30000);
    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const el = document.querySelector(".dashboard-scroll") as HTMLElement | null;
    if (!el) return;

    lastScrollRef.current = el.scrollTop;

    const handleScroll = () => {
      const current = el.scrollTop;
      const diff = current - lastScrollRef.current;
      
      setIsScrolled(current > 10);

      if (current <= 20) setNavHidden(false);
      else if (diff > 10 && current > 80) setNavHidden(true);
      else if (diff < -10) setNavHidden(false);

      lastScrollRef.current = current;
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const user = session.user;
  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      
      {/* ===================== DESKTOP SIDEBAR ===================== */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 260 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="hidden md:flex border-r border-border/40 flex-col flex-shrink-0 bg-background/50 backdrop-blur-xl relative z-30"
      >
        {/* Sidebar Header */}
        <div className={`flex items-center border-b border-border/40 h-16 ${isCollapsed ? "justify-center px-2" : "px-4 justify-between"}`}>
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">Nexus</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 fill-current" />
              </div>
            </Link>
          )}
        </div>

        {/* Workspace Switcher */}
        {!isCollapsed && (
          <div className="px-4 py-4">
            <WorkspaceSwitcher />
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all group relative ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    : "text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && !isCollapsed && (
                  <motion.span layoutId="active-nav-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-500 rounded-r-full" />
                )}
                <item.icon className={`w-[18px] h-[18px] transition-transform group-hover:scale-110 flex-shrink-0 ${isActive ? "text-emerald-500" : ""}`} />
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-muted-foreground bg-foreground/[0.06] px-1.5 py-0.5 rounded transition-opacity">
                      {item.shortcut}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border/40 space-y-1">
          <Link href="/dashboard/settings" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-muted hover:bg-foreground/[0.04] hover:text-foreground transition-all ${isCollapsed ? "justify-center px-0" : ""}`}>
            <Settings className="w-[18px] h-[18px]" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-muted hover:bg-foreground/[0.04] hover:text-foreground transition-all ${isCollapsed ? "justify-center px-0" : ""}`}
          >
            {isCollapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
            {!isCollapsed && <span>Collapse menu</span>}
          </button>
        </div>
      </motion.aside>

      {/* ===================== MAIN AREA ===================== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative">
        
        {/* HEADER */}
        <header className={`h-16 border-b px-4 md:px-6 flex items-center justify-between flex-shrink-0 gap-4 z-20 sticky top-0 transition-all duration-300 ${
          isScrolled ? "bg-background/80 backdrop-blur-xl border-border/50 shadow-sm" : "bg-background border-transparent"
        }`}>
          <Link href="/dashboard" className="md:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-lg font-bold tracking-tight">Nexus</span>
          </Link>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-border/50 bg-card hover:bg-foreground/[0.03] transition-all text-[13px] text-muted w-72 shadow-sm group"
          >
            <Search className="w-4 h-4 group-hover:text-emerald-500 transition-colors" />
            <span className="flex-1 text-left font-medium">Search workspace...</span>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-foreground/[0.04] border border-border/50">⌘</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-foreground/[0.04] border border-border/50">K</kbd>
            </div>
          </button>

          <div className="md:hidden flex-1" />

          <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
            <ThemeToggle />
            <NotificationBell />

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-foreground/[0.04] transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[11px] font-bold ring-2 ring-background shadow-sm text-white">
                  {user?.image ? <img src={user.image} alt="User" className="w-full h-full object-cover" /> : initials}
                </div>
                <ChevronDown className="hidden md:block w-3.5 h-3.5 text-muted" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border/50 bg-card shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-border/50 bg-foreground/[0.02]">
                        <p className="text-[14px] font-bold truncate text-foreground">{user?.name}</p>
                        <p className="text-[12px] text-muted truncate mt-0.5">{user?.email}</p>
                      </div>
                      <div className="p-1.5">
                        <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium hover:bg-foreground/[0.04] transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <Settings className="w-4 h-4 text-muted" /> Account Settings
                        </Link>
                        <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium hover:bg-red-500/10 text-red-500 transition-colors w-full mt-1">
                          <LogOut className="w-4 h-4" /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="dashboard-scroll flex-1 min-h-0 overflow-y-auto pb-20 md:pb-0 scroll-smooth custom-scrollbar">
          {children}
        </main>

        {/* MOBILE NAV */}
        <nav
          className={`fixed bottom-0 left-0 right-0 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/40 z-30 transition-transform duration-300 pb-safe ${
            navHidden ? "translate-y-full" : "translate-y-0"
          }`}
        >
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-xl transition-all relative ${
                    isActive ? "text-emerald-500" : "text-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                  <span className={`text-[10px] font-bold ${isActive ? "text-emerald-500" : ""}`}>
                    {item.label}
                  </span>
                  {isActive && <div className="absolute top-0 w-8 h-0.5 bg-emerald-500 rounded-full" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <CommandPalette />
      <IncomingCallPopup />
    </div>
  );
}