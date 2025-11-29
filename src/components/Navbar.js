"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Book, Timer, Gamepad2, HelpCircle, PenTool } from "lucide-react";

const navItems = [
  { name: "inkFLOW", path: "/notes", icon: Book },
  { name: "Features", path: "/timer", icon: Timer },
  { name: "FAQ", path: "/faq", icon: HelpCircle },
  { name: "Contribute", path: "/contribute", icon: PenTool },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl"
    >
      <div className="bg-glass-white backdrop-blur-md border border-white/10 rounded-full px-6 py-3 shadow-2xl flex items-center justify-between relative">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity">
            <span className="text-accent-blue font-bold text-2xl tracking-tighter font-gilroy">TAVERN</span>
        </Link>
        
        {/* Center: Nav Items */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className="relative px-4 py-2 rounded-full transition-colors duration-300 group"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? "text-accent-blue" : "text-gray-400 group-hover:text-white"}`}>
                   <Icon size={16} />
                   <span className="hidden sm:block">{item.name}</span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Right: Login Button */}
        <div className="flex-shrink-0">
            <Link 
                href="/login"
                className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-colors shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
            >
                Login
            </Link>
        </div>
      </div>
    </motion.nav>
  );
}
