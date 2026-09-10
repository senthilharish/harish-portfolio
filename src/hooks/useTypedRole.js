import { useEffect, useState } from 'react';

const ROLES = ['Flutter Developer', 'Vibe Coading', 'Software Engineer'];

export default function useTypedRole() {
  const [text, setText] = useState('');

  useEffect(() => {
    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timer;

    const tick = () => {
      const current = ROLES[roleIndex];
      if (!deleting) {
        charIndex++;
        setText(current.slice(0, charIndex));
        if (charIndex === current.length) {
          deleting = true;
          timer = setTimeout(tick, 1500);
          return;
        }
      } else {
        charIndex--;
        setText(current.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % ROLES.length;
        }
      }
      timer = setTimeout(tick, deleting ? 40 : 80);
    };

    tick();
    return () => clearTimeout(timer);
  }, []);

  return text;
}
