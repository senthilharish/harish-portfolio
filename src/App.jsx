import { lazy, useEffect } from 'react';
import IntroLoader from './components/IntroLoader.jsx';
import SiteBackground from './components/SiteBackground.jsx';
import CursorGlow from './components/CursorGlow.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import DeferredSection from './components/DeferredSection.jsx';
import About from './components/About.jsx';
import Skills from './components/Skills.jsx';
import Lifecycle from './components/Lifecycle.jsx';
import Projects from './components/Projects.jsx';
import Experience from './components/Experience.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import BubuWidget from './components/BubuWidget.jsx';
import useReveal from './hooks/useReveal.js';

// Both pull in three.js/@react-three-fiber/drei plus several MB of GLB
// models — code-split and deferred so that weight only loads once the user
// is about to scroll into these sections, not on every initial page load.
const AzeemJourney = lazy(() => import('./components/AzeemJourney/index.jsx'));
const Achievements = lazy(() => import('./components/Achievements.jsx'));

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
      <IntroLoader />
      <SiteBackground />
      <CursorGlow />
      <ProgressBar />
      <Navbar />
      <main>
        <Hero />
        <DeferredSection minHeight="1230vh">
          <AzeemJourney />
        </DeferredSection>
        <About />
        <Skills />
        <Lifecycle />
        <Projects />
        <Experience />
        <DeferredSection minHeight="100vh">
          <Achievements />
        </DeferredSection>
        <Contact />
      </main>
      <Footer />
      <BubuWidget />
    </>
  );
}
