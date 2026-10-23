import { useEffect, useRef } from 'react';
import { scrollPageTo } from './page-scroll';

// Only observe elements that opt in. Reveals stop observing once completed;
// pointer parallax and audio playback have separate, event-driven lifecycles.
export function useExperienceMotion(rootRef, route, hash, introComplete) {
  const previousRoute = useRef(route);
  useEffect(() => {
    if (!introComplete || !rootRef.current) return;
    const root = rootRef.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const routeChanged = previousRoute.current !== route;
    previousRoute.current = route;
    const anchor = hash.split('#')[2];
    let anchorHandled = !anchor;
    let frame = 0;
    let pageAnimation;
    let mainHandled = false;

    const reveal = element => {
      element.dataset.revealState = 'visible';
      observer?.unobserve(element);
    };
    const observer = !motion.matches && 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
    }, { threshold: 0.08, rootMargin: '0px 0px -10px 0px' }) : null;

    function prepare() {
      frame = 0;
      for (const element of root.querySelectorAll('[data-reveal]:not([data-reveal-state])')) {
        element.dataset.revealState = observer ? 'waiting' : 'visible';
        observer?.observe(element);
      }
      const main = root.querySelector('main');
      if (!mainHandled && main) {
        mainHandled = true;
        if (routeChanged && !anchor) {
          scrollPageTo(0);
          main.focus({ preventScroll: true });
        }
        if (routeChanged && route !== 'room' && !motion.matches && main.animate) {
          pageAnimation = main.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 440, easing: 'cubic-bezier(.2,.7,.2,1)' });
        }
      }
      if (!anchorHandled) {
        const target = document.getElementById(anchor);
        if (target) {
          anchorHandled = true;
          target.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
        }
      }
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(prepare); }
    const changes = new MutationObserver(schedule);
    changes.observe(root, { childList: true, subtree: true });
    const reduce = () => {
      if (!motion.matches) return;
      observer?.disconnect();
      pageAnimation?.cancel();
      for (const element of root.querySelectorAll('[data-reveal]')) element.dataset.revealState = 'visible';
    };
    motion.addEventListener('change', reduce);
    schedule();
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); changes.disconnect(); pageAnimation?.cancel(); motion.removeEventListener('change', reduce); };
  }, [rootRef, route, hash, introComplete]);
}
