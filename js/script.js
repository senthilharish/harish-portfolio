// ============ Force-start autoplay videos ============
// Some browsers silently ignore attribute-based autoplay (e.g. Safari,
// low-power mode). Explicitly mute + play, and retry on first interaction.
document.querySelectorAll('video[autoplay]').forEach((video) => {
  video.muted = true;
  video.playsInline = true;
  const tryPlay = () => video.play().catch(() => {});
  tryPlay();
  video.addEventListener('loadeddata', tryPlay, { once: true });
  ['click', 'touchstart', 'scroll'].forEach((evt) => {
    document.addEventListener(evt, tryPlay, { once: true, passive: true });
  });
});

// ============ Software Development Lifecycle (exploded view) ============
(() => {
  const scrollWrap = document.getElementById('lifecycleScroll');
  const stage = document.getElementById('lifecycleStage');
  const linesSvg = document.getElementById('lifecycleLines');
  const particlesEl = document.getElementById('lifecycleParticles');
  const stageLabel = document.getElementById('lifecycleStageLabel');
  const phone = document.getElementById('lifecyclePhone');
  const cards = Array.from(document.querySelectorAll('.lifecycle-card'));
  if (!scrollWrap || !stage || !cards.length) return;

  const STAGE_NAMES = [
    'Requirement Analysis', 'UI/UX Design', 'System Architecture', 'Development',
    'Database & Backend', 'Testing', 'Deployment', 'Maintenance',
  ];

  const mq = window.matchMedia('(max-width: 860px)');

  if (mq.matches) {
    // Mobile: simple stacked reveal, no scroll-scrubbed 3D stage.
    const mobileObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          mobileObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    cards.forEach((card) => mobileObserver.observe(card));
    return;
  }

  // --- Particles ---
  const PARTICLE_COUNT = 26;
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('span');
    p.className = 'lc-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDelay = (Math.random() * 6).toFixed(2) + 's';
    p.style.animationDuration = (5 + Math.random() * 5).toFixed(2) + 's';
    particlesEl.appendChild(p);
  }

  // --- Circular exploded layout, one entry per card ---
  const RADIUS_X_PCT = 34;
  const RADIUS_Y_PCT = 28;
  const N = cards.length;
  const layout = cards.map((card, i) => {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    const ox = Math.cos(angle) * RADIUS_X_PCT;
    const oy = Math.sin(angle) * RADIUS_Y_PCT;
    const z = (i % 2 === 0 ? 1 : -1) * (60 + ((i * 8) % 40));
    const rotY = Math.cos(angle) * 18;
    const rotX = Math.sin(angle) * -12;
    const rotZ = (i % 2 === 0 ? 1 : -1) * 4;
    return { ox, oy, z, rotX, rotY, rotZ };
  });

  // --- Connecting lines (one path per card) ---
  const svgNS = 'http://www.w3.org/2000/svg';
  const linePaths = layout.map(() => {
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('stroke', 'url(#lcGradPrimary)');
    path.setAttribute('stroke-width', '0.3');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('pathLength', '1');
    path.style.filter = 'drop-shadow(0 0 2px rgba(139,92,246,0.8))';
    linesSvg.appendChild(path);
    return path;
  });

  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  let lastStageIdx = -1;

  function render(progress) {
    let explode;
    if (progress < 0.3) {
      explode = smoothstep(progress / 0.3);
    } else if (progress < 0.72) {
      explode = 1;
    } else {
      explode = 1 - smoothstep((progress - 0.72) / 0.28);
    }

    const stageRect = stage.getBoundingClientRect();

    layout.forEach((l, i) => {
      const card = cards[i];
      const px = (l.ox / 100) * stageRect.width * explode;
      const py = (l.oy / 100) * stageRect.height * explode;
      const pz = l.z * explode;
      const rx = l.rotX * explode;
      const ry = l.rotY * explode;
      const rz = l.rotZ * explode;
      const scale = 0.55 + 0.45 * explode;

      card.style.transform =
        `translate3d(-50%, -50%, 0) translate3d(${px}px, ${py}px, ${pz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;
      card.style.opacity = String(Math.max(0, Math.min(1, explode * 1.3 - 0.15)));
      card.style.pointerEvents = explode > 0.15 ? 'auto' : 'none';
      card.style.zIndex = String(10 + Math.round(pz));

      const path = linePaths[i];
      const ex = 50 + l.ox * explode;
      const ey = 50 + l.oy * explode;
      path.setAttribute('d', `M50,50 L${ex},${ey}`);
      path.setAttribute('stroke-dashoffset', String(1 - explode));
      path.style.opacity = String(explode);
    });

    const phoneScale = 1 - 0.08 * explode;
    phone.style.transform = `translate3d(-50%, -50%, 0) scale(${phoneScale})`;
    phone.style.opacity = String(1 - 0.25 * explode);

    let idx = 0;
    if (progress < 0.3) {
      idx = 0;
    } else if (progress >= 0.72) {
      idx = N - 1;
    } else {
      const holdT = (progress - 0.3) / (0.72 - 0.3);
      idx = Math.min(N - 1, Math.floor(holdT * N));
    }
    if (idx !== lastStageIdx) {
      lastStageIdx = idx;
      stageLabel.textContent = STAGE_NAMES[idx];
      stageLabel.classList.remove('pulse');
      void stageLabel.offsetWidth;
      stageLabel.classList.add('pulse');
    }
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const rect = scrollWrap.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      render(progress);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();

// ============ Cursor Glow ============
const cursorGlow = document.getElementById('cursorGlow');
window.addEventListener('mousemove', (e) => {
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top = e.clientY + 'px';
});

// ============ Scroll Progress Bar ============
const progressBar = document.getElementById('progressBar');
function updateProgressBar() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}

// ============ Navbar shrink + active link ============
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section[id]');

function setActiveLink() {
  let current = sections[0]?.id;
  const scrollPos = window.scrollY + 160;
  sections.forEach((sec) => {
    if (scrollPos >= sec.offsetTop) current = sec.id;
  });
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.section === current);
  });
}

window.addEventListener('scroll', () => {
  updateProgressBar();
  setActiveLink();
  navbar.style.top = window.scrollY > 40 ? '8px' : '16px';
}, { passive: true });

// ============ Mobile nav toggle ============
const navToggle = document.getElementById('navToggle');
const navLinksEl = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinksEl.classList.toggle('open');
});
navLinksEl.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => navLinksEl.classList.remove('open'));
});

// ============ Scroll Reveal ============
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach((el) => revealObserver.observe(el));

// ============ Typing Effect ============
const roles = ['Flutter Developer', 'Vibe Coading', 'Software Engineer'];
const typedRoleEl = document.getElementById('typedRole');
let roleIndex = 0, charIndex = 0, deleting = false;

function typeLoop() {
  const current = roles[roleIndex];
  if (!deleting) {
    charIndex++;
    typedRoleEl.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) {
      deleting = true;
      setTimeout(typeLoop, 1500);
      return;
    }
  } else {
    charIndex--;
    typedRoleEl.textContent = current.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
    }
  }
  setTimeout(typeLoop, deleting ? 40 : 80);
}
typeLoop();

// ============ 3D Avatar Tilt ============
const heroAvatar = document.getElementById('heroAvatar');
const avatarTilt = document.getElementById('avatarTilt');
if (heroAvatar && avatarTilt) {
  heroAvatar.addEventListener('mousemove', (e) => {
    const rect = heroAvatar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -24;
    const rotateY = ((x / rect.width) - 0.5) * 24;
    avatarTilt.style.transition = 'transform 0.1s linear';
    avatarTilt.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  heroAvatar.addEventListener('mouseleave', () => {
    avatarTilt.style.transition = 'transform 0.6s cubic-bezier(.4,0,.2,1)';
    avatarTilt.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });
}

// ============ Project card tilt ============
document.querySelectorAll('.project-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -8;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    const glow = card.querySelector('.project-glow');
    if (glow) {
      glow.style.left = x - rect.width * 0.3 + 'px';
      glow.style.top = y - rect.height * 0.3 + 'px';
    }
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ============ Contact form (static demo) ============
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  formNote.textContent = `Thanks${name ? ', ' + name : ''}! This form is a static demo — please reach me directly via email or phone above.`;
  contactForm.reset();
});

// ============ Footer year ============
document.getElementById('year').textContent = new Date().getFullYear();

// ============ Back to top ============
document.getElementById('backToTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============ Bubu Freelance Assistant ============
(() => {
  const widget = document.getElementById('bubuWidget');
  if (!widget) return;

  const fab = document.getElementById('bubuFab');
  const panel = document.getElementById('bubuPanel');
  const body = document.getElementById('bubuBody');
  const closeBtn = document.getElementById('bubuClose');
  const badge = document.getElementById('bubuBadge');
  const teaser = document.getElementById('bubuTeaser');

  const state = { type: '', details: '', email: '' };
  let started = false;

  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function addBotMessage(text, delay = 550) {
    return new Promise((resolve) => {
      const typing = document.createElement('div');
      typing.className = 'bubu-typing';
      typing.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(typing);
      scrollToBottom();
      setTimeout(() => {
        typing.remove();
        const msg = document.createElement('div');
        msg.className = 'bubu-msg bot';
        msg.textContent = text;
        body.appendChild(msg);
        scrollToBottom();
        resolve();
      }, delay);
    });
  }

  function addUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'bubu-msg user';
    msg.textContent = text;
    body.appendChild(msg);
    scrollToBottom();
  }

  function addChoices(options, onPick) {
    const row = document.createElement('div');
    row.className = 'bubu-choices';
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bubu-choice-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        row.remove();
        addUserMessage(opt);
        onPick(opt);
      });
      row.appendChild(btn);
    });
    body.appendChild(row);
    scrollToBottom();
  }

  function addTextInput({ multiline, placeholder, buttonLabel, type = 'text' }, onSubmit) {
    const row = document.createElement('div');
    row.className = 'bubu-input-row';
    const field = document.createElement(multiline ? 'textarea' : 'input');
    if (!multiline) field.type = type;
    if (multiline) field.rows = 2;
    field.placeholder = placeholder;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bubu-send-btn';
    btn.textContent = buttonLabel;
    btn.disabled = true;

    field.addEventListener('input', () => {
      btn.disabled = field.value.trim().length === 0;
    });
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !multiline && !btn.disabled) {
        e.preventDefault();
        btn.click();
      }
    });
    btn.addEventListener('click', () => {
      const value = field.value.trim();
      if (!value) return;
      row.remove();
      addUserMessage(value);
      onSubmit(value);
    });

    row.appendChild(field);
    row.appendChild(btn);
    body.appendChild(row);
    scrollToBottom();
    field.focus();
  }

  async function startConversation() {
    if (started) return;
    started = true;
    body.innerHTML = '';
    await addBotMessage("Hi there! I'm Bubu 🐻 Are you looking to get a freelance project built?", 400);
    addChoices(["Yes, let's talk", 'Not right now'], (choice) => {
      if (choice === 'Not right now') {
        addBotMessage("No worries — I'll be right here if you change your mind! 🐾");
        return;
      }
      askProjectType();
    });
  }

  async function askProjectType() {
    await addBotMessage('Awesome! What kind of project are you thinking of?');
    addChoices(['📱 Mobile App', '🌐 Web App', '🤖 AI / ML', '💡 Something else'], (choice) => {
      state.type = choice.replace(/^\S+\s/, '');
      askDetails();
    });
  }

  async function askDetails() {
    await addBotMessage('Nice choice! Tell me a bit about what you need — features, timeline, anything helpful.');
    addTextInput({ multiline: true, placeholder: 'Describe your project…', buttonLabel: 'Next' }, (value) => {
      state.details = value;
      askEmail();
    });
  }

  async function askEmail() {
    await addBotMessage("Last thing — what's the best email to reach you at?");
    addTextInput({ placeholder: 'you@example.com', buttonLabel: 'Send', type: 'email' }, (value) => {
      state.email = value;
      sendInquiry();
    });
  }

  async function sendInquiry() {
    const subject = encodeURIComponent(`Freelance Project Inquiry — ${state.type}`);
    const bodyText = encodeURIComponent(
      `Project type: ${state.type}\n\nDetails:\n${state.details}\n\nReply-to email: ${state.email}`
    );
    window.location.href = `mailto:sindhuharish2802@gmail.com?subject=${subject}&body=${bodyText}`;
    await addBotMessage('🎉 Your email app should be opening now with everything filled in. Talk soon!');
    addChoices(['Start over'], () => {
      started = false;
      startConversation();
    });
  }

  const pandaVideo = document.getElementById('bubuPandaVideo');
  const pandaWrap = pandaVideo ? pandaVideo.closest('.bubu-panda-wrap') : null;

  function replayPanda() {
    if (!pandaVideo) return;
    pandaVideo.currentTime = 0;
    pandaVideo.play();
    if (pandaWrap) {
      pandaWrap.classList.remove('replay');
      void pandaWrap.offsetWidth;
      pandaWrap.classList.add('replay');
    }
  }

  function openPanel() {
    replayPanda();
    teaser.classList.remove('visible');
    setTimeout(() => {
      panel.classList.add('open');
      badge.classList.add('hidden');
      startConversation();
    }, 350);
  }

  function closePanel() {
    panel.classList.remove('open');
  }

  let teaserTimer, autoOpenTimer;
  if (!sessionStorage.getItem('bubuGreeted')) {
    teaserTimer = setTimeout(() => teaser.classList.add('visible'), 3000);
    autoOpenTimer = setTimeout(() => {
      openPanel();
      sessionStorage.setItem('bubuGreeted', '1');
    }, 5000);
  }

  fab.addEventListener('click', () => {
    clearTimeout(teaserTimer);
    clearTimeout(autoOpenTimer);
    teaser.classList.remove('visible');
    sessionStorage.setItem('bubuGreeted', '1');
    if (panel.classList.contains('open')) {
      closePanel();
    } else {
      openPanel();
    }
  });
  closeBtn.addEventListener('click', closePanel);
})();

// init
updateProgressBar();
setActiveLink();
