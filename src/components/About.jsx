export default function About() {
  return (
    <section id="about" className="section">
      <div className="container">
        <p className="section-tag reveal">Get To Know Me</p>
        <h2 className="section-title reveal">About Me</h2>

        <div className="about-grid">
          <div className="about-card neu-card reveal">
            <h3>Objective</h3>
            <p>
              To leverage my computer science knowledge and programming skills to
              develop efficient, user-focused solutions while continuously enhancing
              my technical expertise and contributing to innovative projects.
            </p>
            <div className="languages-row">
              <span className="lang-pill">Tamil <em>· Fluent</em></span>
              <span className="lang-pill">English <em>· Fluent</em></span>
            </div>
          </div>

          <div className="about-card neu-card reveal">
            <h3>Education</h3>
            <div className="edu-item">
              <div className="edu-dot"></div>
              <div>
                <h4>BE Computer Science &amp; Engineering</h4>
                <p className="edu-sub">St Xavier's Catholic College of Engineering, Nagercoil — Anna University</p>
                <p className="edu-meta">2023 – 2027 &nbsp;•&nbsp; CGPA: <strong>8.89</strong></p>
              </div>
            </div>
            <div className="edu-item">
              <div className="edu-dot"></div>
              <div>
                <h4>Higher Secondary Education</h4>
                <p className="edu-sub">SLB Government Higher Secondary School, Nagercoil</p>
              </div>
            </div>
          </div>

          <div className="about-card neu-card reveal">
            <h3>Certifications</h3>
            <ul className="cert-list">
              <li>Internet of Things (IoT) — NPTEL</li>
              <li>Database Programming with PL/SQL — Oracle</li>
              <li>Certification in C &amp; C++ — PathavenTech</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
