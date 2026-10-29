import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { AnimatePresence, useIsPresent } from 'motion/react';
import * as m from 'motion/react-m';
import { useReducedMotionPreference } from '../useReducedMotionPreference';

function SelectSurface({ children, list, id, active, onKeyDown, placement }: {
  children: ReactNode; list: RefObject<HTMLUListElement | null>; id: string; active: number;
  onKeyDown: (event: KeyboardEvent<HTMLUListElement>) => void; placement: 'above' | 'below';
}) {
  const present = useIsPresent();
  const reduced = useReducedMotionPreference();
  return <m.ul ref={list} className="glass-select-list glass-pane" role="listbox" tabIndex={-1}
    aria-labelledby={`${id}-label`} aria-activedescendant={`${id}-${active}`} aria-hidden={!present} inert={!present}
    onKeyDown={onKeyDown} initial={{ opacity: 0, y: reduced ? 0 : placement === 'above' ? 6 : -6 }}
    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -4 }} transition={{ duration: reduced ? 0 : 0.14 }}>
    {children}
  </m.ul>;
}

export interface SelectOption<T extends string> { value: T; label: string; hint?: string }

/**
 * A themed select in the shadcn/Radix pattern: a glass trigger that opens a glass listbox. Works with touch,
 * mouse and keyboard (arrows, Home, End, Enter, Escape, type-ahead) and announces itself as a listbox.
 */
export function GlassSelect<T extends string>({ label, value, options, onChange, placement = "below" }: {
  label: string; value: T; options: SelectOption<T>[]; onChange: (value: T) => void; placement?: "below" | "above";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.findIndex(o => o.value === value)));
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const reduced = useReducedMotionPreference();
  const current = options.find(o => o.value === value) ?? options[0]!;

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex(o => o.value === value)));
    list.current?.focus();
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, options, value]);

  const choose = (i: number) => {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
    trigger.current?.focus();
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const last = options.length - 1;
    const moves: Record<string, number> = { ArrowDown: Math.min(last, active + 1), ArrowUp: Math.max(0, active - 1), Home: 0, End: last };
    if (e.key in moves) { e.preventDefault(); setActive(moves[e.key]!); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); }
    else if (e.key === "Escape" || e.key === "Tab") { setOpen(false); trigger.current?.focus(); }
    else if (e.key.length === 1) {
      const hit = options.findIndex(o => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <div ref={root} className={`glass-select ${open ? "is-open" : ""}`} data-placement={placement}>
      <span id={`${id}-label`} className="glass-select-label">{label}</span>
      <m.button
        ref={trigger}
        type="button"
        className="glass-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => setOpen(o => !o)}
        whileTap={reduced ? undefined : { scale: 0.97 }}
        onKeyDown={e => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setOpen(true); } }}
      >
        <span id={`${id}-value`}>{current.label}</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </m.button>
      <AnimatePresence>{open && (
        <SelectSurface list={list} id={id} active={active} onKeyDown={onListKey} placement={placement}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === value}
              className={`${i === active ? "is-active" : ""} ${o.value === value ? "is-selected" : ""}`}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              <span>{o.label}</span>
              {o.hint && <small>{o.hint}</small>}
              {o.value === value && (
                <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </li>
          ))}
        </SelectSurface>
      )}</AnimatePresence>
    </div>
  );
}
