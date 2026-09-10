import { useEffect } from 'react';
import SiteBackground from './components/SiteBackground.jsx';
import CursorGlow from './components/CursorGlow.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import AzeemJourney from './components/AzeemJourney/index.jsx';
import About from './components/About.jsx';
import Skills from './components/Skills.jsx';
import Lifecycle from './components/Lifecycle.jsx';
import Projects from './components/Projects.jsx';
import Experience from './components/Experience.jsx';
import Achievements from './components/Achievements.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import BubuWidget from './components/BubuWidget.jsx';
import useReveal from './hooks/useReveal.js';

export default function App() {
  useReveal();

  // Some browsers silently ignore attribute-based video autoplay.
  useEffect(() => {
    const videos = document.querySelectorAll('video[autoplay]');
    videos.forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      const tryPlay = () => video.play().catch(() => {});
      tryPlay();
      video.addEventListener('loadeddata', tryPlay, { once: true });
    });
    const tryPlayAll = () => videos.forEach((v) => v.play().catch(() => {}));
    const events = ['click', 'touchstart', 'scroll'];
    events.forEach((evt) => document.addEventListener(evt, tryPlayAll, { once: true, passive: true }));
    return () => events.forEach((evt) => document.removeEventListener(evt, tryPlayAll));
  }, []);

  return (
    <>
      <SiteBackground />
      <CursorGlow />
      <ProgressBar />
      <Navbar />
      <main>
        <Hero />
        <AzeemJourney />
        <About />
        <Skills />
        <Lifecycle />
        <Projects />
        <Experience />
        <Achievements />
        <Contact />
      </main>
      <Footer />
      <BubuWidget />
    </>
  );
}
