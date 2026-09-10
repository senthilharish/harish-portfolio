const ACHIEVEMENTS = [
  { badge: '🥇', tier: 'gold', text: 'College Hackathon 2025 — Biodegradable Film Risk Monitoring System' },
  { badge: '🥇', tier: 'gold', text: 'SDG 12 Hackathon, Techfest 2025' },
  { badge: '🥇', tier: 'gold', text: 'Coding for Sustainability, Techfest 2025' },
  { badge: '🥈', tier: 'silver', text: 'College Hackathon 2024 — Litter Detection Project' },
  { badge: '🥉', tier: 'bronze', text: '18-Hour Hackathon, Govt. College of Engineering, Thrissur' },
  { badge: '📄', tier: '', text: 'Presented a paper on Agri Bio Trace at an IEEE Conference, NIT Delhi' },
  { badge: '🎤', tier: '', text: "Participant — IEEE Reliability Summit, Madras Section" },
  { badge: '🎓', tier: '', text: "Attendee — Int'l Conference on Computational Intelligence & Data Analytics 2024" },
  { badge: '💡', tier: '', text: "Participant — Withon's25, Anna University Guindy" },
  { badge: '🌍', tier: '', text: 'Participant — U.S.T Global Final Hackathon' },
];

export default function Achievements() {
  return (
    <section id="achievements" className="section">
      <div className="container">
        <p className="section-tag reveal">Recognition</p>
        <h2 className="section-title reveal">Achievements &amp; Participation</h2>

        <div className="achieve-grid">
          {ACHIEVEMENTS.map((item, i) => (
            <div className={`neu-card achieve-card${item.tier ? ' ' + item.tier : ''} reveal`} key={i}>
              <span className="achieve-badge">{item.badge}</span>
              <p>{item.text}</p>
            </div>
          ))}
        </div>

        <div className="extra-curricular reveal">
          <h3>Extra-Curricular Activities</h3>
          <div className="tag-row">
            <span className="tag outline">🚩 Treasurer — Youth Red Cross</span>
            <span className="tag outline">⚡ Member — IEEE Student Branch</span>
          </div>
        </div>
      </div>
    </section>
  );
}
