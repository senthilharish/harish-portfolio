import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Each project lists its apps. An app is one of:
//   { role, url }            -> live web app, opens in a new tab
//   { role, apk, fileName }  -> Android build, downloaded after confirmation
//   { role }                 -> no link yet, shown as "Coming soon"
const PROJECTS = [
  {
    title: 'Azeem Agency',
    sub: 'Admin & Field Operations',
    desc: 'Agency management platform with a central admin console and a dedicated field app for on-ground staff to log and sync their work.',
    tags: ['Flutter', 'Firebase'],
    apps: [
      { role: 'Admin', url: 'https://azeemagency-admin.web.app' },
      { role: 'Field', url: 'https://azeemagency-field.web.app' },
    ],
  },
  {
    title: 'KIDSS Application',
    sub: 'Multi-Role School Management',
    desc: 'Role-based management system with separate portals for the Executive Director, Assistant Staff and Staff, each scoped to its own responsibilities.',
    tags: ['Flutter', 'Firebase'],
    apps: [
      { role: 'Executive Director', url: 'https://ed-kidss.web.app' },
      { role: 'Assistant Staff', url: 'https://as-kidss.web.app' },
      { role: 'Staff', url: 'https://staff-kidss.web.app' },
    ],
  },
  {
    title: 'Bus Tracking Application',
    sub: 'Admin & Student App',
    desc: 'Real-time bus tracking system with live location sharing (10-second updates), route management, and estimated arrival time display.',
    tags: ['Flutter', 'Firebase Realtime DB', 'OpenStreetMap API'],
    apps: [
      { role: 'Admin', url: 'https://tracker-driver.web.app' },
      { role: 'Student', url: 'https://tracker-user.web.app' },
    ],
  },
  {
    title: 'Cyber Safe',
    sub: 'Cybersecurity Toolkit',
    desc: 'Checks data breaches, scans URLs/files for malware, reports incidents, tests password strength, and offers real-time safety guidance via chatbot.',
    tags: ['Flutter', 'Firebase', 'OpenStreetMap API'],
    apps: [
      { role: 'Android App', apk: '/assets/apps/cybersafe.apk', fileName: 'CyberSafe.apk' },
    ],
  },
  {
    title: 'Cataract Detection Application',
    sub: 'AI-Powered Health Screening',
    desc: 'An AI-powered app that detects cataracts from uploaded eye images, delivering instant screening results through a clean, user-friendly interface.',
    tags: ['Flutter', 'TensorFlow Lite', 'Roboflow API'],
    apps: [
      { role: 'Android App', apk: '/assets/apps/cataract-detection.apk', fileName: 'CataractDetection.apk' },
    ],
  },
  {
    title: 'CapeStart',
    sub: 'User & Driver App',
    desc: 'Ride platform with separate apps for users booking trips and drivers managing them.',
    tags: ['Flutter', 'Firebase'],
    apps: [
      { role: 'User', url: 'https://capestart-user.web.app/' },
      { role: 'Driver', url: 'https://capestart-driver.web.app/#/home' },
    ],
  },
  {
    title: 'Online Order & Consumer App',
    sub: 'Mobile Shop E-Commerce',
    desc: 'E-commerce app with separate admin and user modules for browsing, ordering, tracking deliveries, managing products, and generating sales reports.',
    tags: ['Flutter', 'Firebase', 'PDF Generation'],
    apps: [
      { role: 'Admin', url: 'https://mobileshop-admin.web.app/' },
      { role: 'User', url: 'https://mobileshop-user.web.app/' },
    ],
  },
];

