import { useEffect, useState, type CSSProperties } from "react";
import { GlassSelect, type SelectOption } from "./components/GlassSelect";
import { DayCount } from "./components/DayCount";
import { TreePicker } from "./components/TreePicker";
import { TreeScene } from "./components/TreeScene";
import { useReducedMotionPreference } from "./useReducedMotionPreference";
import { useSky, type SkyChoice } from "./useSky";

const SKY_OPTIONS: SelectOption<SkyChoice>[] = [
  { value: "auto", label: "Auto", hint: "Local time" },
  { value: "dawn", label: "Dawn" },
  { value: "day", label: "Day" },
  { value: "dusk", label: "Dusk" },
  { value: "night", label: "Night" },
];

function BrandMark() {
  return <a className="brand" href="#home" aria-label="Thrivling home">
    <img src={`${import.meta.env.BASE_URL}assets/brand/icon.png`} width="40" height="40" alt="" />
    <span>Thrivling</span>
  </a>;
}

/** The Play Console closed-testing list is this Google Group: joining it is joining the test. */
const TESTER_GROUP_URL = "https://groups.google.com/g/thrivling-testers";

/** The Google Play logo: four coloured triangles meeting at the centre. */
function PlayLogo() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path d="M3.6 1.9 13.4 12 3.6 22.1c-.4-.2-.6-.6-.6-1.1V3c0-.5.2-.9.6-1.1Z" fill="#00A0FF" />
      <path d="M3.6 1.9c.4-.2.9-.2 1.4.1l11.7 6.7-3.3 3.3Z" fill="#00E676" />
      <path d="m16.7 8.7 3.5 2c.9.5.9 2 0 2.6l-3.5 2L13.4 12Z" fill="#FFC400" />
      <path d="M13.4 12l3.3 3.3L5 22c-.5.3-1 .3-1.4.1Z" fill="#FF3D3D" />
    </svg>
  );
}

function TesterLink({ compact = false }: { compact?: boolean }) {
  return <a className={`tester-link ${compact ? "tester-link--nav" : ""}`} href="#early-testers" aria-label="Join early testers">
    {compact ? <><span className="label-full">Join early testers</span><span className="label-short" aria-hidden="true">Join</span></> : "Join early testers"}
  </a>;
}

export default function App() {
  const { choice, choose, phase, theme, notice } = useSky();
  const reduced = useReducedMotionPreference();
  useEffect(() => {
    const root = document.documentElement;
    const on = () => {
      // The counter stays on the tree for the first half screen of scrolling, then moves into the nav.
      root.dataset.scrolled = window.scrollY > window.innerHeight * 0.55 ? "1" : "0";
      root.dataset.deep = window.scrollY > window.innerHeight * 0.8 ? "1" : "0";
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const [day, setDay] = useState(0);
  const style = {
    "--sky-top": theme.sky[0], "--sky-mid": theme.sky[1], "--sky-bottom": theme.sky[2],
    "--ink": theme.ink, "--soft": theme.soft, "--glass": theme.glass, "--panel": theme.panel,
    "--hill": theme.hill, "--hill-deep": theme.hill2, "--on-ink": theme.onInk,
    "--leaf": theme.leaf, "--skip": theme.skip, "--line": theme.line, "--todo": theme.todo,
  } as CSSProperties;

  return (
    <div id="home" className="site-shell" style={style} data-phase={phase}>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="sky-world" aria-hidden="true">
        <div className="sky-haze" />
        <div className={`sky-orb ${phase === "night" ? "sky-orb--moon" : ""}`} />
        <div className="stars">{Array.from({ length: 18 }, (_, i) =>
          <i key={i} style={{ left: `${(i * 43 + 7) % 100}%`, top: `${(i * 17 + 9) % 65}%`, opacity: 0.35 + (i % 3) * 0.25 }} />,
        )}</div>
        <div className="world-hill world-hill--back" />
        <div className="world-hill world-hill--front" />
      </div>
      <TreeScene paused={false} reduced={reduced} time={phase} onDay={setDay} />

      <header className="site-header">
        <div className="nav-glass glass-pane">
          <BrandMark />
          <div className="nav-counter" aria-live="polite" aria-label={`Day ${day}`}>
            <DayCount day={day} />
          </div>
          <div className="nav-end">
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#trees">Trees</a><a href="#grove">The grove</a>
          </nav>
          <div className="nav-tools">
            <GlassSelect label="Sky" value={choice} options={SKY_OPTIONS} onChange={choose} placement="below" />
            <TesterLink compact />
          </div>
          </div>
        </div>
      </header>
      {/* At the bottom on arrival; once scrolling starts it fades into the nav (see .nav-counter). */}
      <div className="tree-counter glass-pane" aria-hidden="true">
        <DayCount day={day} />
      </div>
      {notice && <p className="preference-notice glass-pane" role="status">{notice}</p>}

      <main id="main">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-inner">
          <div className="hero-copy">
            <h1 id="hero-title">Progress that feels alive.</h1>
            <p className="hero-subhead">Whether you’re growing a daily ritual or quietly outgrowing a vice, Thrivling turns your days into a living companion.</p>
            <TesterLink />
            {!reduced && <p className="scroll-hint" aria-hidden="true"><span /> Scroll to grow it</p>}
          </div>

          </div>
        </section>

        <section className="story-section" id="grove" aria-labelledby="grove-title">
          <div className="story-panel story-panel--narrow glass-pane">
            <h2 id="grove-title">Grow what nourishes you. Outgrow what doesn't.</h2>
            <p>Two goals can grow side by side. To anyone else, they are simply trees in a quiet grove.</p>
          </div>
        </section>

        <section className="story-section" aria-labelledby="days-title">
          <div className="story-panel story-panel--wide glass-pane">
            <h2 id="days-title">Good days and hard days both count.</h2>
            <p>Mark a day done when you showed up for yourself. Skip the ones that went differently. A skip leaves a few fallen leaves, never a reset, so your tree keeps growing with you.</p>
          </div>
        </section>

        <TreePicker reduced={reduced} />

        <section className="app-section app-section--solo" id="early-testers" aria-labelledby="app-title">
          <div className="app-copy glass-pane">
            <h2 id="app-title">Your grove, in your pocket.</h2>
            <p>Check in with one tap, watch each tree grow, and keep the whole story private on your phone.</p>
            <a className="play-badge" href={TESTER_GROUP_URL} target="_blank" rel="noopener">
              <PlayLogo />
              <span><small>Join early testers on</small>Google Play</span>
            </a>
            <p className="tester-note">Join with your Google account. When testing opens, you'll get the install link by email.</p>
          </div>
        </section>
        {/* The camera's last stop: the whole grove, standing above the footer. */}
        <section className="grove-end" aria-label="The whole grove" />
      </main>
      <footer className="site-footer">
        <BrandMark />
        <nav aria-label="Footer">
          <a href="#trees">Trees</a><a href="#grove">The grove</a>
          <a href={TESTER_GROUP_URL} target="_blank" rel="noopener">Google Play testers</a>
        </nav>
        <p>© {new Date().getFullYear()} Thrivling</p>
      </footer>
      <a className="to-top glass-pane" href="#home" aria-label="Back to top">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </a>
    </div>
  );
}
