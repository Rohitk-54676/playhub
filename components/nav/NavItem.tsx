"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  variant: "mobile" | "desktop";
}

export function NavItem({ href, label, icon: Icon, variant }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));

  if (variant === "mobile") {
    return (
      <Link
        href={href}
        className={cn(
          "relative flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
          active ? "text-accent" : "text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
        {active && (
          <motion.div
            layoutId="nav-active-mobile"
            className="absolute -top-2 h-1 w-8 rounded-full bg-accent"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent/10 text-accent"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
      {active && (
        <motion.div
          layoutId="nav-active-desktop"
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </Link>
  );
}