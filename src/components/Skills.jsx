const SKILL_GROUPS = [
  {
    icon: '</>',
    title: 'Programming Languages',
    tags: ['C', 'C++', 'Java', 'Dart'],
  },
  {
    icon: '🌐',
    title: 'Web & App Development',
    tags: ['HTML', 'CSS', 'Flutter'],
  },
  {
    icon: '🛠',
    title: 'Tools & Platforms',
    tags: ['GitHub', 'Firebase', 'GitHub Copilot'],
  },
  {
    icon: '🤝',
    title: 'Soft Skills',
    tags: ['Teamwork', 'Time Management', 'Critical Thinking', 'Communication'],
  },
];

export default function Skills() {
  return (
    <section id="skills" className="section alt-bg">
      <div className="container">
        <p className="section-tag reveal">What I Bring</p>
        <h2 className="section-title reveal">Skills</h2>

        <div className="skills-grid">
          {SKILL_GROUPS.map((group) => (
            <div className="neu-card skill-card reveal" key={group.title}>
              <div className="skill-icon">{group.icon}</div>
              <h3>{group.title}</h3>
              <div className="tag-row">
                {group.tags.map((tag) => (
                  <span className="tag" key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
