import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function UserAvatar({
  username,
  displayName,
  avatarUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const initial = (displayName ?? username)?.[0]?.toUpperCase() ?? "?";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={cn(
          "rounded-full object-cover",
          SIZES[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-fg",
        SIZES[size],
        className
      )}
    >
      {initial}
    </div>
  );
}