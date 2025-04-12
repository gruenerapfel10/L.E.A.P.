'use client'

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Languages, Rocket, Sparkles, Users } from "lucide-react";
import { useTranslation } from 'react-i18next'; // Import the hook
import { useEffect, useState } from 'react'; // Import useState and useEffect
import { AnimatedFast } from "@/components/animated-fast";
import { Footer } from "@/components/footer";

// Helper function to render the grid columns
// Accepts keyPrefix and an array of pre-calculated offsets
const renderGrid = (keyPrefix: string, offsets: number[]) => {
  const cols = [...Array(8)];
  const rows = [...Array(6)];
  
  return (
    <div className="flex gap-4 z-0">
      {cols.map((_, colIndex) => {
        // Get the pre-calculated offset for this column index
        const offsetY = offsets[colIndex]; 
        return (
          <div 
            key={`${keyPrefix}-col-${colIndex}`} 
            className="flex flex-col space-y-4 flex-1"
            // Apply the consistent offset
            style={{ transform: `translateY(${offsetY}rem)` }}
          >
            {rows.map((_, rowIndex) => (
              <div 
                key={`${keyPrefix}-row-${colIndex}-${rowIndex}`}
                className="aspect-[4/3] border border-slate-400 dark:border-white/[0.05] rounded-lg backdrop-blur-sm bg-gradient-to-br from-white to-indigo-100 dark:from-indigo-950/[0.2] dark:to-purple-950/[0.2] will-change-transform"
                style={{
                  // No individual animation needed anymore
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  transformOrigin: 'center center'
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default function Home() {
  const { t } = useTranslation(); // Initialize the hook
  const [isMounted, setIsMounted] = useState(false);

  // State for column offsets (keep this)
  const [columnOffsets, setColumnOffsets] = useState<number[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Generate random offsets ONCE on component mount
    const maxRandomOffsetRem = 15;
    setColumnOffsets([...Array(8)].map(() => -(Math.random() * maxRandomOffsetRem)));
  }, []); // Empty dependency array ensures this runs only once

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] bg-white dark:bg-[#030014] overflow-hidden pt-16">
        {/* Gradient Background */}
        <div className="absolute inset-0">
          {/* Main gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white/50 dark:from-[#030014] dark:via-transparent dark:to-[#030014]/50" />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/[0.08] via-indigo-500/[0.08] to-purple-500/[0.08] dark:from-indigo-500/[0.15] dark:via-purple-500/[0.15] dark:to-pink-500/[0.15]" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-l from-blue-500/[0.12] to-transparent dark:from-indigo-500/[0.2] dark:to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-r from-indigo-500/[0.12] to-transparent dark:from-purple-500/[0.2] dark:to-transparent blur-3xl" />
          
          {/* Animated Grid Pattern Container */}
          <div className="absolute inset-0 flex flex-col overflow-hidden z-0">
            <div className="relative w-full mx-auto h-full overflow-hidden"> 
              {/* Wrapper Div - This gets animated */}
              <div className="absolute inset-x-0 top-0 flex flex-col space-y-4 animate-vertical-scroll"> 
                {/* Pass the SAME offsets array to both copies */}
                {columnOffsets.length > 0 && renderGrid('copy1', columnOffsets)}
                {columnOffsets.length > 0 && renderGrid('copy2', columnOffsets)}
              </div>
            </div>
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-[#030014] dark:via-[#030014]/50 dark:to-transparent" />
        </div>
        
        {/* Content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 flex min-h-[calc(100vh-4rem)] z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Main Content */}
            <div className="flex flex-col max-w-2xl pt-12 lg:pt-0">
              {/* Badge */}
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium mb-8 w-fit animate-fade-in-up hover:border-primary/50 transition-colors cursor-default group">
                <Sparkles className="mr-2 h-4 w-4 animate-pulse text-primary" />
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                  {isMounted ? t('home.revolutionizing') : null}
                </span>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6 animate-fade-in-up [animation-delay:200ms] flex flex-wrap items-center gap-2">
                {isMounted ? t('home.heroTitle') : null}{" "}
                <AnimatedFast />
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-muted-foreground mb-8 animate-fade-in-up [animation-delay:400ms] leading-relaxed">
                {isMounted ? t('home.heroSubtitle') : null}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-in-up [animation-delay:600ms]">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
                  asChild
                >
                  <Link href="/signup">
                    {isMounted ? t('home.startJourney') : null}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  asChild
                >
                  <Link href="#features">
                    {isMounted ? t('home.learnMore') : null}
                  </Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex flex-col gap-6 animate-fade-in-up [animation-delay:800ms]">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium"
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">2,000+</span> students already learning
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">4.9/5</span> average rating
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Feature Preview */}
            <div className="relative lg:block animate-fade-in-up [animation-delay:1000ms]">
              <div className="relative">
                {/* Main Feature Image/Preview */}
                <div className="aspect-[4/3] rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm p-2 shadow-2xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-shadow">
                  <div className="w-full h-full rounded-lg bg-slate-100 dark:bg-white/[0.02] overflow-hidden">
                    {/* Placeholder for app preview/screenshot */}
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 animate-gradient-x" />
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm p-2 shadow-xl animate-float">
                  <div className="w-full h-full rounded-lg bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white/50 dark:bg-white/[0.02] backdrop-blur-sm p-2 shadow-xl animate-float-delayed">
                  <div className="w-full h-full rounded-lg bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-indigo-500/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 bg-black">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4 text-white">
              {isMounted ? t('features.sectionTitle') : null}
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {isMounted ? t('features.sectionSubtitle') : null}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Rocket className="h-8 w-8" />,
                titleKey: "features.feature1Title",
                descriptionKey: "features.feature1Desc",
                delay: 200
              },
              {
                icon: <Languages className="h-8 w-8" />,
                titleKey: "features.feature2Title",
                descriptionKey: "features.feature2Desc",
                delay: 400
              },
              {
                icon: <Users className="h-8 w-8" />,
                titleKey: "features.feature3Title",
                descriptionKey: "features.feature3Desc",
                delay: 600
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="relative p-8 rounded-2xl border border-white/10 bg-white/5 animate-fade-in-up hover:bg-white/10 transition-colors"
                style={{ animationDelay: `${feature.delay}ms` }}
              >
                <div className="relative z-10">
                  <div className="inline-flex p-3 rounded-xl bg-white/10 mb-6 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{isMounted ? t(feature.titleKey) : null}</h3>
                  <p className="text-white/70 leading-relaxed">{isMounted ? t(feature.descriptionKey) : null}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 bg-black">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4 text-white">
              {isMounted ? t('howItWorks.sectionTitle') : null}
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {isMounted ? t('howItWorks.sectionSubtitle') : null}
            </p>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 transform -translate-y-1/2 hidden md:block" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: "1",
                  titleKey: "howItWorks.step1Title",
                  descriptionKey: "howItWorks.step1Desc",
                  delay: 200
                },
                {
                  step: "2",
                  titleKey: "howItWorks.step2Title",
                  descriptionKey: "howItWorks.step2Desc",
                  delay: 400
                },
                {
                  step: "3",
                  titleKey: "howItWorks.step3Title",
                  descriptionKey: "howItWorks.step3Desc",
                  delay: 600
                }
              ].map((step, index) => (
                <div 
                  key={index} 
                  className="relative p-8 rounded-2xl border border-white/10 bg-white/5 animate-fade-in-up hover:bg-white/10 transition-colors"
                  style={{ animationDelay: `${step.delay}ms` }}
                >
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center text-lg font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 mt-4 text-center text-white">{isMounted ? t(step.titleKey) : null}</h3>
                  <p className="text-white/70 text-center leading-relaxed">{isMounted ? t(step.descriptionKey) : null}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32 bg-black">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4 text-white">
              {isMounted ? t('testimonials.sectionTitle') : null}
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {isMounted ? t('testimonials.sectionSubtitle') : null}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                nameKey: "testimonials.testimonial1Name",
                roleKey: "testimonials.testimonial1Role",
                quoteKey: "testimonials.testimonial1Quote",
                delay: 200
              },
              {
                nameKey: "testimonials.testimonial2Name",
                roleKey: "testimonials.testimonial2Role",
                quoteKey: "testimonials.testimonial2Quote",
                delay: 400
              },
              {
                nameKey: "testimonials.testimonial3Name",
                roleKey: "testimonials.testimonial3Role",
                quoteKey: "testimonials.testimonial3Quote",
                delay: 600
              }
            ].map((testimonial, index) => (
              <div 
                key={index} 
                className="relative p-8 rounded-2xl border border-white/10 bg-white/5 animate-fade-in-up hover:bg-white/10 transition-colors"
                style={{ animationDelay: `${testimonial.delay}ms` }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center text-lg font-bold">
                    {isMounted ? t(testimonial.nameKey).charAt(0) : null}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-white">{isMounted ? t(testimonial.nameKey) : null}</h3>
                    <p className="text-sm text-white/70">{isMounted ? t(testimonial.roleKey) : null}</p>
                  </div>
                </div>
                <blockquote className="relative">
                  <span className="absolute -top-2 -left-2 text-4xl text-white/20">"</span>
                  <p className="text-white/70 leading-relaxed pl-4">{isMounted ? t(testimonial.quoteKey) : null}</p>
                </blockquote>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-black">
        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative p-12 md:p-16 rounded-3xl border border-white/10 bg-white/5">
            {/* Content */}
            <div className="relative text-center max-w-3xl mx-auto animate-fade-in-up">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 text-white">
                {isMounted ? t('cta.title') : null}
              </h2>
              <p className="text-xl mb-10 text-white/70">
                {isMounted ? t('cta.subtitle') : null}
              </p>
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-white/90 transition-colors"
                asChild
              >
                <Link href="/signup">
                  {isMounted ? t('cta.button') : null}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
