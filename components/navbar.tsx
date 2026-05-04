"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/analysis", label: "Analysis" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/weather", label: "Weather" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-black text-[#00C2B8] dark:text-[#40dcd1] tracking-tighter"
        >
          Skindex
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-[family-name:var(--font-manrope)] text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-[#00C2B8] dark:text-[#40dcd1] border-b-2 border-[#00C2B8] dark:border-[#40dcd1] pb-1"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#00C2B8] dark:hover:text-[#40dcd1] hover:-translate-y-0.5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button className="material-symbols-outlined text-slate-600 dark:text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            account_circle
          </button>
        </div>
      </div>
    </nav>
  );
}
