import { useEffect, useRef } from 'react';
import { BEATS, beatLocal } from './timeline.js';

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
  { key: 'final', label: 'Handover' },
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

export default function Hud({ registerUpdate }) {
  const chapterRef = useRef(null);
  const captionRef = useRef(null);
  const dialogueRef = useRef(null);
  const titleRef = useRef(null);
  const titleWordRefs = useRef([]);
  const codePanelRef = useRef(null);
  const codeLineRefs = useRef([]);
  const apkPanelRef = useRef(null);
  const apkLineRefs = useRef([]);
  const bugRef = useRef(null);
  const finalRef = useRef(null);

  const lastChapter = useRef(-1);
  const lastDialogue = useRef(false);
  const lastTitle = useRef(false);
  const lastTitleWords = useRef(-1);
  const lastCodeCount = useRef(-1);
  const lastApkCount = useRef(-1);
  const lastBug = useRef(false);
  const lastFinal = useRef(false);

  useEffect(() => {
    function update(progress) {
      const chapterIdx = CHAPTERS.reduce((acc, c, i) => (progress >= BEATS[c.key][0] ? i : acc), 0);
      if (chapterIdx !== lastChapter.current) {
        lastChapter.current = chapterIdx;
        if (chapterRef.current) chapterRef.current.textContent = CHAPTERS[chapterIdx].label;
      }

      if (captionRef.current) {
        const p = beatLocal('agency', progress);
        captionRef.current.classList.toggle('visible', p > 0.55 && p < 0.98);
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
      const finalOn = finalP > 0.5;
      if (finalOn !== lastFinal.current) {
        lastFinal.current = finalOn;
        if (finalRef.current) finalRef.current.classList.toggle('visible', finalOn);
      }
    }

    registerUpdate(update);
    update(0);
  }, [registerUpdate]);

  return (
    <div className="azeem-hud">
      <div className="azeem-chapter">
        <span className="azeem-chapter-index">STORY</span>
        <span ref={chapterRef}>Client Contact</span>
      </div>

      <p className="azeem-caption" ref={captionRef}>Understand the problem before building the solution.</p>

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
        <p>From a real business problem</p>
        <p>to a working digital solution.</p>
        <span>Understand. Design. Build. Test. Deliver.</span>
      </div>
    </div>
  );
}
