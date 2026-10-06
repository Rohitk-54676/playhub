"use client";

import { Home, Gamepad2, MessageCircle, Users, User } from "lucide-react";
import { NavItem } from "./NavItem";
import { NotificationBell } from "./NotificationBell";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

export function Nav() {
  const { unread } = useUnreadMessages();

    const items = [
    { href: "/", label: "Home", icon: Home, badge: 0 },
    { href: "/games", label: "Games", icon: Gamepad2, badge: 0 },
    { href: "/messages", label: "Chat", icon: MessageCircle, badge: unread },
    { href: "/friends", label: "Friends", icon: Users, badge: 0 },
    { href: "/settings", label: "Me", icon: User, badge: 0 },
  ];

  return (
    <>
      {/* Mobile: bottom — 6 items including bell */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-around py-2">
          <NavItem
            href={items[0].href}
            label={items[0].label}
            icon={items[0].icon}
            badge={items[0].badge}
            variant="mobile"
          />
          <NavItem
            href={items[1].href}
            label={items[1].label}
            icon={items[1].icon}
            badge={items[1].badge}
            variant="mobile"
          />

          {/* Notification bell as mobile nav item */}
          <div className="flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium text-muted-foreground">
            <NotificationBell />
            <span className="text-[10px]">Alerts</span>
          </div>

          <NavItem
            href={items[2].href}
            label={items[2].label}
            icon={items[2].icon}
            badge={items[2].badge}
            variant="mobile"
          />
          <NavItem
            href={items[3].href}
            label={items[3].label}
            icon={items[3].icon}
            badge={items[3].badge}
            variant="mobile"
          />
          <NavItem
            href={items[4].href}
            label={items[4].label}
            icon={items[4].icon}
            badge={items[4].badge}
            variant="mobile"
          />
        </div>
      </nav>

      {/* Desktop: sidebar */}
      <nav className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r bg-card/95 p-4 backdrop-blur-md md:flex">
        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-fg">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">PlayHub</span>
          </div>
          <NotificationBell variant="desktop" />
        </div>

        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              badge={item.badge}
              variant="desktop"
            />
          ))}
        </div>
      </nav>
    </>
  );
}