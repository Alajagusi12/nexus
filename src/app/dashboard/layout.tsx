"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Search,
  ChevronDown,
  TrendingUp,
  Calendar,
} from "lucide-react";

import { CommandPalette } from "@/components/command-palette";
import { IncomingCallPopup } from "@/components/incoming-call";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/dashboard/chat",
    icon: MessageSquare,
    label: "Chat",
  },
  {
    href: "/dashboard/docs",
    icon: FileText,
    label: "Documents",
  },
  {
    href: "/dashboard/tasks",
    icon: CheckSquare,
    label: "Tasks",
  },
  {
    href: "/dashboard/calendar",
    icon: Calendar,
    label: "Calendar",
  },
  {
    href: "/dashboard/team",
    icon: Users,
    label: "Team",
  },
  {
    href: "/dashboard/analytics",
    icon: TrendingUp,
    label: "Analytics",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  const router = useRouter();
  const pathname = usePathname();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);

  const lastScrollRef = useRef(0);

  // Redirect unauthenticated users to the login page.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Keyboard shortcut for opening the command palette.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();

        window.dispatchEvent(
          new CustomEvent("open-command-palette")
        );
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Send presence pings while the user is authenticated.
  useEffect(() => {
    if (status !== "authenticated") return;

    const ping = () => {
      fetch("/api/presence/ping", {
        method: "POST",
      }).catch(() => {
        // Ignore network errors for background presence updates.
      });
    };

    ping();

    const interval = window.setInterval(ping, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [status]);

  // Hide the mobile navigation while scrolling down.
  // Show it again when scrolling up.
  useEffect(() => {
    const el = document.querySelector(
      ".dashboard-scroll"
    ) as HTMLElement | null;

    if (!el) return;

    lastScrollRef.current = el.scrollTop;

    const handleScroll = () => {
      const current = el.scrollTop;
      const diff = current - lastScrollRef.current;

      if (current <= 20) {
        setNavHidden(false);
      } else if (diff > 10 && current > 80) {
        setNavHidden(true);
      } else if (diff < -10) {
        setNavHidden(false);
      }

      lastScrollRef.current = current;
    };

    el.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Show a loading screen while authentication is being checked.
  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"
          role="status"
          aria-label="Loading dashboard"
        />
      </div>
    );
  }

  const user = session.user;

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 border-r border-border/20 flex-col flex-shrink-0">
        <div className="p-3 border-b border-border/20 space-y-1.5">
          <Link
            href="/dashboard"
            className="block px-2 py-1 text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent"
          >
            Nexus
          </Link>

          <WorkspaceSwitcher />
        </div>

        <nav
          className="flex-1 p-3 space-y-1"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-blue-500/10 text-blue-500 font-medium shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]"
                    : "text-muted hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />

                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/20">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:bg-foreground/5 hover:text-foreground transition"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main application area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Header */}
        <header className="h-14 border-b border-border/20 px-3 md:px-4 flex items-center justify-between flex-shrink-0 gap-2">
          <Link
            href="/dashboard"
            className="md:hidden text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent flex-shrink-0"
          >
            Nexus
          </Link>

          {/* Desktop search */}
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("open-command-palette")
              )
            }
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/20 bg-foreground/5 hover:bg-foreground/10 transition text-sm text-muted w-72"
            aria-label="Open search"
          >
            <Search className="w-4 h-4" />

            <span className="flex-1 text-left">
              Search people...
            </span>

            <kbd className="px-1.5 py-0.5 text-xs rounded border border-border/20 bg-foreground/5">
              Ctrl+K
            </kbd>
          </button>

          <div className="md:hidden flex-1" />

          {/* Header actions */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <ThemeToggle />

            <NotificationBell />

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setUserMenuOpen((open) => !open)
                }
                aria-label="Open user menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-1 md:gap-2 p-1 rounded-lg hover:bg-foreground/5 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold overflow-hidden ring-2 ring-border/20 text-white">
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <ChevronDown className="hidden md:block w-4 h-4 text-muted" />
              </button>

              {userMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close user menu"
                    onClick={() => setUserMenuOpen(false)}
                  />

                  <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border/20 bg-card shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-border/20">
                      <p className="text-sm font-medium truncate">
                        {user?.name}
                      </p>

                      <p className="text-xs text-muted truncate">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-foreground/5 transition"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        signOut({ callbackUrl: "/" })
                      }
                      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-foreground/5 transition w-full text-red-500"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="dashboard-scroll flex-1 min-h-0 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav
          aria-label="Mobile navigation"
          className={`fixed bottom-0 left-0 right-0 md:hidden bg-background/95 backdrop-blur-lg border-t border-border/20 z-30 transition-transform duration-300 ${
            navHidden
              ? "translate-y-full"
              : "translate-y-0"
          }`}
        >
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-all relative ${
                    isActive
                      ? "text-blue-500"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? "scale-110" : ""
                    }`}
                  />

                  <span
                    className={`text-[10px] font-medium ${
                      isActive ? "text-blue-500" : ""
                    }`}
                  >
                    {item.label}
                  </span>

                  {isActive && (
                    <div className="absolute top-0 w-10 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Global application components */}
      <CommandPalette />

      <IncomingCallPopup />
    </div>
  );
}