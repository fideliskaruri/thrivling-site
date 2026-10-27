/** Exact paths from the app's LeafCounts.tsx; a skipped day uses its 100-degree rotation. */
export function LeafIcon({ filled = true, fallen = false, className = "" }: {
  filled?: boolean; fallen?: boolean; className?: string;
}) {
  return <svg viewBox="0 0 24 24" className={`leaf-icon ${className}`} aria-hidden="true" style={fallen ? { transform: "rotate(100deg)" } : undefined}>
    <path d="M5 19C5 10 10 4.5 20 4c.5 10-5 15-13 15.2" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M4 20.5 13 11" stroke={filled ? "var(--leaf-cutout, var(--panel))" : "currentColor"} strokeWidth="1.6" strokeLinecap="round" />
  </svg>;
}
