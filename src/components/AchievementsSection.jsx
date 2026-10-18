import { useState } from 'react';
import DeferredSection from './DeferredSection.jsx';
import ARTrophyViewer, { AR_TIERS } from './ARTrophyViewer.jsx';

// The 3D journey pulls in three.js plus the car/building GLBs, so it's
// code-split; the heading and extra-curricular list render straight away.
const loadJourney = () => import('./Achievements.jsx');
const clearJourneyAssets = () => loadJourney().then((m) => m.clearAchievementAssets());

// A desktop QR code links here with ?ar=<tier>&t=<title> so the phone opens
// the AR trophy directly, without driving the journey to that level first.
function readArLink() {
  const params = new URLSearchParams(window.location.search);
  const tier = params.get('ar');
  if (!AR_TIERS.includes(tier)) return null;
  return { tier, title: (params.get('t') || 'Achievement').slice(0, 120) };
}

export default function AchievementsSection() {
  const [arLink, setArLink] = useState(readArLink);

  const closeArLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('ar');
    url.searchParams.delete('t');
    window.history.replaceState(null, '', url);
    setArLink(null);
  };

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

      {arLink && <ARTrophyViewer tier={arLink.tier} title={arLink.title} onClose={closeArLink} />}
    </section>
  );
}
