export default function Experience() {
  return (
    <section id="experience" className="section alt-bg">
      <div className="container">
        <p className="section-tag reveal">Where I've Worked</p>
        <h2 className="section-title reveal">Internship Experience</h2>

        <div className="timeline">
          <div className="timeline-line"></div>
          <div className="timeline-item reveal">
            <div className="timeline-dot"></div>
            <div className="neu-card timeline-card">
              <div className="timeline-head">
                <div>
                  <h3>Software Developer</h3>
                  <p className="timeline-company">FlutterFrog Software Solutions LLP</p>
                </div>
                <span className="timeline-date">Nov 2024 – Jan 2026</span>
              </div>
              <p className="timeline-role-type">Part-time · Former Intern</p>
              <ul className="timeline-list">
                <li>Developed cross-platform mobile apps using Flutter with responsive UI.</li>
                <li>Integrated Firebase (Auth, Firestore, Storage) for backend services.</li>
                <li>Built distributor/admin apps (Stockflow, Feelflow) with dashboards, order and sales management.</li>
                <li>Took ownership of developing Quika, an eCommerce app for purchasing products from distributors.</li>
                <li>Contributed to multiple projects: Finance App, Ricemill Application, Veby, and TN Chambers.</li>
                <li>Implemented MVC architecture and integrated APIs for efficient data handling.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
