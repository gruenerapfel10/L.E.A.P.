'use client';

import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Define Price IDs from environment variables for clarity and safety
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'pro_default_id';
const PREMIUM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || 'premium_default_id';

const tiers = [
  {
    name: "Free",
    id: "free",
    price: { monthly: "$0" },
    description: "Start learning the basics at your own pace, absolutely free.",
    targetUser: "For casual learners & beginners",
    features: [
      "Access core language modules",
      "Track your basic progress",
      "Engage with community forums",
      "Limited practice exercises",
    ],
    buttonText: "Start Learning for Free",
    buttonActionType: 'redirect',
    redirectUrl: '/signup',
    buttonVariant: "outline",
    highlighted: false,
  },
  {
    name: "Pro",
    id: PRO_PRICE_ID,
    price: { monthly: "$9.99" },
    description: "Unlock full access and accelerate your fluency.",
    targetUser: "For serious learners aiming for mastery",
    features: [
      { text: "Everything in Free, plus:", bold: true },
      { text: "Complete access to ALL language modules" },
      { text: "Unlimited practice exercises & quizzes" },
      { text: "Personalized study plans & goal setting" },
      { text: "Advanced progress tracking & analytics" },
      { text: "Download lessons for offline access" },
      { text: "Priority email support" },
    ],
    buttonText: "Start 14-Day Pro Trial",
    buttonActionType: 'checkout',
    buttonVariant: "default",
    highlighted: true,
    trialInfo: "then $9.99/month. Cancel anytime.",
  },
  {
    name: "Premium",
    id: PREMIUM_PRICE_ID,
    price: { monthly: "$19.99" },
    description: "Master the language with expert guidance and coaching.",
    targetUser: "For professionals & advanced learners",
    features: [
      { text: "Everything in Pro, plus:", bold: true },
      { text: "Weekly 1-on-1 coaching sessions" },
      { text: "Expert feedback on assignments" },
      { text: "Priority access to new features" },
      { text: "Official certificate upon completion" },
      { text: "Dedicated account manager" },
    ],
    buttonText: "Start 14-Day Premium Trial",
    buttonActionType: 'checkout',
    buttonVariant: "outline",
    highlighted: false,
    trialInfo: "then $19.99/month. Cancel anytime.",
  },
];

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleButtonClick = async (tier: typeof tiers[number]) => {
    if (tier.buttonActionType === 'redirect' && tier.redirectUrl) {
      router.push(tier.redirectUrl);
    } else if (tier.buttonActionType === 'checkout') {
      await handleCheckout(tier.id);
    }
  };

  const handleCheckout = async (priceId: string) => {
    setIsLoading(priceId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create checkout session');
      }

      const data = await response.json();
      if (!data.url) throw new Error('No checkout URL returned');

      window.location.href = data.url;
    } catch (error: any) {
      console.error('Checkout Error:', error.message);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Unlock Your Language Potential
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan to achieve fluency faster. From casual learning to expert coaching, we have you covered.
          </p>
          <div className="mt-10 flex justify-center">
            <Button 
              size="lg" 
              onClick={() => document.getElementById(PRO_PRICE_ID)?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Plans
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              id={tier.id}
              className={cn(
                "relative flex flex-col h-full rounded-2xl border bg-card p-8 shadow-sm",
                tier.highlighted
                  ? "border-primary ring-2 ring-primary shadow-lg z-10"
                  : "border-border hover:shadow-md"
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <div className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-md">
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="flex-grow">
                <div className="mb-6 text-center lg:text-left">
                  <h2 className="text-2xl font-bold tracking-tight">{tier.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{tier.targetUser}</p>
                  <p className="mt-4">
                    <span className="text-4xl font-extrabold tracking-tight">{tier.price.monthly}</span>
                    <span className="text-base font-medium text-muted-foreground">/month</span>
                  </p>
                  <p className="mt-4 text-base text-foreground">{tier.description}</p>
                </div>

                <ul className="space-y-3 text-sm">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span className={cn(typeof feature === 'object' && feature.bold && "font-semibold")}>
                        {typeof feature === 'string' ? feature : feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Button
                  className={cn(
                    "w-full text-base py-3",
                    tier.highlighted && "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-95 shadow-lg"
                  )}
                  variant={tier.buttonVariant as "default" | "outline"}
                  onClick={() => handleButtonClick(tier)}
                  disabled={!!isLoading}
                >
                  {isLoading === tier.id ? (
                    <div className="flex items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      {tier.buttonText}
                      {tier.highlighted && <Zap className="ml-2 h-4 w-4" />}
                    </>
                  )}
                </Button>
                {tier.trialInfo && (
                  <p className="mt-3 text-xs text-muted-foreground text-center">{tier.trialInfo}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 max-w-4xl mx-auto">
            {[
              {
                question: "How does the 14-day free trial work?",
                answer: "When you sign up for a Pro or Premium plan, you get full access for 14 days without being charged. We'll remind you before your trial ends. If you don't cancel, your card will be charged the monthly fee. You can cancel anytime during the trial."
              },
              {
                question: "Can I change my plan later?",
                answer: "Absolutely! You can upgrade or downgrade your plan at any time from your account settings. Changes and prorated charges or credits will apply from your next billing cycle."
              },
              {
                question: "What payment methods are accepted?",
                answer: "We securely process payments through Stripe, accepting all major credit cards (Visa, Mastercard, American Express), and in some regions, other methods like PayPal or local bank transfers."
              },
              {
                question: "How do I cancel my subscription?",
                answer: "You can easily cancel your subscription anytime from your account settings page. You'll retain access to your plan's features until the end of your current billing period (or trial period)."
              },
              {
                question: "What if I'm not satisfied?",
                answer: "We strive for your success! While we don't offer refunds on monthly plans after the trial, if you encounter any issues, please contact our support team, and we'll do our best to make things right."
              }
            ].map((faq, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 