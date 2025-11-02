"use client";

import { useState, useEffect, useRef } from "react";

interface TerminalProps {
  terminalHeight: number;
  setTerminalHeight: (height: number) => void;
  onClose: () => void;
}

export default function Terminal({ terminalHeight, setTerminalHeight, onClose }: TerminalProps) {
  const terminalOutputRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const typeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<Array<{text: string, type?: string}>>([
    { text: "Welcome to Prayash's Dev Terminal! Type 'help' for commands.", type: "info" },
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Detect if desktop (non-touch device)
  useEffect(() => {
    setIsDesktop(!('ontouchstart' in window || navigator.maxTouchPoints > 0));
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (typeIntervalRef.current) {
        clearInterval(typeIntervalRef.current);
      }
    };
  }, []);

  // Typing animation effect
  const typeMessage = (message: string, type: string = "success") => {
    // Clear any existing interval
    if (typeIntervalRef.current) {
      clearInterval(typeIntervalRef.current);
    }

    setIsTyping(true);
    const words = message.split(" ");
    let currentText = "";
    let wordIndex = 0;

    typeIntervalRef.current = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex > 0 ? " " : "") + words[wordIndex];
        setTerminalHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = { text: currentText, type };
          return newHistory;
        });
        wordIndex++;
      } else {
        if (typeIntervalRef.current) {
          clearInterval(typeIntervalRef.current);
          typeIntervalRef.current = null;
        }
        setIsTyping(false);
        setTimeout(() => {
          terminalInputRef.current?.focus();
        }, 0);
      }
    }, 50);
  };

  // Terminal commands
  const handleTerminalCommand = () => {
    const cmd = terminalInput.trim();
    const cmdLower = cmd.toLowerCase();
    if (!cmd) return;

    setCommandHistory([...commandHistory, cmd]);
    setHistoryIndex(-1);
    setTerminalHistory(prev => [...prev, { text: `> ${cmd}`, type: "command" }]);
    setTerminalInput("");

    let response = "";
    let responseType = "success";

    switch (cmdLower) {
      case "help":
        response = "Commands: help, about, skills, contact, hire, projects, banner, coffee, joke, quote, secret, matrix, hack, whoami, ls, sudo";
        responseType = "info";
        break;
      case "about":
        response = "Full-Stack Developer | Backend & Team Management | 1,200+ hrs Upwork";
        break;
      case "skills":
        response = "React, Next.js, Node.js, TypeScript, PostgreSQL, MongoDB, Docker, AWS, Express";
        break;
      case "contact":
        response = "Email: prayashjungkhadka@gmail.com | GitHub: @prayashjungkhadka2005";
        break;
      case "hire":
      case "upwork":
        window.open("https://www.upwork.com/freelancers/~016e3cd0e919937c81", "_blank");
        response = "Opening Upwork... Let's build something amazing! 🚀";
        break;
      case "github":
        window.open("https://github.com/prayashjungkhadka2005", "_blank");
        response = "Opening GitHub... Check out my code! 💻";
        break;
      case "linkedin":
        window.open("https://www.linkedin.com/in/prayashjungkhadka/", "_blank");
        response = "Opening LinkedIn... Let's connect! 🤝";
        break;
      case "projects":
        response = "Blue Sky (Client), PustakBhandar, WeAreCars. All built with ❤️ and lots of ☕";
        break;
      case "coffee":
        response = "☕ Coffee.exe is running... Fuel for coding! My code runs on caffeine and pizza 🍕";
        break;
      case "joke":
        const jokes = [
          "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
          "How many programmers does it take to change a light bulb? None, it's a hardware problem! 💡",
          "A SQL query walks into a bar, walks up to two tables and asks... 'Can I JOIN you?' 🍺",
          "Why do Java developers wear glasses? Because they don't C# 👓",
          "I would tell you a UDP joke, but you might not get it... 📡",
        ];
        response = jokes[Math.floor(Math.random() * jokes.length)];
        break;
      case "quote":
        const quotes = [
          '"Code is like humor. When you have to explain it, it\'s bad." - Cory House',
          '"First, solve the problem. Then, write the code." - John Johnson',
          '"Any fool can write code that a computer can understand. Good programmers write code that humans can understand." - Martin Fowler',
          '"The best error message is the one that never shows up." - Thomas Fuchs',
        ];
        response = quotes[Math.floor(Math.random() * quotes.length)];
        break;
      case "banner":
        response = `
  ____                            _     
 |  _ \\ _ __ __ _ _   _  __ _ ___| |__  
 | |_) | '__/ _\` | | | |/ _\` / __| '_ \\ 
 |  __/| | | (_| | |_| | (_| \\__ \\ | | |
 |_|   |_|  \\__,_|\\__, |\\__,_|___/_| |_|
                  |___/`;
        responseType = "success";
        break;
      case "secret":
        response = "🎉 You found the secret! I sometimes talk to my rubber duck 🦆 when debugging...";
        responseType = "success";
        break;
      case "sudo":
        response = "Nice try! 😄 But you don't need sudo here, you already have full access!";
        responseType = "warning";
        break;
      case "ls":
        response = "hero.tsx  about.tsx  experience.tsx  skills.tsx  projects.tsx  contact.tsx";
        responseType = "info";
        break;
      case "whoami":
        response = "You're a visitor on Prayash's portfolio. But more importantly, you're awesome! 😎";
        responseType = "success";
        break;
      case "matrix":
        response = "01001000 01100101 01101100 01101100 01101111 00100001 🟢 The Matrix has you... Welcome to the real world! 💊";
        responseType = "success";
        break;
      case "hack":
        response = "Initializing... [████████████] 100% ✓ Access Granted! Just kidding 😄 I only hack code, not systems!";
        responseType = "success";
        break;
      case "quiz":
        response = "Q: What's the worst thing about JavaScript? A: Trying to explain 'this' to someone! 😅";
        responseType = "info";
        break;
      case "date":
        response = new Date().toLocaleString();
        responseType = "info";
        break;
      case "compliment":
        const compliments = [
          "You have great taste in portfolios! 🌟",
          "Your curiosity is inspiring! Keep exploring! 🔍",
          "You're going to build amazing things! 💪",
          "Smart people ask questions. You're smart! 🧠",
        ];
        response = compliments[Math.floor(Math.random() * compliments.length)];
        responseType = "success";
        break;
      case "clear":
        setTerminalHistory([{ text: "Terminal cleared. Ready for more commands! 🚀", type: "info" }]);
        return;
      default:
        response = `Command '${cmdLower}' not found. Type 'help' for available commands. Or try 'joke' for a laugh! 😄`;
        responseType = "error";
    }

    setTerminalHistory(prev => [...prev, { text: "", type: responseType }]);
    typeMessage(response, responseType);
  };

  // Handle arrow keys for command history
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex]);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput("");
      }
    } else if (e.key === "Enter") {
      handleTerminalCommand();
    }
  };

  // Auto-scroll to bottom when terminal history updates
  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  // Scroll input into view when focused (fixes mobile keyboard issue)
  const handleInputFocus = () => {
    if (terminalInputRef.current) {
      setTimeout(() => {
        terminalInputRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }, 300); // Wait for keyboard animation
    }
  };

  return (
      <div className="h-full backdrop-blur-xl bg-black/95 border-t-2 border-primary/30 shadow-2xl flex flex-col pointer-events-auto">
        {/* Drag to Resize Handle */}
        <div 
          className="h-0.5 sm:h-1 bg-gradient-to-r from-primary via-accent to-primary cursor-ns-resize hover:h-2 transition-all flex items-center justify-center group"
        onMouseDown={(e) => {
          const startY = e.clientY;
          const startHeight = terminalHeight;
          
          const handleMouseMove = (e: MouseEvent) => {
            const diff = startY - e.clientY;
            const newHeight = Math.min(Math.max(startHeight + diff, 150), 700);
            setTerminalHeight(newHeight);
          };
          
          const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };
          
          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
      />
      
          {/* Terminal Header */}
          <div className="px-3 sm:px-6 py-2 sm:py-3 border-b border-white/10 flex items-center justify-between bg-black/50">
            <div className="flex items-center gap-2 sm:gap-3">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs sm:text-sm font-bold text-gray-300">Dev Terminal</span>
              <span className="text-[10px] sm:text-xs text-gray-500 font-mono hidden sm:inline">prayash@portfolio:~$</span>
            </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTerminalHeight(150)}
            className="text-gray-400 hover:text-gray-200 px-2 py-1 hover:bg-white/10 rounded transition-all"
            title="Minimize"
          >
            —
          </button>
          <button
            onClick={() => setTerminalHeight(terminalHeight === 600 ? 300 : 600)}
            className="text-gray-400 hover:text-gray-200 px-2 py-1 hover:bg-white/10 rounded transition-all"
            title="Maximize"
          >
            ⛶
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-400 px-2 py-1 hover:bg-red-500/10 rounded transition-all ml-2"
            title="Close (ESC)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
          {/* Terminal Content */}
          <div ref={terminalOutputRef} className="flex-1 overflow-y-auto p-3 sm:p-6 font-mono text-xs sm:text-sm scroll-smooth">
        {terminalHistory.map((entry, index) => {
          const colorClass = 
            entry.type === "command" ? "text-green-400" :
            entry.type === "error" ? "text-red-400" :
            entry.type === "warning" ? "text-yellow-400" :
            entry.type === "info" ? "text-blue-400" :
            "text-gray-300";
          
          return (
            <div key={index} className={`${colorClass} mb-2 whitespace-pre-wrap`}>
              {entry.text}
            </div>
          );
        })}
        {isTyping && <span className="text-gray-500">▊</span>}
      </div>
      
          {/* Terminal Input */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-white/10 bg-black/50 flex items-center gap-2 sm:gap-3">
            <span className="text-green-400 font-mono text-base sm:text-lg">$</span>
            <input
              ref={terminalInputRef}
              type="text"
              className="flex-1 bg-transparent text-gray-200 focus:outline-none font-mono placeholder-gray-600 text-xs sm:text-sm"
              placeholder="Type a command..."
          value={terminalInput}
          onChange={(e) => setTerminalInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          disabled={isTyping}
          autoFocus={isDesktop}
        />
      </div>
    </div>
  );
}

