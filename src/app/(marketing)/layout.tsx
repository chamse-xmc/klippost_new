"use client";

import { useState } from "react";
import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-white/80 backdrop-blur-sm">
          <nav className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
            {/* Spacer to balance the layout */}
            <div className="w-10" />

            {/* Logo - centered */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">klippost</span>
            </Link>

            {/* Burger menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-200/50 transition-colors"
              aria-label="Menu"
            >
              <div className="w-6 h-6 relative flex flex-col justify-center items-center">
                <span
                  className={`block h-0.5 w-5 bg-gray-900 rounded-full transition-all duration-300 ${
                    menuOpen ? "rotate-45 translate-y-0.5" : "-translate-y-1.5"
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-gray-900 rounded-full transition-all duration-300 ${
                    menuOpen ? "opacity-0 scale-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`block h-0.5 w-5 bg-gray-900 rounded-full transition-all duration-300 ${
                    menuOpen ? "-rotate-45 -translate-y-0.5" : "translate-y-1.5"
                  }`}
                />
              </div>
            </button>
          </nav>
        </div>

        {/* Full-width slide-down menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out bg-white shadow-lg ${
            menuOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0 shadow-none"
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-12 space-y-1">
            <Link
              href="/pricing"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-gray-700 hover:bg-gray-200/50 rounded-xl font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/onboarding"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-gray-700 hover:bg-gray-200/50 rounded-xl font-medium transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-gray-700 hover:bg-gray-200/50 rounded-xl font-medium transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
