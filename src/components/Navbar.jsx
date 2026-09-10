import { useEffect, useRef, useState } from 'react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'build', label: 'Build' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'lifecycle', label: 'Process' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'contact', label: 'Contact' },
];

export default function Navbar() {
  const [active, setActive] = useState('home');
  const [open, setOpen] = useState(false);
  const [shrink, setShrink] = useState(false);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('.section[id]'));

    const onScroll = () => {
      setShrink(window.scrollY > 40);
      const scrollPos = window.scrollY + 160;
      let current = sections[0]?.id;
      sections.forEach((sec) => {
        if (scrollPos >= sec.offsetTop) current = sec.id;
      });
      setActive(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="navbar" id="navbar" style={{ top: shrink ? '8px' : '16px' }}>
      <div className="nav-inner">
        <a href="#home" className="logo">H<span>S</span></a>
        <nav className={`nav-links${open ? ' open' : ''}`} id="navLinks">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`nav-link${active === item.id ? ' active' : ''}`}
              data-section={item.id}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <button
          className="nav-toggle"
          id="navToggle"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  );
}
