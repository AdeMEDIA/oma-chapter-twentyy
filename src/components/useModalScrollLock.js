import { useEffect } from 'react';
import { pageScrollport } from './page-scroll';

// Freeze the page behind native dialogs, including on touch screens.
export function useModalScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const body = document.body;
    const y = window.scrollY;
    const hash = window.location.hash;
    const port = pageScrollport();
    const portTop = port?.scrollTop;
    const portOverflow = port?.style.overflow;
    if (port) port.style.overflow = 'hidden';
    const previous = { position: body.style.position, top: body.style.top, width: body.style.width };
    Object.assign(body.style, { position: 'fixed', top: `-${y}px`, width: '100%' });
    return () => {
      Object.assign(body.style, previous);
      if (port) {
        port.style.overflow = portOverflow;
        if (window.location.hash === hash) port.scrollTop = portTop;
      }
      if (window.location.hash === hash) window.scrollTo({ top: y, behavior: 'instant' });
    };
  }, [active]);
}
