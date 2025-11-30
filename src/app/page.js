"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Clock, Users, Trophy, Zap, Shield, Gamepad2, ChevronDown } from "lucide-react";
import Link from "next/link";
import LazySpline from "@/components/LazySpline";
import Spline from '@splinetool/react-spline';

gsap.registerPlugin(ScrollTrigger);

const topFeatures = [
  {
    icon: <Users size={40} className="text-accent-blue" />,
    title: "Collaborative Notes",
    description: "Share and edit notes with peers in real-time."
  },
  {
    icon: <Clock size={40} className="text-purple-400" />,
    title: "Smart Timer",
    description: "Track your study hours per subject."
  },
  {
    icon: <Trophy size={40} className="text-yellow-400" />,
    title: "Gamified Learning",
    description: "Earn streaks and climb leaderboards."
  }
];

const bottomFeatures = [
  {
    icon: <Zap size={40} className="text-orange-400" />,
    title: "Instant Sync",
    description: "Your notes are available everywhere, instantly."
  },
  {
    icon: <Shield size={40} className="text-green-400" />,
    title: "Premium Privacy",
    description: "End-to-end encryption ensures your notes stay private."
  },
  {
    icon: <Gamepad2 size={40} className="text-pink-400" />,
    title: "Study Games",
    description: "Take a break with built-in mini-games."
  },
  {
    icon: <span className="text-4xl">✒️</span>,
    title: "InkFlow",
    description: "Convert handwritten notes to Markdown with AI version control."
  }
];