function ProjectCard({ project, onOpen }) {
  const cardRef = useRef(null);
  const glowRef = useRef(null);

  const onMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -8;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    if (glowRef.current) {
      glowRef.current.style.left = x - rect.width * 0.3 + 'px';
      glowRef.current.style.top = y - rect.height * 0.3 + 'px';
    }
  };

  const onMouseLeave = () => {
    cardRef.current.style.transform = '';
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      className="neu-card project-card reveal"
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
    >
      <div className="project-glow" ref={glowRef}></div>
      <h3>{project.title}</h3>
      <p className="project-sub">{project.sub}</p>
      <p className="project-desc">{project.desc}</p>
      <div className="tag-row small">
        {project.tags.map((tag) => (
          <span className="tag" key={tag}>{tag}</span>
        ))}
      </div>
      <div className="project-foot">
        <span className="project-roles">
          {project.apps.map((app) => (app.apk ? 'APK' : app.role)).join(' · ')}
        </span>
        <span className="project-open">View apps →</span>
      </div>
    </article>
  );
}

function AppButton({ app, onDownload }) {
  if (app.url) {
    return (
      <a className="project-app" href={app.url} target="_blank" rel="noopener noreferrer">
        <span className="project-app-role">{app.role}</span>
        <span className="project-app-action">Open ↗</span>
      </a>
    );
  }
  if (app.apk) {
    return (
      <button type="button" className="project-app is-apk" onClick={() => onDownload(app)}>
        <span className="project-app-role">{app.role}</span>
        <span className="project-app-action">⬇ Download APK</span>
      </button>
    );
  }
  return (
    <div className="project-app is-soon" aria-disabled="true">
      <span className="project-app-role">{app.role}</span>
      <span className="project-app-action">Coming soon</span>
    </div>
  );
}

function ProjectModal({ project, onClose }) {
  const closeRef = useRef(null);
  const [pendingApk, setPendingApk] = useState(null);
  const [apkError, setApkError] = useState('');

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (pendingApk) setPendingApk(null);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pendingApk, onClose]);

  const askDownload = (app) => {
    setApkError('');
    setPendingApk(app);
  };

  const confirmDownload = async () => {
    const app = pendingApk;
    // The dev server / SPA hosts answer missing files with index.html, which
    // would otherwise download as a broken ".apk" — check before triggering.
    try {
      const res = await fetch(app.apk, { method: 'HEAD' });
      const type = res.headers.get('content-type') || '';
      if (!res.ok || type.includes('text/html')) {
        setApkError('The APK is not available right now. Please try again later.');
        return;
      }
    } catch {
      // Network hiccup on the HEAD probe — fall through and let the browser try.
    }
    const link = document.createElement('a');
    link.href = app.apk;
    link.download = app.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setPendingApk(null);
  };

  return createPortal(
    <div className="project-modal-backdrop" onClick={onClose}>
      <div
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="project-modal-close" ref={closeRef} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <p className="project-sub">{project.sub}</p>
        <h3 id="project-modal-title">{project.title}</h3>
        <p className="project-desc">{project.desc}</p>
        <div className="tag-row small">
          {project.tags.map((tag) => (
            <span className="tag" key={tag}>{tag}</span>
          ))}
        </div>

        <p className="project-apps-label">
          {project.apps.some((a) => a.apk) ? 'Get the app' : 'Open the apps'}
        </p>
        <div className="project-apps">
          {project.apps.map((app) => (
            <AppButton app={app} key={app.role} onDownload={askDownload} />
          ))}
        </div>

        {pendingApk && (
          <div className="apk-confirm" role="alertdialog" aria-labelledby="apk-confirm-title">
            <p id="apk-confirm-title" className="apk-confirm-title">Download {pendingApk.fileName}?</p>
            <p className="apk-confirm-text">
              This is an Android installer. After downloading, you may need to allow
              “Install from unknown sources” on your device to install it.
            </p>
            {apkError && <p className="apk-confirm-error">{apkError}</p>}
            <div className="apk-confirm-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setPendingApk(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmDownload}>
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default function Projects() {
  const [active, setActive] = useState(null);

  return (
    <section id="projects" className="section">
      <div className="container">
        <p className="section-tag reveal">Selected Work</p>
        <h2 className="section-title reveal">Projects</h2>

        <div className="projects-grid">
          {PROJECTS.map((project) => (
            <ProjectCard project={project} key={project.title} onOpen={() => setActive(project)} />
          ))}
        </div>
      </div>

      {active && <ProjectModal project={active} onClose={() => setActive(null)} />}
    </section>
  );
}
