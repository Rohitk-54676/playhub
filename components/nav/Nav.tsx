"use client";

import { Home, Gamepad2, MessageCircle, Users, User } from "lucide-react";
import { NavItem } from "./NavItem";

const ITEMS = [
  { href: "/",             label: "Home",    icon: Home },
  { href: "/play/bingo",   label: "Games",   icon: Gamepad2 },
  { href: "/messages",     label: "Chat",    icon: MessageCircle },
  { href: "/friends",      label: "Friends", icon: Users },
  { href: "/settings",     label: "Me",      icon: User },
];

export function Nav() {
  return (
    <>
      {/* Mobile: bottom */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around py-2">
          {ITEMS.map((item) => (
            <NavItem key={item.href} {...item} variant="mobile" />
          ))}
        </div>
      </nav>

      {/* Desktop: sidebar */}
      <nav className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r bg-card/95 p-4 backdrop-blur-md md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-fg">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">PlayHub</span>
        </div>

        <div className="flex flex-col gap-1">
          {ITEMS.map((item) => (
            <NavItem key={item.href} {...item} variant="desktop" />
          ))}
        </div>
      </nav>
    </>
  );
}