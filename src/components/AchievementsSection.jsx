import DeferredSection from './DeferredSection.jsx';

// The 3D journey pulls in three.js plus the car/building GLBs, so it's
// code-split; the heading and extra-curricular list render straight away.
const loadJourney = () => import('./Achievements.jsx');
const clearJourneyAssets = () => loadJourney().then((m) => m.clearAchievementAssets());

export default function AchievementsSection() {
  return (
    <section id="achievements" className="section">
      <div className="container">
        <p className="section-tag reveal">Recognition</p>
        <h2 className="section-title reveal">Achievements &amp; Participation</h2>

        <DeferredSection
          load={loadJourney}
          onRetry={clearJourneyAssets}
          minHeight="560px"
          rootMargin="2500px"
          loadingLabel="Loading the achievements journey…"
        />

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
