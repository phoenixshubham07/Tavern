"use client";
import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, ArrowRight, Cpu, Disc, Activity, Type } from 'lucide-react';
import { signIn } from "next-auth/react";

// ==========================================
// 1. TAVERN GLITCH COMPONENT
// ==========================================
const TavernGlitch = () => {
    const stageRef = useRef(null);
    const textContent = "TAVERN";
    const SLICE_COUNT = 45;
    const HOVER_RADIUS = 140;
    const FORCE = 65;

    useEffect(() => {
        if (!stageRef.current) return;
        const stage = stageRef.current;
        let slices = [];
        let mouseX = 0;
        let mouseY = 0;
        let isHovering = false;
        let animationFrameId;

        const existing = stage.querySelectorAll('.glitch-slice');
        existing.forEach(el => el.remove());

        for (let i = 0; i < SLICE_COUNT; i++) {
            const slice = document.createElement('div');
            slice.classList.add('glitch-slice');
            slice.innerText = textContent;
            const percentageStart = (i / SLICE_COUNT) * 100;
            const percentageEnd = ((i + 1) / SLICE_COUNT) * 100;
            slice.style.clipPath = `polygon(0% ${percentageStart}%, 100% ${percentageStart}%, 100% ${percentageEnd}%, 0% ${percentageEnd}%)`;
            stage.appendChild(slice);
            slices.push({ el: slice, ratioY: (i + 0.5) / SLICE_COUNT, offsetX: 0, targetOffsetX: 0 });
        }

        const handleEnter = () => { isHovering = true; };
        const handleLeave = () => { isHovering = false; };
        const handleMove = (e) => {
            const rect = stage.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        };

        stage.addEventListener('mouseenter', handleEnter);
        stage.addEventListener('mouseleave', handleLeave);
        stage.addEventListener('mousemove', handleMove);

        const animate = () => {
            const rect = stage.getBoundingClientRect();
            const height = rect.height;

            slices.forEach(slice => {
                if (isHovering) {
                    const sliceY = slice.ratioY * height;
                    const distY = Math.abs(mouseY - sliceY);

                    if (distY < HOVER_RADIUS) {
                        const intensity = 1 - (distY / HOVER_RADIUS);
                        const jitter = (Math.random() - 0.5) * 2;
                        slice.targetOffsetX = jitter * FORCE * intensity;
                        if (intensity > 0.4) {
                            slice.el.style.filter = `blur(${intensity * 3}px)`;
                        } else {
                            slice.el.style.filter = 'none';
                        }
                    } else {
                        slice.targetOffsetX = 0;
                        slice.el.style.filter = 'none';
                    }
                } else {
                    slice.targetOffsetX = 0;
                    slice.el.style.filter = 'none';
                }
                slice.offsetX += (slice.targetOffsetX - slice.offsetX) * 0.1;
                slice.el.style.transform = `translate(${slice.offsetX}px, 0)`;
            });
            animationFrameId = requestAnimationFrame(animate);
        }
        animate();

        return () => {
            stage.removeEventListener('mouseenter', handleEnter);
            stage.removeEventListener('mouseleave', handleLeave);
            stage.removeEventListener('mousemove', handleMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="h-full w-full flex items-center justify-center cursor-target" ref={stageRef}>
            <div className="tavern-wrapper">
                <h1 className="glitch-text-base">{textContent}</h1>
            </div>
        </div>
    );
};

// ==========================================
// 2. MAGNETIC CURSOR
// ==========================================
const MagneticCursor = () => {
    const cursorRef = useRef(null);
    const dotRef = useRef(null);
    const pos = useRef({ x: 0, y: 0 }); // Initialized to 0 to avoid jump
    const mouse = useRef({ x: 0, y: 0 });
    const size = useRef({ w: 20, h: 20 });
    const targetSize = useRef({ w: 20, h: 20 });
    const rotation = useRef(0);

    useEffect(() => {
        // Initialize position
        pos.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        mouse.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        const onMove = (e) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };
        window.addEventListener('mousemove', onMove);

        const render = () => {
            const ease = 0.15;
            let isHovering = false;
            document.querySelectorAll('.cursor-target, input, button, a').forEach(el => {
                if (el.matches(':hover')) {
                    isHovering = true;
                    const rect = el.getBoundingClientRect();
                    mouse.current.x = rect.left + rect.width / 2;
                    mouse.current.y = rect.top + rect.height / 2;
                    targetSize.current.w = rect.width + 15;
                    targetSize.current.h = rect.height + 15;
                    if (dotRef.current) dotRef.current.style.opacity = 0;
                }
            });

            if (!isHovering) {
                targetSize.current.w = 20;
                targetSize.current.h = 20;
                if (dotRef.current) dotRef.current.style.opacity = 1;
                rotation.current += 1;
            } else {
                rotation.current = 0;
            }

            pos.current.x += (mouse.current.x - pos.current.x) * ease;
            pos.current.y += (mouse.current.y - pos.current.y) * ease;
            size.current.w += (targetSize.current.w - size.current.w) * ease;
            size.current.h += (targetSize.current.h - size.current.h) * ease;

            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%) rotate(${rotation.current}deg)`;
                cursorRef.current.style.width = `${size.current.w}px`;
                cursorRef.current.style.height = `${size.current.h}px`;
            }
            requestAnimationFrame(render);
        };
        render();

        return () => {
            window.removeEventListener('mousemove', onMove);
        }
    }, []);

    return (
        <div id="cursor-root" ref={cursorRef}>
            <div className="cursor-box">
                <div className="cursor-corner tl"></div>
                <div className="cursor-corner tr"></div>
                <div className="cursor-corner bl"></div>
                <div className="cursor-corner br"></div>
                <div ref={dotRef} className="cursor-dot"></div>
            </div>
        </div>
    );
};

const CountUp = ({ to, duration = 2000 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            setCount(Math.floor(to * p));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [to]);
    return <span>{count}</span>;
};

// ==========================================
// 3. MAIN APP LAYOUT
// ==========================================
export default function LoginPage() {
    const [intro, setIntro] = useState(false);

    // --- INPUT STATE ---
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [isFocused, setIsFocused] = useState(false);
    const [isSignIn, setIsSignIn] = useState(true);

    useEffect(() => { setTimeout(() => setIntro(true), 500); }, []);

    const handleCredentialsLogin = async (e) => {
        e.preventDefault();
        // For now, using the mock credentials provider
        await signIn("credentials", {
            email,
            password,
            callbackUrl: "/" // Redirect to home on success
        });
    };

    const handleGoogleLogin = async () => {
        await signIn("google", { callbackUrl: "/" });
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black font-mono cursor-none">


            <MagneticCursor />

            <div className="relative z-40 flex w-full h-screen">

                {/* LEFT SIDE: Black Background */}
                <div className="w-1/2 h-full relative flex items-center justify-center bg-black">
                    <TavernGlitch />
                </div>

                {/* RIGHT SIDE: White Background, Rounded Edge */}
                <div className="w-1/2 h-full flex flex-col justify-center items-center relative bg-white text-black rounded-l-[20px] overflow-hidden">

                    <div className={`w-full max-w-md p-8 transition-all duration-1000 delay-200 ${intro ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20 pointer-events-none'}`}>

                        {/* CARD: Black Background, White Text (High Contrast) */}
                        <div className="space-y-8 rounded-xl border border-black/10 p-8 shadow-2xl shadow-black/30 bg-black text-white">

                            {/* Sign In / Sign Up Toggle */}
                            <div className="flex gap-6 cursor-target">
                                <button onClick={() => setIsSignIn(true)} className={`text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-all cursor-pointer ${isSignIn ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                                    Sign In
                                </button>
                                <button onClick={() => setIsSignIn(false)} className={`text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-all cursor-pointer ${!isSignIn ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                                    Sign Up
                                </button>
                            </div>

                            <div className="space-y-2 cursor-target">
                                <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-widest">
                                    <Cpu size={14} className="animate-spin-slow text-white" />
                                    <span>ACCESS TERMINAL</span>
                                </div>
                                <h2 className="text-3xl font-bold text-white tracking-tighter">
                                    {isSignIn ? 'WELCOME BACK.' : 'CREATE ACCOUNT.'}
                                </h2>
                            </div>

                            <form onSubmit={handleCredentialsLogin} className="space-y-6 text-left">

                                {/* NAME INPUT (Only shows in Sign Up mode) */}
                                {!isSignIn && (
                                    <div className="group relative">
                                        <div className="relative flex items-center border border-white/10 p-4 transition-colors hover:border-white/50">
                                            <Type className="text-gray-400 mr-4" size={20} />
                                            <div className="flex-1">
                                                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    onFocus={() => setIsFocused(true)}
                                                    className="w-full bg-transparent text-white outline-none font-bold tracking-wide placeholder-gray-600 cursor-text caret-white"
                                                    placeholder="ENTER NAME"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* IDENTITY / EMAIL INPUT */}
                                <div className="group relative">
                                    <div className="relative flex items-center border border-white/10 p-4 transition-colors hover:border-white/50">
                                        <User className="text-gray-400 mr-4" size={20} />
                                        <div className="flex-1">
                                            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Identity</label>
                                            <input
                                                type="text"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                onFocus={() => setIsFocused(true)}
                                                className="w-full bg-transparent text-white outline-none font-bold tracking-wide placeholder-gray-600 cursor-text caret-white"
                                                placeholder={isSignIn ? "AGENT_ID" : "EMAIL ADDRESS"}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* PASSWORD INPUT */}
                                <div className="group relative">
                                    <div className="relative flex items-center border border-white/10 p-4 transition-colors hover:border-white/50">
                                        <Lock className="text-gray-400 mr-4" size={20} />
                                        <div className="flex-1">
                                            <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Key</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                onFocus={() => setIsFocused(true)}
                                                className="w-full bg-transparent text-white outline-none font-bold tracking-wide placeholder-gray-600 cursor-text caret-white"
                                                placeholder="••••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <button type="submit" className="cursor-pointer group relative w-full h-14 bg-white text-black font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-all duration-300 overflow-hidden">
                                    <span className="relative flex items-center justify-center gap-3">
                                        {isSignIn ? 'Connect' : 'Register'} <ArrowRight size={18} />
                                    </span>
                                </button>

                                <button type="button" onClick={handleGoogleLogin} className="cursor-pointer group relative w-full h-14 bg-transparent border border-white/10 text-gray-400 font-bold uppercase tracking-[0.1em] hover:border-white hover:text-white transition-all duration-300 overflow-hidden text-xs">
                                    <span className="relative flex items-center justify-center gap-2">
                                        Google Auth
                                    </span>
                                </button>
                            </form>

                            {/* Footer */}
                            <div className="mt-8 flex justify-between items-end border-t border-white/10 pt-4 opacity-50">
                                <div className="text-[10px] text-gray-400 font-mono space-y-1">
                                    <div>VER.9.<CountUp to={99} /></div>
                                    <div className="flex items-center gap-2"><Activity size={10} /> <CountUp to={12} />ms</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Disc size={20} className={`text-gray-600 ${isFocused ? 'animate-spin text-white' : ''}`} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

