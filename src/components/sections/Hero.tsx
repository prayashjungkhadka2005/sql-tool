"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-warm-lightest via-warm-light/50 to-warm-lightest dark:from-[#1A1C1E] dark:via-[#1E2022] dark:to-[#252729] -z-10"></div>
      
      {/* Animated Gradient Orbs - Only warm colors */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 dark:bg-primary/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-60 dark:opacity-40 animate-blob -z-10"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-accent/30 dark:bg-accent/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-60 dark:opacity-40 animate-blob animation-delay-2000 -z-10"></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05] -z-10"></div>
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          
          {/* Profile Image - Clean with subtle shadow */}
          <motion.div 
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden ring-4 ring-white/20 dark:ring-secondary/30 shadow-2xl">
              <Image
                src="/images/profile.jpg"
                alt="Prayash Jung Khadka"
                fill
                className="object-cover"
                priority
                quality={90}
                sizes="(max-width: 768px) 256px, 320px"
              />
            </div>
          </motion.div>

          {/* Text Content */}
          <div className="flex-1 text-center md:text-left">
            <motion.div 
              className="inline-block mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="px-4 py-2 bg-white/90 dark:bg-warm-dark/80 border-2 border-[#52616B] dark:border-primary text-primary rounded-full text-sm font-medium shadow-md backdrop-blur-md">
                Full-Stack JavaScript Developer
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Prayash Jung K.
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-primary mb-6 font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              React • Next.js • Node.js • TypeScript
            </motion.p>
            
            <motion.p 
              className="text-lg text-foreground/80 mb-4 flex items-center justify-center md:justify-start gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Itahari, Nepal
            </motion.p>

            <motion.p 
              className="text-sm sm:text-base text-foreground/70 max-w-2xl mb-8 px-4 md:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              I build scalable, reliable, and production-ready web applications from frontend to backend 
              with React, Next.js, Node.js, and RESTful APIs using SQL and NoSQL databases.
            </motion.p>

            {/* Upwork Stats Badge */}
            <motion.div 
              className="flex items-center justify-center md:justify-start gap-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="flex items-center gap-2 px-4 py-2 backdrop-blur-md bg-white/80 dark:bg-warm-dark/80 border border-primary/30 rounded-full">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 18c-.621 0-1.125-.504-1.125-1.125s.504-1.125 1.125-1.125 1.125.504 1.125 1.125-.504 1.125-1.125 1.125zm1.125-2.813h-2.25v-1.125c0-.621.504-1.125 1.125-1.125s1.125-.504 1.125-1.125v-4.5c0-.621-.504-1.125-1.125-1.125s-1.125.504-1.125 1.125h-2.25c0-1.864 1.511-3.375 3.375-3.375s3.375 1.511 3.375 3.375v4.5c0 1.864-1.511 3.375-3.375 3.375z"/>
                </svg>
                <span className="text-sm font-semibold text-primary">1,200+ Hours</span>
                <span className="text-xs text-foreground/60">on Upwork</span>
              </div>
            </motion.div>

            <motion.div 
              className="flex flex-wrap gap-3 sm:gap-4 justify-center md:justify-start px-4 md:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <a
                href="https://www.upwork.com/freelancers/~016e3cd0e919937c81"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-accent text-white rounded-full hover:shadow-xl hover:scale-105 transition-all font-medium shadow-lg flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228 1.076.008.042c.207 1.143.849 3.06 2.839 3.06 1.492 0 2.703-1.212 2.703-2.704-.001-1.492-1.212-2.703-2.704-2.703zm0 4.142c-1.133 0-1.736-.938-1.936-1.856-.128-.586-.258-1.394-.371-2.154-.005-.036-.01-.071-.016-.107-.145-.857-.281-1.666-.362-2.155-.07-.421-.013-.741.167-.925.153-.157.432-.235.865-.235.915 0 1.862.399 2.541 1.069.76.751 1.181 1.759 1.181 2.836.001.794-.634 1.439-1.414 1.439-.178 0-.347-.037-.502-.104l-.066-.027c-.287-.117-.514-.301-.635-.517-.128-.227-.158-.503-.087-.785.046-.185.142-.344.282-.465.147-.127.335-.197.529-.197.11 0 .214.021.31.062l.048.021c.267.119.437.376.437.663 0 .212-.088.408-.248.55-.143.127-.335.198-.54.198-.357 0-.674-.228-.793-.57-.106-.304-.068-.645.104-.936.172-.291.459-.491.788-.549.089-.016.18-.023.272-.023.497 0 .978.194 1.331.537.363.353.563.822.563 1.321 0 1.024-.832 1.856-1.856 1.856z"/>
                  <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-4.388.178c0-2.016-1.633-3.65-3.649-3.65-2.016 0-3.65 1.634-3.65 3.65s1.634 3.65 3.65 3.65c2.016 0 3.649-1.634 3.649-3.65zM9.316 17.35c-1.124 0-1.794-.816-1.794-1.917v-5.37H6.4v5.355c0 2.284 1.467 3.556 3.514 3.556.845 0 1.735-.236 2.488-.788v-7.123H11.28v5.37c-.535.573-1.213.917-1.964.917z"/>
                </svg>
                <span className="whitespace-nowrap">Hire on Upwork</span>
              </a>
              <a
                href="#contact"
                className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-[#52616B] dark:border-primary text-primary rounded-full hover:bg-primary/10 transition-all font-medium text-sm sm:text-base whitespace-nowrap"
              >
                Get In Touch
              </a>
              <a
                href="#projects"
                className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-[#52616B] dark:border-primary/40 text-foreground hover:border-primary hover:text-primary hover:bg-primary/10 transition-all font-medium rounded-full text-sm sm:text-base whitespace-nowrap"
              >
                View Projects
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

