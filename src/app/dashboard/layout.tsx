'use client';

import { ReactNode, memo, useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardSidebar, type SidebarNavItem } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';

// Memoize the sidebar items to prevent re-renders
const sidebarNavItems: SidebarNavItem[] = [
  {
    title: "overview",
    href: "/dashboard",
    icon: "dashboard",
    iconColor: "text-indigo-500/70",
  },
  {
    title: "languageSkills",
    href: "/dashboard/language-skills",
    icon: "languages",
    iconColor: "text-purple-500/70",
  },
  {
    title: "vocabulary",
    href: "/dashboard/vocabulary",
    icon: "book",
    iconColor: "text-green-500/70",
  },
  {
    title: "grammarLibrary",
    href: "/dashboard/library",
    icon: "library",
    iconColor: "text-green-500",
  },
  {
    title: "settings",
    href: "/dashboard/settings",
    icon: "settings",
    iconColor: "text-pink-500/70",
  },
];

// Memoized header component
const MemoizedHeader = memo(function MemoizedHeader({ user, navItems }: { user: { name: string; email: string; initial: string; plan: string }, navItems: SidebarNavItem[] }) {
  return (
    <DashboardHeader 
      user={user} 
      navItems={navItems} 
    />
  );
});

// Memoized sidebar component
const MemoizedSidebar = memo(function MemoizedSidebar({ user, navItems }: { user: { name: string; email: string; initial: string; plan: string }, navItems: SidebarNavItem[] }) {
  return (
    <DashboardSidebar 
      user={user} 
      navItems={navItems} 
      className="hidden md:block overflow-y-auto border-r border-border/40 bg-card" 
    />
  );
});

// Helper function to get debug subscription info
function getDebugSubscriptionInfo() {
  if (process.env.NEXT_PUBLIC_DEBUG_SUBSCRIPTION === 'true') {
    return {
      plan: process.env.DEBUG_SUBSCRIPTION_PLAN || 'free',
      subscription_status: process.env.DEBUG_SUBSCRIPTION_STATUS || 'inactive'
    };
  }
  return null;
}

interface ProfileData {
  id: string;
  email: string;
  full_name?: string;
  plan: string;
  subscription_status: string;
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    initial: string;
    plan: string;
    subscription_status: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      const supabase = createClient();
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.log("[DashboardLayout] Auth error or no user found, redirecting to login.");
        redirect('/login');
        return;
      }

      console.log(`[DashboardLayout] Auth user found: ${authUser.id}, Email: ${authUser.email}`);

      // Check for debug mode
      const debugInfo = getDebugSubscriptionInfo();
      if (debugInfo) {
        console.log('[DashboardLayout] Debug mode enabled:', debugInfo);
      }

      // Fetch profile data separately to get the latest subscription status
      console.log(`[DashboardLayout] Fetching profile data for user: ${authUser.id}`);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single() as { data: ProfileData | null };

      console.log('[DashboardLayout] Profile data:', profile);

      if (!profile) {
        console.log('[DashboardLayout] No profile found, creating one');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: authUser.id,
              email: authUser.email,
              plan: debugInfo?.plan || 'free',
              subscription_status: debugInfo?.subscription_status || 'inactive'
            }
          ]);

        if (insertError) {
          console.error('[DashboardLayout] Error creating profile:', insertError);
          throw insertError;
        }
      }
      
      // Combine data, prioritizing debug mode if enabled
      const displayName = profile?.full_name || authUser.user_metadata?.full_name || authUser.email || 'User';
      const displayInitial = displayName?.charAt(0).toUpperCase() || '?';
      const userEmail = authUser.email || '';
      
      // Use debug values if enabled, otherwise use profile values
      const userPlan = debugInfo ? debugInfo.plan : (profile?.plan || 'free');
      const subscriptionStatus = debugInfo ? debugInfo.subscription_status : (profile?.subscription_status || 'inactive');
      
      console.log(`[DashboardLayout] Final user data for rendering - Name: ${displayName}, Email: ${userEmail}, Plan: ${userPlan}, Status: ${subscriptionStatus}`);

      setUserData({
        name: displayName,
        email: userEmail,
        initial: displayInitial,
        plan: userPlan,
        subscription_status: subscriptionStatus
      });
      setIsLoading(false);
    }

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent text-primary"></div>
      </div>
    );
  }

  if (!userData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col h-screen bg-background relative">
      {/* Header - Memoized */}
      <MemoizedHeader user={userData} navItems={sidebarNavItems} />
      
      {/* Content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar - Memoized */}
        <MemoizedSidebar user={userData} navItems={sidebarNavItems} />
        
        {/* Main content area - This is the only part that will re-render */}
        <main className="flex-1 min-h-0 overflow-y-auto relative bg-sidebar">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
          {children}
        </main>
      </div>
    </div>
  );
} 