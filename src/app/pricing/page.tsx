'use client';

import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, ArrowRight, Star, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Define Price IDs from environment variables for clarity and safety
const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'pro_default_id'; // Provide fallback for safety
const PREMIUM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || 'premium_default_id'; // Provide fallback for safety

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

const checkmarkVariants = {
  hidden: { opacity: 0, pathLength: 0 },
  visible: (i: number) => ({
    opacity: 1,
    pathLength: 1,
    transition: {
      delay: i * 0.05 + 0.2,
      duration: 0.3,
      ease: "easeInOut"
    }
  })
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2 + i * 0.1,
      duration: 0.6,
      ease: "easeOut"
    }
  }),
  hover: { 
    y: -10,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 17
    }
  }
};

const buttonVariants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 10
    }
  },
  tap: { scale: 0.98 }
};

const MotionCheck = motion(Check);

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
    redirectUrl: '/signup', // Or '/dashboard' if user might be logged in
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
    buttonVariant: "default", // Primary action style
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
  const [isLoading, setIsLoading] = useState<string | null>(null); // Track loading state per button
  const router = useRouter();
  const supabase = createClient(); // Consider checking auth state here if needed for button actions

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
      // Ensure the user is logged in before checkout? Optional, depends on flow.
      // const { data: { session } } = await supabase.auth.getSession();
      // if (!session) {
      //   router.push('/login?redirect=/pricing'); // Redirect to login first
      //   return; 
      // }

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
      // TODO: Show user-friendly error message (e.g., using a toast notification)
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Enhanced Hero Section */}
      <motion.section 
        className="relative py-24 md:py-32 overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-50"></div>
        <motion.div 
          className="absolute inset-0 bg-grid-white/[0.03] bg-[size:40px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        ></motion.div>
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.h1 
            custom={0}
            variants={fadeIn}
            className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Unlock Your Language Potential
            </span>
          </motion.h1>
          <motion.p 
            custom={1}
            variants={fadeIn}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            Choose the perfect plan to achieve fluency faster. From casual learning to expert coaching, we have you covered. Start your journey today!
          </motion.p>
          <motion.div 
            custom={2}
            variants={fadeIn}
            className="mt-10 flex justify-center gap-4"
          >
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={buttonVariants}
            >
              <Button 
                size="lg" 
                onClick={() => document.getElementById(PRO_PRICE_ID)?.scrollIntoView({ behavior: 'smooth' })}
                className="overflow-hidden relative"
              >
                <span className="z-10 relative">View Plans</span>
                <motion.span 
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 to-pink-500/40"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "0%" }}
                  transition={{ duration: 0.4 }}
                />
                <ArrowRight className="ml-2 h-5 w-5 relative z-10" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Restructured Pricing Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              id={tier.id} // Add ID for potential scrolling
              className={cn(
                "relative flex flex-col h-full rounded-2xl border bg-card p-8 shadow-sm transition-all",
                tier.highlighted
                  ? "border-primary ring-2 ring-primary shadow-lg z-10" // Enhanced highlighting
                  : "border-border hover:shadow-md"
              )}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              whileHover={tier.highlighted ? {} : "hover"}
              viewport={{ once: true, margin: "-100px" }}
            >
              {tier.highlighted && (
                <motion.div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 transform"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <div className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-md">
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      Most Popular
                    </motion.span>
                  </div>
                </motion.div>
              )}

              <div className="flex-grow"> {/* Makes cards in a row equal height */}
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
                    <motion.li 
                      key={featureIndex} 
                      className="flex items-start"
                      custom={featureIndex}
                      variants={fadeIn}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-50px" }}
                    >
                      <MotionCheck 
                        className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-primary" 
                        custom={featureIndex}
                        variants={checkmarkVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                      />
                      <span className={cn(typeof feature === 'object' && feature.bold && "font-semibold")}>
                        {typeof feature === 'string' ? feature : feature.text}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="mt-8"> {/* Button container */}
                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                  variants={buttonVariants}
                >
                  <Button
                    className={cn(
                      "w-full text-base py-3", // Larger button
                      tier.highlighted && "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-95 shadow-lg"
                    )}
                    variant={tier.buttonVariant as "default" | "outline"}
                    onClick={() => handleButtonClick(tier)}
                    disabled={!!isLoading} // Disable all buttons if any checkout is loading
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
                </motion.div>
                {tier.trialInfo && (
                  <p className="mt-3 text-xs text-muted-foreground text-center">{tier.trialInfo}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof Section (Placeholder) */}
      <motion.section 
        className="py-16 bg-muted/30"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-3xl font-bold tracking-tight mb-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Join Thousands of Successful Learners
          </motion.h2>
          <motion.p 
            className="text-muted-foreground mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Don't just take our word for it. See what our community achieves.
          </motion.p>
          <div className="flex justify-center items-center space-x-2 text-yellow-400 mb-6">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
              >
                <Star className="h-6 w-6 fill-current" />
              </motion.div>
            ))}
          </div>
          <motion.p 
            className="text-lg font-medium"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            Rated 4.9/5 stars by over 5,000 learners!
          </motion.p>
        </div>
      </motion.section>

      {/* Trust Signals Section */}
      <motion.section 
        className="py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            className="flex justify-center items-center space-x-4 mb-4"
            initial={{ y: 10, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <ShieldCheck className="h-6 w-6 text-muted-foreground" />
            <p className="text-muted-foreground">Secure payments powered by Stripe</p>
          </motion.div>
          <motion.p 
            className="mt-4 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Cancel your subscription anytime. No hidden fees.
          </motion.p>
        </div>
      </motion.section>

      {/* Enhanced FAQ Section (Using Grid layout as Accordion is not available) */}
      <motion.section 
        className="py-16 bg-muted/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-3xl font-bold text-center mb-12"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Frequently Asked Questions
          </motion.h2>
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
              // Add more FAQs as needed
            ].map((faq, index) => (
              <motion.div 
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
} 