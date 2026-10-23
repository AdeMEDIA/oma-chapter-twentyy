import { useLayoutEffect, useRef } from 'react';
import Icon from './Icon';
import { useModalScrollLock } from './useModalScrollLock';
import './welcome.css';

export default function WelcomeExperience({ closing, onEnter, onClosed }) {
  const dialog = useRef(null);
  const enterButton = useRef(null);
  useModalScrollLock(true);

  useLayoutEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const root = document.documentElement;
    const previousRootStyles = { overflow: root.style.overflow, scrollbarGutter: root.style.scrollbarGutter };
    // A full-screen dialog must also cover the page's reserved scrollbar gutter.
    root.style.overflow = 'hidden';
    root.style.scrollbarGutter = 'auto';
    if (!element.open) element.showModal();
    enterButton.current.focus({ preventScroll: true });
    return () => {
      element.close();
      Object.assign(root.style, previousRootStyles);
      // The route shell loses `inert` later in this same React commit.
      queueMicrotask(() => {
        if (document.querySelector('.welcome-experience[open]')) return;
        const returnTo = previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : document.querySelector('main') || document.querySelector('.birthday-header a, .site-header a, .skip-link');
        returnTo?.focus({ preventScroll: true });
      });
    };
  }, []);

  useLayoutEffect(() => {
    if (!closing) return;
    dialog.current.focus({ preventScroll: true });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClosed();
      return;
    }
    const exitTimer = window.setTimeout(onClosed, 460);
    return () => window.clearTimeout(exitTimer);
  }, [closing, onClosed]);

  function keepFocusInside(event) {
    if (event.key !== 'Tab') return;
    if (closing) { event.preventDefault(); return; }
    const buttons = dialog.current.querySelectorAll('button');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return <dialog ref={dialog} className={`welcome-experience${closing ? ' is-closing' : ''}`} tabIndex={-1} aria-labelledby="welcome-title" aria-describedby="welcome-copy" onCancel={event => { event.preventDefault(); if (!closing) onEnter(false); }} onKeyDown={keepFocusInside}>
    <div className="welcome-atmosphere" aria-hidden="true"><div className="welcome-halo" /><div className="welcome-arch" /><span className="welcome-spark welcome-spark-one"><Icon name="sparkle" size={17} /></span><span className="welcome-spark welcome-spark-two"><Icon name="sparkle" size={11} /></span></div>
    <div className="welcome-content">
      <div className="welcome-monogram" aria-hidden="true"><span>XX</span></div>
      <h1 id="welcome-title"><span>Welcome to</span>{' '}Chapter <em>Twenty</em></h1>
      <div className="welcome-rule" aria-hidden="true" />
      <p id="welcome-copy">For the full experience, turn on the music<br className="welcome-copy-break" /> and step into her world.</p>
      <div className="welcome-actions">
        <button ref={enterButton} type="button" className="welcome-enter" disabled={closing} onClick={() => onEnter(true)}><Icon name="music" size={18} /><span>Enter with music</span><Icon name="arrowRight" size={18} /></button>
        <button type="button" className="welcome-quiet" disabled={closing} onClick={() => onEnter(false)}><Icon name="volumeOff" size={16} /><span>Continue quietly</span></button>
      </div>
    </div>
  </dialog>;
}
