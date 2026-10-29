import treeCapture from "./assets/app/wisteria.webp";
import groveCapture from "./assets/app/grove.webp";

import { useEffect, type CSSProperties } from "react";
import { GlassSelect, type SelectOption } from "./components/GlassSelect";
import { DayCount } from "./components/DayCount";
import { TreePicker } from "./components/TreePicker";
import { TreeScene } from "./components/TreeScene";
import { useReducedMotionPreference } from "./useReducedMotionPreference";
import { useSky, type SkyChoice } from "./useSky";
import { setDay } from "./dayStore";
import * as m from 'motion/react-m';
import { AppScreenshot } from './components/AppScreenshot';
import { useSiteMotion } from './useSiteMotion';

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

const DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.fideliskaruri.thrivling";

function DownloadLink({ compact = false }: { compact?: boolean }) {
  const reduced = useReducedMotionPreference();
  return <m.a className={`download-link ${compact ? "download-link--nav" : ""}`} href={DOWNLOAD_URL} aria-label="Get Thrivling on Google Play" whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { scale: 0.97 }}>Get it here</m.a>;
}
export default function App() {
  useSiteMotion();
  const { choice, choose, phase, theme, notice } = useSky();
  const reduced = useReducedMotionPreference();
  useEffect(() => {
    const root = document.documentElement;
    const set = (key: string, value: boolean) => { const v = value ? "1" : "0"; if (root.dataset[key] !== v) root.dataset[key] = v; };
    const picker = document.getElementById("trees");
    const on = () => {
      const y = window.scrollY, h = window.innerHeight;
      // The counter stays on the tree for the first half screen of scrolling, then moves into the nav.
      set("scrolled", y > h * 0.55);
      set("deep", y > h * 0.8);
      // Back-to-top steps aside while the tree picker is in front, so it never covers the picker's controls.
      const r = picker?.getBoundingClientRect();
      set("picking", !!r && r.top < h * 0.6 && r.bottom > h * 0.4);
      const footer = document.querySelector('.site-footer')?.getBoundingClientRect();
      root.style.setProperty('--to-top-bottom', `${Math.max(20, footer ? h - footer.top + 14 : 20)}px`);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); root.style.removeProperty('--to-top-bottom'); };
  }, []);
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
      </div>

      <header className="site-header">
        <div className="nav-glass glass-pane">
          <BrandMark />
          <div className="nav-counter" aria-hidden="true">
            <DayCount />
          </div>
          <div className="nav-end">
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#trees">Trees</a><a href="#grove">The grove</a>
          </nav>
          <div className="nav-tools">
            <GlassSelect label="Sky" value={choice} options={SKY_OPTIONS} onChange={choose} placement="below" />
          </div>
          </div>
        </div>
      </header>
      {/* Rides on top of the tree; after half a screen of scrolling it fades into the nav (see .nav-counter). */}
      <div className="tree-counter glass-pane" aria-hidden="true">
        <DayCount />
      </div>
      {notice && <p className="preference-notice glass-pane" role="status">{notice}</p>}

      <main id="main">
        <TreeScene paused={false} reduced={reduced} time={phase} onDay={setDay} />
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-inner">
          <div className="hero-copy">
            <h1 id="hero-title">Progress that feels alive.</h1>
            <p className="hero-subhead">Track the habits you want to build and the ones you want to break. Watch your progress grow into a grove of your own.</p>
            <DownloadLink />
            {!reduced && <p className="scroll-hint" aria-hidden="true"><span className="scroll-hint-mouse" /><span className="scroll-hint-swipe" /> Scroll to watch it grow</p>}
          </div>

          </div>
        </section>

        <section className="story-section" id="grove" aria-labelledby="grove-title">
          <div className="story-panel story-panel--narrow glass-pane">
            <h2 id="grove-title">Grow what nourishes you. Outgrow what doesn't.</h2>
            <p>A morning walk. Less scrolling. Whatever you’re working on, give it a tree of its own.</p>
          </div>
        </section>

        <section className="story-section" aria-labelledby="days-title">
          <div className="story-panel story-panel--wide glass-pane">
            <h2 id="days-title">Good days and hard days both count.</h2>
            <p>Mark a day done or skip it. A skipped day leaves a few fallen leaves, but your progress stays.</p>
          </div>
        </section>

        <TreePicker reduced={reduced} />

        <section className="app-section app-showcase" id="app" aria-labelledby="app-title">
          <div className="app-copy glass-pane">
            <h2 id="app-title">Your grove, in your pocket.</h2>
          </div>
          <div className="app-screens" aria-label="Thrivling app preview">

            <AppScreenshot src={treeCapture} alt="A nearly grown Wisteria tree in Thrivling, with cascading purple flowers and 27 of 30 days recorded" title="Small steps. Beautiful growth." description="Your daily progress takes its own shape." />
            <AppScreenshot src={groveCapture} alt="Thrivling Grove showing trees together on a grassy island" title="Your progress, together." description="A place for every beginning." />
          </div>
        </section>
        <section className="grove-end grove-download" id="download" aria-labelledby="download-title">
          <div className="download-copy glass-pane">
            <h2 id="download-title">Start with one<br />small change.</h2>
            <p>Pick a goal. Plant your first tree.</p>
            <m.a className="official-play" href={DOWNLOAD_URL} aria-label="Get Thrivling on Google Play" whileHover={reduced ? undefined : { y: -2 }} whileTap={reduced ? undefined : { scale: 0.97 }}>
              <img src={`${import.meta.env.BASE_URL}assets/brand/google-play.png`} alt="Get it on Google Play" width="646" height="250" />
            </m.a>
          </div>
        </section>      </main>
      <div className="site-footer-wrap">
      <footer className="site-footer glass-pane">
        <BrandMark />
        <nav aria-label="Footer">
          <a href="#trees">Trees</a><a href="#app">The app</a>
        </nav>
        <p>© {new Date().getFullYear()} Thrivling</p>
      </footer>
      </div>
      <nav aria-label="Back to top">
      <a className="to-top glass-pane" href="#home" aria-label="Back to top">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </a>
      </nav>
    </div>
  );
}
