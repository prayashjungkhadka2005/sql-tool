"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage or system preference on mount
    const isDark = localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className="fixed bottom-16 sm:top-6 sm:bottom-auto left-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 group/container">
      {/* Fun label - appears on hover */}
      <span className="hidden md:block opacity-0 group-hover/container:opacity-100 transition-opacity duration-300 text-sm font-medium text-foreground/70 backdrop-blur-md bg-white/60 dark:bg-warm-dark/60 px-3 py-1.5 rounded-full border border-primary/20 shadow-md">
        {darkMode ? "Light it up! ☀️" : "Go dark! 🌙"}
      </span>
      
      <button
        onClick={toggleTheme}
        className="p-2 sm:p-2.5 rounded-full backdrop-blur-md bg-white/60 dark:bg-warm-dark/60 border border-primary/20 hover:border-primary/40 hover:scale-110 hover:rotate-12 transition-all duration-300 shadow-lg group"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          // Sun icon for light mode - spins on hover!
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          // Moon icon for dark mode - bounces on hover!
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-125 group-hover:-rotate-12 transition-all duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

