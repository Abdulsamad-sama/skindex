"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "./ui/button";
import { UserCircle, Menu, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/analysis", label: "Analysis" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/weather", label: "Weather" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

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
                className={`font-manrope text-sm font-medium transition-all duration-200 ${
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
        <div className="flex items-center space-x-2 md:space-x-4">
          <ThemeToggle />
          
          <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400">
            <UserCircle className="w-6 h-6" />
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        } bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800`}
      >
        <div className="flex flex-col space-y-4 px-6 py-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)} // Close menu on click
                className={`text-base font-medium transition-colors ${
                  isActive
                    ? "text-[#00C2B8] dark:text-[#40dcd1]"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
