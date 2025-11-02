"use client";

import { motion } from "framer-motion";
import { 
  SiReact, 
  SiNextdotjs, 
  SiNodedotjs, 
  SiTypescript, 
  SiJavascript,
  SiExpress,
  SiPostgresql,
  SiMongodb,
  SiMysql,
  SiRedux,
  SiPrisma,
  SiSequelize,
  SiSocketdotio,
  SiDocker,
  SiStripe,
  SiGit,
  SiTailwindcss,
  SiPaypal,
  SiTwilio
} from "react-icons/si";
import { TbApi, TbCloud } from "react-icons/tb";
import { FaAws } from "react-icons/fa";

export default function Skills() {
  const skills = [
    { name: "React", icon: SiReact, color: "#61DAFB" },
    { name: "Next.js", icon: SiNextdotjs, color: "#000000" },
    { name: "Node.js", icon: SiNodedotjs, color: "#339933" },
    { name: "TypeScript", icon: SiTypescript, color: "#3178C6" },
    { name: "JavaScript", icon: SiJavascript, color: "#F7DF1E" },
    { name: "Express.js", icon: SiExpress, color: "#000000" },
    { name: "PostgreSQL", icon: SiPostgresql, color: "#4169E1" },
    { name: "MongoDB", icon: SiMongodb, color: "#47A248" },
    { name: "MySQL", icon: SiMysql, color: "#4479A1" },
    { name: "Redux", icon: SiRedux, color: "#764ABC" },
    { name: "Prisma", icon: SiPrisma, color: "#2D3748" },
    { name: "Sequelize", icon: SiSequelize, color: "#52B0E7" },
    { name: "WebSockets", icon: SiSocketdotio, color: "#010101" },
    { name: "REST API", icon: TbApi, color: "#FF6C37" },
    { name: "AWS", icon: FaAws, color: "#FF9900" },
    { name: "Docker", icon: SiDocker, color: "#2496ED" },
    { name: "Stripe", icon: SiStripe, color: "#008CDD" },
    { name: "PayPal", icon: SiPaypal, color: "#00457C" },
    { name: "Twilio", icon: SiTwilio, color: "#F22F46" },
    { name: "Git", icon: SiGit, color: "#F05032" },
    { name: "Tailwind CSS", icon: SiTailwindcss, color: "#06B6D4" },
  ];

  return (
    <section id="skills" className="relative py-20 px-6 bg-secondary/5 overflow-hidden">
      {/* Background Gradient Blob */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl -z-10"></div>
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Skills & Technologies
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto text-lg">
            Technologies I use to build modern, scalable web applications
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 },
            },
          }}
        >
          {skills.map((skill, index) => {
            const IconComponent = skill.icon;
            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: { opacity: 1, scale: 1 },
                }}
                className="relative backdrop-blur-sm bg-white/50 dark:bg-warm-dark/50 p-6 rounded-2xl border border-white/60 dark:border-secondary/30 hover:border-primary/40 dark:hover:border-primary/50 transition-all hover:shadow-xl hover:scale-110 hover:-rotate-2 group flex flex-col items-center justify-center gap-3"
              >
                {/* Animated gradient on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-transparent group-hover:from-primary/5 group-hover:to-accent/5 transition-all"></div>
                
                <IconComponent 
                  className="text-5xl group-hover:scale-125 transition-all duration-300 relative z-10" 
                  style={{ color: skill.color }}
                />
                <p className="text-sm font-medium text-foreground/80 text-center relative z-10">
                  {skill.name}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

