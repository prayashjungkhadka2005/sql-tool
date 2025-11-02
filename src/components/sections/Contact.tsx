"use client";

import { motion } from "framer-motion";

export default function Contact() {
  const contactVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section id="contact" className="relative py-20 px-6 bg-secondary/5 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl -z-10"></div>
      
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Get In Touch
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            I&apos;m currently available for freelance projects and full-time opportunities. 
            Let&apos;s build something great together!
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          <motion.a
            href="mailto:prayashjungkhadka@gmail.com"
            variants={contactVariants}
            className="relative backdrop-blur-sm bg-white/40 dark:bg-warm-dark/40 p-8 rounded-2xl border border-white/60 dark:border-secondary/30 hover:border-primary/40 dark:hover:border-primary/50 transition-all hover:shadow-2xl hover:scale-105 group"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all"></div>
            
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">Email</h3>
              <p className="text-foreground/70 text-xs break-all">prayashjungkhadka@gmail.com</p>
            </div>
          </motion.a>

          <motion.a
            href="https://www.upwork.com/freelancers/~016e3cd0e919937c81"
            target="_blank"
            rel="noopener noreferrer"
            variants={contactVariants}
            className="relative backdrop-blur-sm bg-white/40 dark:bg-warm-dark/40 p-8 rounded-2xl border border-white/60 dark:border-secondary/30 hover:border-primary/40 dark:hover:border-primary/50 transition-all hover:shadow-2xl hover:scale-105 group"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all"></div>
            
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228 1.076.008.042c.207 1.143.849 3.06 2.839 3.06 1.492 0 2.703-1.212 2.703-2.704-.001-1.492-1.212-2.703-2.704-2.703zm0 4.142c-1.133 0-1.736-.938-1.936-1.856-.128-.586-.258-1.394-.371-2.154-.005-.036-.01-.071-.016-.107-.145-.857-.281-1.666-.362-2.155-.07-.421-.013-.741.167-.925.153-.157.432-.235.865-.235.915 0 1.862.399 2.541 1.069.76.751 1.181 1.759 1.181 2.836.001.794-.634 1.439-1.414 1.439-.178 0-.347-.037-.502-.104l-.066-.027c-.287-.117-.514-.301-.635-.517-.128-.227-.158-.503-.087-.785.046-.185.142-.344.282-.465.147-.127.335-.197.529-.197.11 0 .214.021.31.062l.048.021c.267.119.437.376.437.663 0 .212-.088.408-.248.55-.143.127-.335.198-.54.198-.357 0-.674-.228-.793-.57-.106-.304-.068-.645.104-.936.172-.291.459-.491.788-.549.089-.016.18-.023.272-.023.497 0 .978.194 1.331.537.363.353.563.822.563 1.321 0 1.024-.832 1.856-1.856 1.856z"/>
                  <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zm-4.388.178c0-2.016-1.633-3.65-3.649-3.65-2.016 0-3.65 1.634-3.65 3.65s1.634 3.65 3.65 3.65c2.016 0 3.649-1.634 3.649-3.65zM9.316 17.35c-1.124 0-1.794-.816-1.794-1.917v-5.37H6.4v5.355c0 2.284 1.467 3.556 3.514 3.556.845 0 1.735-.236 2.488-.788v-7.123H11.28v5.37c-.535.573-1.213.917-1.964.917z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">Upwork</h3>
              <p className="text-foreground/70 text-xs">Available for hire</p>
            </div>
          </motion.a>

          <motion.a
            href="https://github.com/prayashjungkhadka2005"
            target="_blank"
            rel="noopener noreferrer"
            variants={contactVariants}
            className="relative backdrop-blur-sm bg-white/40 dark:bg-warm-dark/40 p-8 rounded-2xl border border-white/60 dark:border-secondary/30 hover:border-primary/40 dark:hover:border-primary/50 transition-all hover:shadow-2xl hover:scale-105 group"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all"></div>
            
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">GitHub</h3>
              <p className="text-foreground/70 text-xs break-all">@prayashjungkhadka2005</p>
            </div>
          </motion.a>

          <motion.a
            href="https://www.linkedin.com/in/prayashjungkhadka/"
            target="_blank"
            rel="noopener noreferrer"
            variants={contactVariants}
            className="relative backdrop-blur-sm bg-white/40 dark:bg-warm-dark/40 p-8 rounded-2xl border border-white/60 dark:border-secondary/30 hover:border-primary/40 dark:hover:border-primary/50 transition-all hover:shadow-2xl hover:scale-105 group"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all"></div>
            
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-lg">LinkedIn</h3>
              <p className="text-foreground/70 text-xs break-all">@prayashjungkhadka</p>
            </div>
          </motion.a>
        </motion.div>

        <div className="mt-16 pt-8 border-t border-primary/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-foreground/60 text-sm">
              © {new Date().getFullYear()} Prayash Jung Khadka. All rights reserved.
            </p>
            <p className="text-foreground/50 text-xs">
              Built with Next.js, TypeScript & Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
