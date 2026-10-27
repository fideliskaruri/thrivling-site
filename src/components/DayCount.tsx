import { LeafIcon } from "./LeafIcon";
import { useDay } from "../dayStore";

/** The day count, like the app's counter: each digit that changes rolls up into place, and the leaf gives a small nod. */
export function DayCount() {
  const day = useDay();
  const digits = String(day).split("");
  return (
    <>
      <LeafIcon key={`leaf-${day % 10 === 0 ? day : "x"}`} filled className="hero-day-leaf day-leaf" />
      <span className="hero-day-count" aria-hidden="true">
        {digits.map((d, i) => (
          <span key={`${digits.length - i}-${d}`} className="day-digit">{d}</span>
        ))}
        <small>d</small>
      </span>
    </>
  );
}
