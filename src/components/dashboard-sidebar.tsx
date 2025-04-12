'use client'; // Needs to be client for router and potentially logout

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { Icons } from "@/components/icons"; // Your icons component
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';

export type SidebarNavItem = {
  title: string;
  href: string;
  icon: keyof typeof Icons;
  iconColor?: string;
  disabled?: boolean;
  translatedTitle?: string;
};

interface DashboardSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  user: {
    name: string;
    email: string;
    initial: string;
    plan: string;
  };
  navItems: SidebarNavItem[];
  isSheet?: boolean;
}

export function DashboardSidebar({
  className,
  user,
  navItems: initialNavItems,
  isSheet = false,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hydratedNavItems, setHydratedNavItems] = useState<SidebarNavItem[]>(initialNavItems);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && i18n.isInitialized) {
      const translatedItems = initialNavItems.map(item => ({
        ...item,
        translatedTitle: t(`dashboard.nav.${item.title}`)
      }));
      setHydratedNavItems(translatedItems);
    }
  }, [isHydrated, initialNavItems, t, i18n.isInitialized]);

  const collapsed = !isSheet && isCollapsed;
  
  const content = (
    <div className="flex h-full flex-col gap-2 bg-sidebar z-10">
      <div className={cn(
        "relative border-b border-border/80",
        collapsed ? "p-2" : "p-4"
      )}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxsaW5lIHgxPSIwIiB5PSIwIiB4Mj0iMCIgeTI9IjUwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PGxpbmUgeDE9IjUwIiB5PSIwIiB4Mj0iNTAiIHkyPSI1MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')] opacity-30" />
                {user.initial}
              </AvatarFallback>
            </Avatar>
            {!isSheet && (
              <Button
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setIsCollapsed(!isCollapsed)}
                size="icon"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxsaW5lIHgxPSIwIiB5PSIwIiB4Mj0iMCIgeTI9IjUwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PGxpbmUgeDE9IjUwIiB5PSIwIiB4Mj0iNTAiIHkyPSI1MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')] opacity-30" />
                  {user.initial}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
                </p>
              </div>
            </div>

            {!isSheet && (
              <Button
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={() => setIsCollapsed(!isCollapsed)}
                size="icon"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {user.plan === 'free' && !collapsed && (
        <div className="px-4 py-2">
          <Button
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
            onClick={() => router.push('/pricing')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      )}
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {hydratedNavItems.map((item) => {
            const Icon = Icons[item.icon];
            const displayTitle = item.translatedTitle || t(`dashboard.nav.${item.title}`);
            return (
              item.href && (
                <Link
                  key={item.href}
                  href={item.disabled ? "/" : item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary/10 text-primary border border-border/80"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border hover:border-border/60",
                    item.disabled && "cursor-not-allowed opacity-80",
                    collapsed && "justify-center"
                  )}
                  aria-disabled={item.disabled}
                >
                  <Icon className={cn("h-4 w-4", item.iconColor)} />
                  <span className={cn("truncate", collapsed && "hidden")}>
                    {isHydrated ? displayTitle : ''}
                  </span>
                </Link>
              )
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  if (isSheet) {
    return content;
  }

  return (
    <div className={cn(
      "z-10 pb-12 transition-all duration-300 border-r border-border/80",
      collapsed ? "w-[70px]" : "w-[220px]",
      className
    )}>
      {content}
    </div>
  );
} 