"use client";

import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("home");
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Cancel previous animation frame if exists
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Use requestAnimationFrame for smooth, optimized updates
      rafRef.current = requestAnimationFrame(() => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);

        // Update active section based on scroll position
        const sections = ["home", "about", "experience", "skills", "projects", "contact"];
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
              setActiveSection(section);
              break;
            }
          }
        }
      });
    };

    // Initial call
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const navItems = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Experience", href: "#experience" },
    { name: "Skills", href: "#skills" },
    { name: "Projects", href: "#projects" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <>
      {/* Scroll Progress Bar - On Top of Toolbar */}
      <div className="fixed bottom-14 sm:bottom-16 left-0 right-0 h-1 bg-transparent z-[70] pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary shadow-lg will-change-[width]"
          style={{ 
            width: `${scrollProgress}%`,
            transition: 'width 0.05s linear'
          }}
        />
      </div>

      {/* Modern Floating Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-2 sm:px-4">
        <div className="bg-background/70 dark:bg-warm-dark/70 backdrop-blur-xl rounded-full border border-primary/20 dark:border-secondary/30 shadow-lg px-3 sm:px-6 py-2 sm:py-3 transition-all duration-200">
          <div className="flex items-center justify-between">
            {/* Desktop Navigation */}
            <ul className="hidden md:flex items-center gap-2 mx-auto">
              {navItems.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={`relative inline-block px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full overflow-hidden ${
                      activeSection === item.href.substring(1)
                        ? "text-white bg-gradient-to-r from-primary to-accent shadow-md"
                        : "text-foreground/80 hover:text-foreground hover:bg-primary/10"
                    }`}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* Mobile Navigation - Optimized for small screens */}
            <ul className="flex md:hidden items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs mx-auto overflow-x-auto scrollbar-hide">
              {navItems.map((item) => (
                <li key={item.name} className="flex-shrink-0">
                  <a
                    href={item.href}
                    className={`inline-block px-2 sm:px-3 py-1.5 font-medium transition-all duration-300 rounded-full overflow-hidden whitespace-nowrap ${
                      activeSection === item.href.substring(1)
                        ? "text-white bg-gradient-to-r from-primary to-accent"
                        : "text-foreground/70 hover:text-foreground hover:bg-primary/10"
                    }`}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* CTA Button - Desktop Only */}
            <a
              href="#contact"
              className="hidden md:block ml-6 px-6 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-full text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Let&apos;s Talk
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}

