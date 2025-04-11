'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, CreditCard, HelpCircle, Sparkles, User, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [userData, setUserData] = useState<{
    email: string;
    name: string;
    plan: string;
    subscription_status: string;
    stripe_subscription_id: string | null;
    subscription_period_end: string | null;
  }>({
    email: '',
    name: '',
    plan: 'free',
    subscription_status: 'inactive',
    stripe_subscription_id: null,
    subscription_period_end: null,
  });

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        setUserData({
          email: user.email || '',
          name: profile.full_name || user.user_metadata?.full_name || user.email || 'User',
          plan: profile.plan || 'free',
          subscription_status: profile.subscription_status || 'inactive',
          stripe_subscription_id: profile.stripe_subscription_id || null,
          subscription_period_end: profile.subscription_period_end || null,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [supabase, router]);

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!userData.stripe_subscription_id) {
      toast.error('No active subscription found.');
      return;
    }

    try {
      setCancelLoading(true);
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId: userData.stripe_subscription_id }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to cancel subscription');
      }

      toast.success('Subscription canceled successfully. You will have access until the end of your billing period.');
      
      // Refresh user data
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setUserData({
          ...userData,
          subscription_status: profile.subscription_status || 'canceled',
        });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Error canceling subscription. Please try again or contact support.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle subscription update
  const handleManageSubscription = () => {
    router.push('/pricing');
  };

  // Format subscription status for display
  const formatSubscriptionStatus = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/50">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/50">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/50">Past Due</Badge>;
      case 'canceled':
        return <Badge className="bg-gray-500/20 text-gray-700 border-gray-500/50">Canceled</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-700 border-gray-500/50">Inactive</Badge>;
    }
  };

  // Format subscription end date for display
  const formatEndDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get plan details for display
  const getPlanDetails = () => {
    switch (userData.plan) {
      case 'pro':
        return {
          name: 'Pro',
          icon: <Zap className="h-5 w-5 text-indigo-500" />,
          color: 'text-indigo-500',
          features: [
            'All language modules',
            'Unlimited practice exercises',
            'Priority support',
            'Advanced progress tracking',
            'Offline access',
            'Custom study plans',
          ],
        };
      case 'premium':
        return {
          name: 'Premium',
          icon: <Sparkles className="h-5 w-5 text-purple-500" />,
          color: 'text-purple-500',
          features: [
            'Everything in Pro',
            '1-on-1 Language Coaching',
            'Personalized Study Plan',
            'Priority Customer Support',
            'Certificate of Completion',
            'Progress Analytics',
          ],
        };
      default:
        return {
          name: 'Free',
          icon: null,
          color: 'text-gray-500',
          features: [
            'Basic language modules',
            'Limited practice exercises',
            'Community support',
            'Progress tracking',
          ],
        };
    }
  };

  const planDetails = getPlanDetails();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent text-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="billing" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="space-y-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Current Plan
                {planDetails.icon && <span className="ml-2">{planDetails.icon}</span>}
              </CardTitle>
              <CardDescription>Manage your subscription and billing information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-xl font-semibold flex items-center">
                    <span className={planDetails.color}>{planDetails.name}</span>
                    <span className="ml-2">{formatSubscriptionStatus(userData.subscription_status)}</span>
                  </h3>
                  
                  {/* Subscription Info */}
                  {userData.plan !== 'free' && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium">{userData.subscription_status}</span>
                      </div>
                      {userData.subscription_period_end && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Next billing date:</span>
                          <span className="font-medium">{formatEndDate(userData.subscription_period_end)}</span>
                        </div>
                      )}
                      {userData.subscription_status === 'trialing' && (
                        <div className="flex items-center mt-2 p-2 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                          <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Your trial will end on {formatEndDate(userData.subscription_period_end)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border rounded-md p-4 bg-muted/20">
                  <h4 className="font-medium mb-2">Includes:</h4>
                  <ul className="space-y-1">
                    {planDetails.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {userData.plan === 'free' ? (
                <Button 
                  onClick={handleManageSubscription}
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleManageSubscription}
                    variant="outline"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Change Plan
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading || userData.subscription_status === 'canceled'}
                  >
                    {cancelLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Canceling...
                      </>
                    ) : (
                      <>Cancel Subscription</>
                    )}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>

          {/* Payment History Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View your recent payment history and download invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              {userData.plan === 'free' ? (
                <div className="py-6 text-center text-muted-foreground">
                  <p>No payment history available for free plan</p>
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  <p>View your invoices and payment history in the customer portal</p>
                  <Button variant="outline" className="mt-4">
                    View Customer Portal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">{userData.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{userData.name}</h3>
                  <p className="text-muted-foreground">{userData.email}</p>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={userData.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={userData.email} disabled />
                  <p className="text-sm text-muted-foreground">Your email cannot be changed</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Save Changes</Button>
            </CardFooter>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">Update Password</Button>
            </CardFooter>
          </Card>

          {/* Delete Account Card */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription>
                Permanently delete your account and all of your data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Once you delete your account, all of your data will be permanently removed.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="destructive">Delete Account</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 