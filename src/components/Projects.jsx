import { useRef } from 'react';

const PROJECTS = [
  {
    title: 'Bus Tracking Application',
    sub: 'Driver & Student App',
    desc: 'Real-time bus tracking system with live location sharing (10-second updates), route management, and estimated arrival time display.',
    tags: ['Flutter', 'Firebase Realtime DB', 'OpenStreetMap API'],
  },
  {
    title: 'Cataract Detection Application',
    sub: 'AI-Powered Health Screening',
    desc: 'An AI-powered app that detects cataracts from uploaded eye images, delivering instant screening results through a clean, user-friendly interface.',
    tags: ['Flutter', 'TensorFlow Lite', 'Roboflow API'],
  },
  {
    title: 'Cyber Safe',
    sub: 'Cybersecurity Toolkit',
    desc: 'Checks data breaches, scans URLs/files for malware, reports incidents, tests password strength, and offers real-time safety guidance via chatbot.',
    tags: ['Flutter', 'Firebase', 'OpenStreetMap API'],
  },
  {
    title: 'Online Order & Consumer App',
    sub: 'Mobile Shop E-Commerce',
    desc: 'E-commerce app with separate admin and user modules for browsing, ordering, tracking deliveries, managing products, and generating sales reports.',
    tags: ['Flutter', 'Firebase', 'PDF Generation'],
  },
];

function ProjectCard({ project }) {
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

  return (
    <article
      className="neu-card project-card reveal"
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
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
    </article>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="section">
      <div className="container">
        <p className="section-tag reveal">Selected Work</p>
        <h2 className="section-title reveal">Projects</h2>

        <div className="projects-grid">
          {PROJECTS.map((project) => (
            <ProjectCard project={project} key={project.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
