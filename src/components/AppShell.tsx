"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sliders, History, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProximoLogo } from "./ProximoLogo";
import { ConnectionBadge } from "./ConnectionBadge";
import type { ReactNode } from "react";

/** Navigation items */
const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/control", label: "Control", icon: Sliders },
  { href: "/history", label: "History", icon: History },
  { href: "/about", label: "About", icon: Info },
] as const;

interface AppShellProps {
  children: ReactNode;
}

/**
 * App shell with:
 * - Top bar (always): Proximo wordmark + ConnectionBadge
 * - Sidebar (desktop md+): navigation links
 * - Bottom tab bar (mobile <md): navigation tabs
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Top bar ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-bg/80 backdrop-blur-md px-4 h-14">
        <Link href="/" className="flex items-center gap-2.5 group">
          <ProximoLogo size={24} />
          <span className="text-base font-bold tracking-tight text-text group-hover:text-accent transition-colors">
            Proximo
          </span>
        </Link>
        <ConnectionBadge />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar (desktop) ───────────────────────────── */}
        <nav
          className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-bg/50 backdrop-blur-sm pt-6 pb-4 px-3"
          aria-label="Main navigation"
        >
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted hover:text-text hover:bg-white/[0.04]"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Main content ────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 px-4 md:px-8 pt-6">
          {children}
        </main>
      </div>

      {/* ── Bottom tab bar (mobile) ───────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-border bg-bg/90 backdrop-blur-md h-16"
        aria-label="Main navigation"
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
                isActive ? "text-accent" : "text-muted"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]")} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

