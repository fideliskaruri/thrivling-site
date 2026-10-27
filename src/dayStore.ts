import { useSyncExternalStore } from "react";

/** The hero tree's day, shared by both counters without re-rendering the whole page on every scroll step. */
let day = 0;
const listeners = new Set<() => void>();

export function setDay(next: number) {
  if (next === day) return;
  day = next;
  listeners.forEach(l => l());
}

export function useDay() {
  return useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => day);
}