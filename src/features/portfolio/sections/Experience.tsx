"use client";

import { motion } from "framer-motion";

export default function Experience() {
  const experiences = [
    {
      company: "Streamline Berkshire Inc",
      title: "Blue Sky Online Real Estate School",
      role: "Backend & Team Management",
      period: "Feb 2025 - Present",
      status: "In Progress",
      type: "Contract",
      location: "Virginia, USA",
      website: "https://www.blueskyonlinerealestateschool.org/",
      description: "Leading backend development and team coordination for online real estate education platform with course management, payment processing, and admin dashboard.",
    },
    {
      company: "BrahmaByte Lab Pvt Ltd",
      role: "Back End Developer",
      period: "Jul 2024 - Sep 2024",
      duration: "3 months",
      location: "Itahari, Nepal",
      type: "Internship",
      website: "https://brahmabytelab.com/",
      description: "Developed backend APIs and database architecture for web applications. Worked with Node.js, Express, and PostgreSQL.",
    },
  ];

  return (
    <section id="experience" className="relative py-20 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl -z-10"></div>
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Experience
          </h2>
          <p className="text-foreground/70 text-lg">
            My professional journey as a developer
          </p>
        </div>

        <motion.div
          className="space-y-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.2 },
            },
          }}
        >
          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, x: -30 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
              }}
              className="relative backdrop-blur-sm bg-white/40 dark:bg-warm-dark/40 p-8 rounded-2xl border border-white/60 dark:border-secondary/30 hover:border-primary/40 dark:hover:border-primary/50 transition-all hover:shadow-2xl group"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all"></div>
              
              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {exp.role}
                      </h3>
                      {exp.status === "In Progress" && (
                        <span className="px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>
                    <a 
                      href={exp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-primary font-semibold mb-2 hover:underline inline-flex items-center gap-1 group/link"
                    >
                      {exp.company}
                      <svg className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    {exp.title && (
                      <p className="text-base text-foreground/70 mb-2">
                        {exp.title}
                      </p>
                    )}
                    {exp.location && (
                      <p className="text-sm text-foreground/60 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {exp.location}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className="px-3 py-1 backdrop-blur-sm bg-primary/10 border border-primary/20 text-primary text-xs font-medium rounded-full">
                      {exp.type}
                    </span>
                    <p className="text-sm text-foreground/70 font-medium">
                      {exp.period}
                    </p>
                    {exp.duration && (
                      <p className="text-xs text-foreground/50">
                        {exp.duration}
                      </p>
                    )}
                  </div>
                </div>
                
                <p className="text-foreground/70 leading-relaxed">
                  {exp.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

