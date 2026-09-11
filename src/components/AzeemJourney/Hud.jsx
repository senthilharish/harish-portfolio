import { useEffect, useRef } from 'react';
import { BEATS, SCENE_CAPTIONS, beatLocal } from './timeline.js';

const CHAPTERS = [
  { key: 'call', label: 'Client Contact' },
  { key: 'agency', label: 'Understand The Business' },
  { key: 'requirements', label: 'Requirement Gathering' },
  { key: 'blueprint', label: 'System Blueprint' },
  { key: 'design', label: 'UI / UX Design' },
  { key: 'codeApp', label: 'Flutter Development' },
  { key: 'buildTest', label: 'Build · Test · Fix' },
  { key: 'approval', label: 'Client Approval' },
  { key: 'deploy', label: 'Deployment' },
  { key: 'final', label: 'Handover & Transformation' },
];

const CODE_LINES = [
  [{ t: 'kw', v: 'class ' }, { t: '', v: 'Product ' }, { t: 'kw', v: 'extends ' }, { t: '', v: 'Model {' }],
  [{ t: '', v: '  final String name, sku;' }],
  [{ t: '', v: '  final double price;' }],
  [{ t: '', v: '}' }],
  [{ t: 'kw', v: 'class ' }, { t: '', v: 'StockService {' }],
  [{ t: 'fn', v: '  updateStock' }, { t: '', v: '(String id, int qty) {' }],
  [{ t: '', v: '    ...' }],
  [{ t: '', v: '  }' }],
  [{ t: '', v: '}' }],
  [{ t: 'kw', v: 'class ' }, { t: '', v: 'Order {' }],
  [{ t: '', v: '  Retailer retailer;' }],
  [{ t: '', v: '  List<OrderItem> items;' }],
  [{ t: '', v: '}' }],
];

const APK_LINES = [
  '$ flutter build apk --release',
  'Running Gradle task \'assembleRelease\'...',
  '✓ Built build/app/release/azeem_erp.apk',
];

const TITLE_WORDS = [
  { text: "LET'S", at: 0.108 },
  { text: 'BEGIN', at: 0.124 },
];

const LETTER_STEP_MS = 26;
const FADE_OUT_MS = 320;

