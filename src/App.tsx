import { useState, type CSSProperties } from "react";
import { TreeScene } from "./components/TreeScene";
import { LeafIcon } from "./components/LeafIcon";
import { useReducedMotionPreference } from "./useReducedMotionPreference";
import { useSky, type SkyChoice } from "./useSky";

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
  const [mark, setMark] = useState<"done" | "skip" | null>(null);
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
      <TreeScene paused={paused} reduced={reduced} replay={replay} onDay={setDay} />

      <header className="site-header">
        <div className="nav-glass glass-pane">
          <BrandMark />
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#grove">The grove</a><a href="#privacy">Privacy</a><a href="#pricing">Pricing</a>
          </nav>
          <TesterLink compact />
        </div>
      </header>

      <aside className="sky-controls glass-pane" aria-label="Sky and animation settings">
        <label htmlFor="sky-choice">Your sky</label>
        <select id="sky-choice" value={choice} onChange={event => choose(event.target.value as SkyChoice)}>
          <option value="auto">Auto · local time</option><option value="dawn">Dawn</option>
          <option value="day">Day</option><option value="dusk">Dusk</option><option value="night">Night</option>
        </select>
        <button type="button" className="motion-button" aria-label={paused ? "Play animation" : "Pause animation"} aria-pressed={paused} onClick={() => setPaused(p => !p)}>
          {paused ? "Play" : "Pause"}
        </button>
      </aside>
      {notice && <p className="preference-notice glass-pane" role="status">{notice}</p>}

      <main id="main">
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">Progress that feels alive.</h1>
            <p className="hero-subhead">Whether you’re growing a daily ritual or quietly outgrowing a vice, Thrivling turns your days into a living companion.</p>
            <p className="hero-frame">Grow what nourishes you. Outgrow what doesn't.</p>
            <TesterLink />
          </div>
          <div className="growth-card glass-pane">
            <div className="growth-heading"><span>Sun Sprout</span><span className="growth-day">Day {day}</span></div>
            <div className="day-marks" aria-label={`Growth preview: day ${day} of 90`}>
              {Array.from({ length: 30 }, (_, i) => <LeafIcon key={i} filled={i < day / 3} className={i < day / 3 ? "is-grown" : ""} />)}
            </div>
            <div className="growth-footer"><span>A glimpse of your first 90 days</span>
              <button type="button" onClick={() => { setPaused(false); setReplay(n => n + 1); }} aria-label="Replay tree growth">Replay</button>
            </div>
          </div>
          <a className="scroll-cue" href="#grove">A little more, every day</a>
        </section>

        <section className="story-section" id="grove" aria-labelledby="grove-title">
          <div className="story-panel glass-pane">
            <h2 id="grove-title">Different goals.<br />Room to grow.</h2>
            <p>Grow what nourishes you. Outgrow what doesn't.</p>
            <p>Two goals can grow side by side. To anyone else, they are simply trees in a quiet grove.</p>
            <div className="grove-names">
              <div><LeafIcon className="grove-leaf" /><strong>Sun Sprout</strong><span>A daily ritual</span></div>
              <div><LeafIcon fallen className="grove-leaf grove-leaf--other" /><strong>Iron Bark</strong><span>A fresh beginning</span></div>
            </div>
            <p className="small-copy">Only you know which is which.</p>
          </div>
        </section>

        <section className="story-section" aria-labelledby="days-title">
          <div className="story-panel glass-pane">
            <h2 id="days-title">Every kind of day belongs.</h2>
            <p>Done marks a day that supports your goal. Skip neutrally records a day that went differently. Your tree keeps the whole story either way.</p>
            <div className="daily-demo">
              <div className="daily-demo-title"><strong>Today, gently</strong><span className="small-copy">Try a check-in</span></div>
              <div className="demo-actions" role="group" aria-label="Try a daily check-in">
                <button type="button" className={`action-button ${mark === "done" ? "is-done" : ""}`} aria-pressed={mark === "done"} onClick={() => setMark("done")}><LeafIcon filled={mark === "done"} /> Done</button>
                <button type="button" className={`action-button ${mark === "skip" ? "is-skip" : ""}`} aria-pressed={mark === "skip"} onClick={() => setMark("skip")}><LeafIcon fallen filled={mark === "skip"} /> Skip</button>
              </div>
              <p className="demo-message" aria-live="polite">{mark === "done" ? "Done today. One day that supports your goal." : mark === "skip" ? "Skipped today. Your tree and its history stay in place." : "A day to celebrate, or a day to simply record."}</p>
              <p className="small-copy">This is a preview. Nothing is saved to a goal.</p>
            </div>
          </div>
        </section>

        <section className="story-section" id="privacy" aria-labelledby="privacy-title">
          <div className="story-panel glass-pane">
            <h2 id="privacy-title">A protected garden, even in plain sight.</h2>
            <p>Goals use codenames, so your grove can be peaceful to anyone glancing at your phone.</p>
            <p>On Android, your trees and notes are encrypted and stored on your phone. An optional PIN or biometric lock keeps your garden yours.</p>
            <p className="small-copy">Your goals are personal. Your home screen doesn't have to explain them.</p>
          </div>
        </section>

        <section className="pricing-section" id="pricing" aria-labelledby="pricing-title">
          <div className="pricing-heading"><h2 id="pricing-title">A grove worth keeping.</h2><p>Launch pricing. A place to begin, or room for more.</p></div>
          <div className="pricing-grid">
            <article className="price-card glass-pane">
              <h3>Free</h3><p className="price-amount">$0</p><p>A place to begin.</p>
              <ul><li><LeafIcon />Up to 3 active trees</li><li><LeafIcon />Core species</li><li><LeafIcon />Private, on-device storage on Android</li></ul>
            </article>
            <article className="price-card price-card--plus glass-pane">
              <h3>Thrivling Plus</h3><p>More room for your story.</p>
              <div className="price-options">
                <div><strong>$1.99</strong><span>per month</span></div>
                <div><strong>$14.99</strong><span>per year</span></div>
                <div><strong>$29.99</strong><span>lifetime</span></div>
              </div>
              <p className="small-copy">Keep your grove for good, without a subscription if you prefer.</p>
            </article>
          </div>
          <p className="pricing-note">These are launch prices. Closed-test access comes first.</p>
        </section>

        <section className="closing-section" id="early-testers" aria-labelledby="closing-title">
          <div className="closing-panel glass-pane">
            <h2 id="closing-title">Give your days somewhere to grow.</h2>
            <p>Build a ritual. Outgrow a vice. Let the tree keep the story.</p>
            <div className="tester-availability">
              <strong>Early testing is coming</strong>
              <p>The invitation link isn't available yet. We'll put it here when the tester group opens.</p>
            </div>
            <p className="small-copy">The Google Play listing is not available yet.</p>
          </div>
        </section>
      </main>
      <footer className="site-footer"><BrandMark /><p>A little more alive, one day at a time.</p><a href="#home">Back to the beginning</a></footer>
    </div>
  );
}
