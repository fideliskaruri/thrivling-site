import { useEffect } from 'react';
import { animate, inView } from 'motion';

export function useSiteMotion() { useEffect(() => {
const stops: (() => void)[] = [];
const seen = new WeakSet<Element>();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const active = new Set<ReturnType<typeof animate>>();

function bindReveals() {
  if (!document.documentElement.classList.contains('is-loaded')) return;
  observer.disconnect();
  document.querySelectorAll<HTMLElement>('.hero-copy h1, .hero-subhead, .hero-copy .download-link, .story-panel h2, .story-panel p, .app-copy, .app-screens .screen-frame, .download-copy h2, .download-copy p, .official-play').forEach(element => {
    if (seen.has(element)) return;
    seen.add(element);
    stops.push(inView(element, () => {
      if (reduced.matches) return;
      const phone = element.classList.contains('screen-frame');
      const secondPhone = !!element.closest('figure:nth-of-type(2)');
      const heading = element.matches('h1,h2');
      const delay = secondPhone ? 0.14 : element.matches('p,.hero-subhead') ? 0.1 : element.matches('a') ? 0.18 : 0;
      const control = animate(element, phone ? {
        opacity: [0, 1], y: [24, 0],
        rotate: [secondPhone ? '-5deg' : '5deg', '0deg'],
        x: [secondPhone ? -18 : 18, 0],
      } : { opacity: [0, 1], y: [heading ? 22 : 12, 0] }, {
        duration: phone ? 0.8 : 0.6, delay, ease: [0.22, 1, 0.36, 1],
      });
      active.add(control);
      control.then(() => active.delete(control));
    }, { amount: 0.2 }));
  });
}
const observer = new MutationObserver(bindReveals);
observer.observe(document.getElementById('root')!, { childList: true, subtree: true });
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
bindReveals();
const finishMotion = () => { if (reduced.matches) active.forEach(control => control.complete()); };
reduced.addEventListener('change', finishMotion);
return () => {
  observer.disconnect();
  stops.forEach(stop => stop());
  active.forEach(control => control.stop());
  reduced.removeEventListener('change', finishMotion);
};
}, []); }
