import Navbar from "@/components/Navbar";
import ThemeToggle from "@/components/ThemeToggle";
import DevToolbar from "@/components/DevToolbar";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Experience from "@/components/sections/Experience";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Navbar />
      <ThemeToggle />
      <DevToolbar />
      <main className="pb-14 sm:pb-16">
        <Hero />
        <About />
        <Experience />
        <Skills />
        <Projects />
        <Contact />
      </main>
    </>
  );
}

