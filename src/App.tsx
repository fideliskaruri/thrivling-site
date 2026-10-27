import { useState, type CSSProperties } from "react";
import { GlassSelect, type SelectOption } from "./components/GlassSelect";
import { LeafIcon } from "./components/LeafIcon";
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

function TesterLink({ compact = false }: { compact?: boolean }) {
  return <a className={`tester-link ${compact ? "tester-link--nav" : ""}`} href="#early-testers">Join early testers</a>;
}

export default function App() {
  const { choice, choose, phase, theme, notice } = useSky();
  const reduced = useReducedMotionPreference();
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
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
      <TreeScene paused={paused} reduced={reduced} replay={replay} time={phase} onDay={setDay} />

      <header className="site-header">
        <div className="nav-glass glass-pane">
          <BrandMark />
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#trees">Trees</a><a href="#grove">The grove</a><a href="#privacy">Privacy</a>
          </nav>
          <TesterLink compact />
        </div>
      </header>
      {notice && <p className="preference-notice glass-pane" role="status">{notice}</p>}

      <main id="main">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">Progress that feels alive.</h1>
            <p className="hero-subhead">Whether you’re growing a daily ritual or quietly outgrowing a vice, Thrivling turns your days into a living companion.</p>
            <TesterLink />
          </div>
          <div className="hero-bar glass-pane">
            <div className="hero-day" aria-live="polite">
              <LeafIcon filled className="hero-day-leaf" />
              <span className="hero-day-count">{day}<small>d</small></span>
              <span className="hero-day-label">Sun Sprout</span>
            </div>
            <button type="button" className="hero-icon-button" aria-label="Replay tree growth" onClick={() => { setPaused(false); setReplay(n => n + 1); }}>
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M4 10a6 6 0 1 0 2-4.5M4 3v3.5h3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <GlassSelect label="Sky" value={choice} options={SKY_OPTIONS} onChange={choose} placement="above" />
            <button type="button" className="hero-icon-button" aria-label={paused ? "Play animation" : "Pause animation"} aria-pressed={paused} onClick={() => setPaused(p => !p)}>
              {paused
                ? <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M7 5l8 5-8 5z" fill="currentColor" /></svg>
                : <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M7 5v10M13 5v10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>}
            </button>
          </div>
        </section>

        <TreePicker reduced={reduced} />

        <section className="story-section" id="grove" aria-labelledby="grove-title">
          <div className="story-panel">
            <h2 id="grove-title">Grow what nourishes you. Outgrow what doesn't.</h2>
            <p>Two goals can grow side by side. To anyone else, they are simply trees in a quiet grove.</p>
            <div className="grove-names">
              <div><LeafIcon filled className="grove-leaf" /><strong>Sun Sprout</strong><span>A daily ritual</span></div>
              <div><LeafIcon filled className="grove-leaf grove-leaf--other" /><strong>Iron Bark</strong><span>A fresh beginning</span></div>
            </div>
            <p className="small-copy">Only you know which is which.</p>
          </div>
        </section>

        <section className="story-section" aria-labelledby="days-title">
          <div className="story-panel">
            <h2 id="days-title">Good days and hard days both count.</h2>
            <p>Mark a day done when you showed up for yourself. Skip the ones that went differently. A skip leaves a few fallen leaves, never a reset, so your tree keeps growing with you.</p>
          </div>
        </section>

        <section className="story-section" id="privacy" aria-labelledby="privacy-title">
          <div className="story-panel">
            <h2 id="privacy-title">A protected garden, even in plain sight.</h2>
            <p>Goals use codenames, so your grove can be peaceful to anyone glancing at your phone.</p>
            <p>On Android, your trees and notes are encrypted and stored on your phone. An optional PIN or fingerprint lock keeps your garden yours.</p>
          </div>
        </section>

        <section className="closing-section" id="early-testers" aria-labelledby="closing-title">
          <div className="closing-panel">
            <h2 id="closing-title">Give your days somewhere to grow.</h2>
            <p>Build a ritual. Outgrow a vice. Let the tree keep the story.</p>
            <div className="tester-availability">
              <strong>Early testing is coming</strong>
              <p>The invitation link isn't available yet. We'll put it here when the tester group opens.</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><BrandMark /><p>A little more alive, one day at a time.</p><a href="#home">Back to the beginning</a></footer>
    </div>
  );
}
