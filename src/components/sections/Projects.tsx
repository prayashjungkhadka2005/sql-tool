"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  SiNextdotjs, 
  SiPostgresql, 
  SiDocker, 
  SiMongodb,
  SiReact,
  SiNodedotjs,
  SiExpress,
  SiTailwindcss,
  SiStripe,
  SiDotnet
} from "react-icons/si";
import { FaAws, FaDatabase } from "react-icons/fa";

// Tech icon mapping
const techIcons: { [key: string]: any } = {
  "Next.js": SiNextdotjs,
  "PostgreSQL": SiPostgresql,
  "Docker": SiDocker,
  "AWS": FaAws,
  "Stripe": SiStripe,
  "ASP.NET Core": SiDotnet,
  "React": SiReact,
  "Entity Framework": FaDatabase,
  "Node.js": SiNodedotjs,
  "Express": SiExpress,
  "MongoDB": SiMongodb,
  "Tailwind CSS": SiTailwindcss,
};

export default function Projects() {
  const projects = [
    {
      title: "Blue Sky Online Real Estate School",
      description: "Professional online course platform for Virginia real estate education. Features course management, user authentication, payment processing, and comprehensive admin dashboard.",
      tech: ["Next.js", "PostgreSQL", "Docker", "AWS", "Stripe"],
      link: "https://www.blueskyonlinerealestateschool.org/",
      image: "/projects/blue-sky.png",
      type: "Client Project",
    },
    {
      title: "PustakBhandar - Book Store",
      description: "Modern online bookstore platform with user authentication, advanced search & filtering, shopping cart, wishlist, order management, and admin dashboard.",
      tech: ["ASP.NET Core", "React", "PostgreSQL", "Entity Framework"],
      link: "https://github.com/prayashjungkhadka2005/new-pustak-bhandar",
      image: "/projects/pustak-bhandar.png",
      type: "Personal Project",
    },
    {
      title: "WeAreCars - Car Rental Platform",
      description: "Full-stack car rental platform with real-time inventory tracking, automated pricing engine, booking validation, and payment status tracking system.",
      tech: ["Node.js", "Express", "MongoDB", "React", "Tailwind CSS"],
      link: "https://github.com/prayashjungkhadka2005/WeAreCars",
      image: "/projects/we-are-cars.png",
      type: "Personal Project",
    },
  ];

  return (
    <section id="projects" className="relative py-20 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-accent/10 rounded-full filter blur-3xl -z-10"></div>
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Featured Projects
          </h2>
          <p className="text-foreground/70 text-lg mb-6">
            Some of my recent work
          </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-full hover:shadow-xl hover:scale-105 transition-all font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                Try SQL Query Builder (NEW!)
              </Link>
        </div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 },
            },
          }}
        >
          {projects.map((project, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
              className="relative backdrop-blur-sm bg-white/40 dark:bg-warm-dark/40 border border-white/60 dark:border-secondary/30 rounded-2xl overflow-hidden hover:border-primary/40 dark:hover:border-primary/50 transition-all hover:shadow-2xl hover:scale-105 group"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/10 group-hover:to-accent/10 transition-all"></div>
              
              <div className="relative">
                {/* Project Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    quality={85}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {/* Project Type Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 backdrop-blur-md bg-white/90 dark:bg-warm-dark/90 border border-primary/20 rounded-full text-xs font-semibold text-primary">
                    {project.type}
                  </div>
                </div>

                {/* Project Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-foreground/70 mb-4 leading-relaxed text-sm">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tech.map((tech, techIndex) => {
                      const IconComponent = techIcons[tech];
                      return (
                        <span
                          key={techIndex}
                          className="px-3 py-1 backdrop-blur-sm bg-primary/10 border border-primary/20 text-primary text-xs rounded-full font-medium flex items-center gap-1.5"
                        >
                          {IconComponent && <IconComponent className="text-sm" />}
                          {tech}
                        </span>
                      );
                    })}
                  </div>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-semibold group/link"
                  >
                    {project.link.includes('github') ? 'View Code' : 'Visit Site'}
                    <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

