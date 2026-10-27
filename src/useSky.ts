import { useEffect, useState } from "react";
import { phaseAt, themes, type SkyPhase } from "./tree/appTheme";

export type SkyChoice = "auto" | SkyPhase;
const KEY = "thrivling-sky";
const isChoice = (value: string | null): value is SkyChoice =>
  value === "auto" || value === "dawn" || value === "day" || value === "dusk" || value === "night";

export function useSky() {
  // Read the saved sky before the first render, so the scene never starts in the wrong light.
  const [choice, setChoice] = useState<SkyChoice>(() => {
    try { const saved = localStorage.getItem(KEY); return isChoice(saved) ? saved : "auto"; } catch { return "auto"; }
  });
  const [clock, setClock] = useState(() => phaseAt(new Date().getHours()));
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      localStorage.getItem(KEY);
    } catch (error) {
      console.warn("Sky preference storage is unavailable", error);
      setNotice("Your browser cannot save the sky preference. You can still change it for this visit.");
    }
    const refresh = () => setClock(phaseAt(new Date().getHours()));
    const timer = setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  function choose(next: SkyChoice) {
    setChoice(next);
    try { localStorage.setItem(KEY, next); setNotice(""); }
    catch (error) {
      console.warn("Could not save sky preference", error);
      setNotice("This sky is set for this visit. Your browser did not allow saving the preference.");
    }
  }
  const phase = choice === "auto" ? clock : choice;
  useEffect(() => {
    document.documentElement.style.colorScheme = phase === "night" || phase === "dusk" ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themes[phase].sky[0]);
  }, [phase]);
  return { choice, choose, phase, theme: themes[phase], notice };
}
