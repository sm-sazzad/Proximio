"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sliders, History, Info, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProximoLogo } from "./ProximoLogo";
import { ConnectionBadge } from "./ConnectionBadge";
import { SoundToggle } from "./SoundToggle";
import type { ReactNode } from "react";

/** Main navigation items */
const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/control", label: "Control", icon: Sliders },
  { href: "/history", label: "History", icon: History },
  { href: "/about", label: "About", icon: Info },
] as const;

/** Developer navigation item */
const developerNavItem = {
  href: "/developer",
  label: "Developer",
  icon: Code2,
} as const;

/** All items for mobile bottom tab bar (5 items) */
const mobileNavItems = [...mainNavItems, developerNavItem] as const;

interface AppShellProps {
  children: ReactNode;
}

/**
 * App shell with:
 * - Defined sticky top bar (h-14, 56px) with z-50 and opaque backdrop
 * - Desktop sidebar sticky below the header (top-14) so it is never covered
 * - Natural main content flow starting cleanly below header with proper padding
 * - Bottom tab bar on mobile (h-16) with safe bottom padding on main
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* ── Fixed Height Top Bar (h-14 = 56px) ─────────────────────────── */}
      <header className="sticky top-0 z-50 h-14 w-full shrink-0 border-b border-border bg-bg/95 backdrop-blur-md px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <ProximoLogo size={24} />
          <span className="text-base font-bold tracking-tight text-text group-hover:text-accent transition-colors">
            Proximo
          </span>
        </Link>
        <div className="flex items-center gap-2.5">
          <SoundToggle />
          <ConnectionBadge />
        </div>
      </header>

      {/* ── Body Container Below Header ───────────────────────────────── */}
      <div className="flex flex-1 w-full">
        {/* ── Sidebar (desktop md+) ──────────────────────────────────── */}
        <aside
          className="hidden md:flex flex-col w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] border-r border-border bg-bg/60 backdrop-blur-sm p-3 pt-5 overflow-y-auto"
          aria-label="Main navigation"
        >
          {/* Main Navigation Links */}
          <ul className="space-y-1">
            {mainNavItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      isActive
                        ? "bg-accent/10 text-accent font-semibold"
                        : "text-muted hover:text-text hover:bg-white/[0.04]",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {label}
                  </Link>
                </li>
              );
            })}

            {/* Developer Item Placed Directly Below About */}
            <li className="pt-2">
              <div className="border-t border-border/50 mb-2" />
              <Link
                href={developerNavItem.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  pathname === developerNavItem.href
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-muted hover:text-text hover:bg-white/[0.04]",
                )}
                aria-current={pathname === developerNavItem.href ? "page" : undefined}
              >
                <developerNavItem.icon className="h-4.5 w-4.5" />
                <span>{developerNavItem.label}</span>
              </Link>
            </li>
          </ul>
        </aside>

        {/* ── Main Content Area ────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── Bottom Tab Bar (mobile <md, 5 items) ────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch border-t border-border bg-bg/95 backdrop-blur-md h-16"
        aria-label="Main navigation"
      >
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors min-h-[44px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
                isActive ? "text-accent font-semibold" : "text-muted",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive && "drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]",
                )}
              />
              <span className="truncate max-w-[64px]">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