import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (data?.username) {
          setUsername(data.username);
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (loading || username) return; // Don't run animations if loading or logged in
    const ctx = gsap.context(() => {
      // Hero Text Stagger
      const tl = gsap.timeline();
      tl.fromTo(
        ".hero-text-item",
        { y: 100, opacity: 0, rotateX: -45 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1.2,
          stagger: 0.15,
          ease: "power4.out"
        }
      );

      // Scroll Down Indicator
      gsap.to(".scroll-indicator", {
        y: 10,
        opacity: 0.5,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });

      // Features Stagger on Scroll
      gsap.fromTo(
        ".feature-card",
        { y: 100, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 85%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // CTA Parallax
      gsap.fromTo(
        ".cta-content",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

    }, containerRef);

    return () => ctx.revert();
  }, [loading, username]);

  if (loading) return <div className="bg-black h-screen w-full flex items-center justify-center text-white font-mono">LOADING...</div>;

  const onSplineLoad = (spline) => {
    // Hack to remove the "Move your mouse" hint
    // We wait a bit for the hint to appear, then try to find it
    setTimeout(() => {
      const splineContainer = spline.canvas.parentElement;
      if (splineContainer) {
        // Try to find the hint element by its content or structure
        // Usually it's a div with text "Move your mouse"
        const elements = splineContainer.querySelectorAll('div');
        elements.forEach(el => {
          if (el.textContent.includes('Move your mouse') || el.textContent.includes('Drag to rotate')) {
            el.style.display = 'none';
          }
        });

        // Also try to target shadow dom if it exists (though react-spline usually doesn't use it like the web component)
      }
    }, 1000);
  };

  if (username) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center font-mono relative overflow-hidden">

        {/* Spline 3D Scene Background */}
        <div className="absolute inset-0 z-0 opacity-80">
          <Spline
            scene="https://prod.spline.design/SDdGLD2c7uADKNPj/scene.splinecode"
            onLoad={onSplineLoad}
          />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center space-y-8 w-full max-w-4xl p-4 pointer-events-none">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter animate-pulse drop-shadow-2xl">HELLO, {username.toUpperCase()}</h1>
            <p className="text-gray-300 drop-shadow-md font-bold">WELCOME TO THE TAVERN</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4 pointer-events-auto">
            <Link href="/inkflow" className="p-6 border border-white/20 bg-black/40 backdrop-blur-md rounded-xl hover:bg-white/10 hover:border-accent-blue transition-all group shadow-lg">
              <h3 className="text-xl font-bold mb-2 group-hover:text-accent-blue">✒️ InkFlow</h3>
              <p className="text-sm text-gray-300">Digitize and version control your handwritten notes.</p>
            </Link>
            <div className="p-6 border border-white/20 bg-black/40 backdrop-blur-md rounded-xl hover:bg-white/10 transition-all group cursor-not-allowed opacity-50 shadow-lg">
              <h3 className="text-xl font-bold mb-2">⚔️ Quests (Coming Soon)</h3>
              <p className="text-sm text-gray-300">Complete daily challenges to earn XP.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center w-full overflow-hidden bg-premium-black">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative w-full h-screen flex flex-col items-center justify-center text-center px-4 perspective-1000 overflow-hidden"
      >
        {/* Spline Background */}
        <div className="absolute inset-0 z-0 mt-0">
          <LazySpline
            scene="https://prod.spline.design/hcOwDIXpJJR-bgeE/scene.splinecode"
            className="w-full h-full"
          />
        </div>

        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />

        <div ref={textRef} className="max-w-5xl mx-auto space-y-8 z-10 relative pointer-events-none">
          <div className="hero-text-item inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-4 pointer-events-auto">
            <span className="text-accent-blue text-sm font-medium tracking-wide uppercase">v2.0 is Live</span>
          </div>

          <h1 className="hero-text-item text-7xl md:text-9xl font-bold tracking-tighter text-white leading-[0.9]">
            Master Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">Knowledge.</span>
          </h1>

          <p className="hero-text-item text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The premium platform for collaborative learning. Share notes, track progress, and compete with friends in a stunning environment.
          </p>

          <div className="hero-text-item flex items-center justify-center gap-6 pt-8 pointer-events-auto">
            <Link
              href="/login"
              className="group relative px-8 py-4 bg-white text-black rounded-full font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              href="/contribute"
              className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-semibold text-lg text-white hover:bg-white/10 hover:border-white/20 transition-all"
            >
              Contribute
            </Link>
          </div>
        </div>

        <div className="scroll-indicator absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500 flex flex-col items-center gap-2 z-10">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown size={20} />
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-32 relative overflow-hidden">
        <div className="max-w-full">
          <div className="text-center mb-24 px-4">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">Elevate Your Learning</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">Everything you need to excel, wrapped in a beautiful, distraction-free interface.</p>
          </div>

          <div ref={featuresRef} className="space-y-12">
            {/* Row 1: Right to Left */}
            <div className="relative flex overflow-hidden group">
              <div className="flex gap-8 animate-marquee-left pause-on-hover whitespace-nowrap">
                {[...topFeatures, ...topFeatures, ...topFeatures, ...topFeatures].map((feature, i) => (
                  <FeatureCard key={`top-${i}`} {...feature} />
                ))}
              </div>
            </div>

            {/* Row 2: Left to Right */}
            <div className="relative flex overflow-hidden group">
              <div className="flex gap-8 animate-marquee-right pause-on-hover whitespace-nowrap">
                {[...bottomFeatures, ...bottomFeatures, ...bottomFeatures, ...bottomFeatures].map((feature, i) => (
                  <FeatureCard key={`bottom-${i}`} {...feature} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section ref={ctaRef} className="w-full min-h-screen py-32 px-4 relative flex flex-col items-center justify-center overflow-hidden">
        {/* Spline Background for CTA */}
        <div className="absolute inset-0 z-0">
          <LazySpline
            scene="https://prod.spline.design/eLIqSp2nblqvyfw4/scene.splinecode"
            className="w-full h-full"
          />
        </div>

        {/* Gradient Overlay - reduced opacity for better visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-premium-black via-transparent to-transparent z-0 pointer-events-none" />

        <div className="cta-content max-w-4xl mx-auto text-center space-y-8 p-12 rounded-[3rem] border border-white/5 bg-premium-black/60 z-10 relative pointer-events-none">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter">Ready to dive in?</h2>
          <p className="text-xl text-gray-400">Join thousands of students mastering their craft with NotesVerse.</p>
          <Link href="/signup" className="inline-block px-12 py-5 bg-accent-blue text-navy-blue rounded-full font-bold text-xl hover:bg-white hover:scale-105 transition-all duration-300 shadow-[0_0_30px_-5px_rgba(218,218,218,0.3)] pointer-events-auto">
            Join Now
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  const CardContent = (
    <div className="feature-card min-w-[350px] p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent-blue/30 transition-all duration-500 group cursor-default hover:-translate-y-2 will-change-transform">
      <div className="mb-6 p-4 bg-white/5 rounded-2xl w-fit group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 group-hover:text-accent-blue transition-colors">{title}</h3>
      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{description}</p>
    </div>
  );

  if (title === "InkFlow") {
    return (
      <Link href="/inkflow">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