export default function Hud({ registerUpdate }) {
  const chapterRef = useRef(null);
  const sceneCaptionMainRef = useRef(null);
  const sceneCaptionSubRef = useRef(null);
  const captionSwapTimer = useRef(null);
  const dialogueRef = useRef(null);
  const callRef = useRef(null);
  const titleRef = useRef(null);
  const titleWordRefs = useRef([]);
  const codePanelRef = useRef(null);
  const codeLineRefs = useRef([]);
  const apkPanelRef = useRef(null);
  const apkLineRefs = useRef([]);
  const bugRef = useRef(null);
  const finalRef = useRef(null);

  const lastChapter = useRef(-1);
  const lastCall = useRef(false);
  const lastDialogue = useRef(false);
  const lastTitle = useRef(false);
  const lastTitleWords = useRef(-1);
  const lastCodeCount = useRef(-1);
  const lastApkCount = useRef(-1);
  const lastBug = useRef(false);
  const lastFinal = useRef(false);

  useEffect(() => {
    // Force the first update() call below to treat every "last known
    // value" ref as stale, so StrictMode's dev-only double-invoke of this
    // effect (mount -> cleanup -> mount) can't leave the caption/chapter
    // refs already at their initial value and silently skip the reveal.
    lastChapter.current = -1;
    lastCall.current = null;
    lastDialogue.current = null;
    lastTitle.current = null;
    lastTitleWords.current = -1;
    lastCodeCount.current = -1;
    lastApkCount.current = -1;
    lastBug.current = null;
    lastFinal.current = null;

    function revealScene(key) {
      const [main, sub] = SCENE_CAPTIONS[key];
      const mainEl = sceneCaptionMainRef.current;
      const subEl = sceneCaptionSubRef.current;
      if (!mainEl || !subEl) return;

      mainEl.innerHTML = '';
      [...main].forEach((ch, i) => {
        const span = document.createElement('span');
        span.textContent = ch === ' ' ? ' ' : ch;
        span.style.transitionDelay = `${i * LETTER_STEP_MS}ms`;
        mainEl.appendChild(span);
      });
      subEl.textContent = sub || '';
      subEl.style.transitionDelay = `${main.length * LETTER_STEP_MS + 120}ms`;

      // Next frame so the browser registers the reset state before we
      // re-add .visible — otherwise the fade-in transition won't replay.
      requestAnimationFrame(() => {
        mainEl.classList.add('visible');
        subEl.classList.toggle('visible', !!sub);
      });
    }

    function update(progress) {
      const chapterIdx = CHAPTERS.reduce((acc, c, i) => (progress >= BEATS[c.key][0] ? i : acc), 0);
      if (chapterIdx !== lastChapter.current) {
        lastChapter.current = chapterIdx;
        if (chapterRef.current) chapterRef.current.textContent = CHAPTERS[chapterIdx].label;

        // Old caption fades out as one clean block (no stagger), then the
        // new one reveals letter by letter.
        clearTimeout(captionSwapTimer.current);
        sceneCaptionMainRef.current?.querySelectorAll('span').forEach((s) => { s.style.transitionDelay = '0ms'; });
        if (sceneCaptionSubRef.current) sceneCaptionSubRef.current.style.transitionDelay = '0ms';
        sceneCaptionMainRef.current?.classList.remove('visible');
        sceneCaptionSubRef.current?.classList.remove('visible');
        captionSwapTimer.current = setTimeout(() => revealScene(CHAPTERS[chapterIdx].key), FADE_OUT_MS);
      }

      // Phone lights up on the desk — it's lying face-down, so the cue is
      // an on-screen tag rather than text baked into a hidden screen.
      const callOn = progress > 0.036 && progress < 0.078;
      if (callOn !== lastCall.current) {
        lastCall.current = callOn;
        if (callRef.current) callRef.current.classList.toggle('visible', callOn);
      }

      // "Sure. I can take a look at it." — right after the developer answers.
      const dialogueOn = progress > 0.081 && progress < 0.098;
      if (dialogueOn !== lastDialogue.current) {
        lastDialogue.current = dialogueOn;
        if (dialogueRef.current) dialogueRef.current.classList.toggle('visible', dialogueOn);
      }

      // "LET'S / BEGIN / THE PROCESS" — staggered title card over the push
      // into the laptop screen, gone once the agency travel begins.
      const titleOn = progress > 0.105 && progress < 0.158;
      if (titleOn !== lastTitle.current) {
        lastTitle.current = titleOn;
        if (titleRef.current) titleRef.current.classList.toggle('visible', titleOn);
      }
      const titleWordCount = TITLE_WORDS.reduce((acc, w, i) => (progress >= w.at ? i + 1 : acc), 0);
      if (titleWordCount !== lastTitleWords.current) {
        lastTitleWords.current = titleWordCount;
        titleWordRefs.current.forEach((el, i) => el && el.classList.toggle('visible', i < titleWordCount));
      }

      // Code panel appears through the codeApp beat.
      const codeP = beatLocal('codeApp', progress);
      if (codePanelRef.current) codePanelRef.current.classList.toggle('visible', codeP > 0 && codeP < 1);
      const codeCount = Math.floor(codeP * CODE_LINES.length);
      if (codeCount !== lastCodeCount.current) {
        lastCodeCount.current = codeCount;
        codeLineRefs.current.forEach((el, i) => el && el.classList.toggle('visible', i < codeCount));
      }

      // APK terminal appears at the very start of buildTest.
      const btP = beatLocal('buildTest', progress);
      const apkP = Math.min(1, btP / 0.18);
      if (apkPanelRef.current) apkPanelRef.current.classList.toggle('visible', btP > 0 && btP < 0.22);
      const apkCount = Math.floor(apkP * APK_LINES.length);
      if (apkCount !== lastApkCount.current) {
        lastApkCount.current = apkCount;
        apkLineRefs.current.forEach((el, i) => el && el.classList.toggle('visible', i < apkCount));
      }

      // Bug caption flashes on once the monitor reveals the failing test.
      const bugOn = btP > 0.35 && btP < 0.5;
      if (bugOn !== lastBug.current) {
        lastBug.current = bugOn;
        if (bugRef.current) bugRef.current.classList.toggle('visible', bugOn);
      }

      const finalP = beatLocal('final', progress);
      const finalOn = finalP > 0.55;
      if (finalOn !== lastFinal.current) {
        lastFinal.current = finalOn;
        if (finalRef.current) finalRef.current.classList.toggle('visible', finalOn);
      }
    }

    registerUpdate(update);
    update(0);

    return () => clearTimeout(captionSwapTimer.current);
  }, [registerUpdate]);

  return (
    <div className="azeem-hud">
      <div className="azeem-chapter">
        <span className="azeem-chapter-index">STORY</span>
        <span ref={chapterRef}>Client Contact</span>
      </div>

      <div className="azeem-scene-caption">
        <p className="azeem-scene-caption-main" ref={sceneCaptionMainRef}></p>
        <p className="azeem-scene-caption-sub" ref={sceneCaptionSubRef}></p>
      </div>

      <div className="azeem-incoming-call" ref={callRef}>
        <span className="azeem-call-label">INCOMING CALL</span>
        <span className="azeem-call-name">Azeem Agency</span>
      </div>

      <p className="azeem-dialogue" ref={dialogueRef}>&ldquo;Sure. I can take a look at it.&rdquo;</p>

      <div className="azeem-title-sequence" ref={titleRef}>
        {TITLE_WORDS.map((w, i) => (
          <span key={w.text} ref={(el) => (titleWordRefs.current[i] = el)}>{w.text}</span>
        ))}
      </div>

      <div className="azeem-code-panel" ref={codePanelRef}>
        <div className="build-terminal-bar"><span></span><span></span><span></span></div>
        <div className="azeem-code-body">
          {CODE_LINES.map((line, i) => (
            <div className="build-terminal-line" key={i} ref={(el) => (codeLineRefs.current[i] = el)}>
              {line.map((p, j) => (
                <span className={p.t ? `tok-${p.t}` : undefined} key={j}>{p.v}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="azeem-apk-panel" ref={apkPanelRef}>
        <div className="build-terminal-bar"><span></span><span></span><span></span></div>
        <div className="azeem-code-body">
          {APK_LINES.map((line, i) => (
            <div className="build-terminal-line" key={i} ref={(el) => (apkLineRefs.current[i] = el)}>
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="azeem-bug" ref={bugRef}>
        <span className="azeem-bug-tag">BUG DETECTED</span>
        <span>Stock update fails to persist quantity — returning to code.</span>
      </div>

      <div className="azeem-final" ref={finalRef}>
        <p>Same shop. Same desk.</p>
        <p>Now running on Azeem ERP.</p>
        <span>Understand. Design. Build. Test. Deliver.</span>
      </div>
    </div>
  );
}
