import { useCallback, useLayoutEffect, useRef } from 'react';
import Icon from './Icon';
import { useModalScrollLock } from './useModalScrollLock';
import './welcome.css';

const lightParticles = [
  [23, 36, 0], [35, 64, 140], [43, 24, 260], [48, 75, 80],
  [54, 38, 220], [61, 66, 320], [71, 28, 100], [77, 57, 280],
];

function DoorPanel({ side, onAnimationEnd }) {
  return <div className={`welcome-door welcome-door-${side}`} onAnimationEnd={onAnimationEnd} aria-hidden="true">
    <div className="welcome-door-surface">
      <div className="welcome-atmosphere"><div className="welcome-halo" /><div className="welcome-arch" /><span className="welcome-spark welcome-spark-one"><Icon name="sparkle" size={17} /></span><span className="welcome-spark welcome-spark-two"><Icon name="sparkle" size={11} /></span></div>
    </div>
    <span className="welcome-door-edge" />
  </div>;
}

export default function WelcomeExperience({ closing, onEnter, onClosed }) {
  const dialog = useRef(null);
  const enterButton = useRef(null);
  const entranceStarted = useRef(false);
  const entranceFinished = useRef(false);
  useModalScrollLock(true);

  const completeEntrance = useCallback(() => {
    if (entranceFinished.current) return;
    entranceFinished.current = true;
    onClosed();
  }, [onClosed]);

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
    // The timer also completes the entrance when animation events are unavailable.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const exitTimer = window.setTimeout(completeEntrance, reducedMotion ? 220 : 2600);
    return () => window.clearTimeout(exitTimer);
  }, [closing, completeEntrance]);

  function startEntrance(withMusic) {
    if (closing || entranceStarted.current) return;
    entranceStarted.current = true;
    // The parent calls audio.play() here, directly within the user gesture.
    onEnter(withMusic);
  }

  function finishDoorAnimation(event) {
    if (closing && event.animationName === 'welcome-door-open-right') completeEntrance();
  }

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

  return <dialog ref={dialog} className={`welcome-experience${closing ? ' is-closing' : ''}`} tabIndex={-1} aria-labelledby="welcome-title" aria-describedby="welcome-copy" onCancel={event => { event.preventDefault(); startEntrance(false); }} onKeyDown={keepFocusInside}>
    <div className="welcome-doorway" aria-hidden="true"><DoorPanel side="left" /><DoorPanel side="right" onAnimationEnd={finishDoorAnimation} /></div>
    <div className="welcome-entrance-light" aria-hidden="true" />
    <div className="welcome-particles" aria-hidden="true">{lightParticles.map(([left, top, delay], index) => <span key={index} style={{ '--particle-left': `${left}%`, '--particle-top': `${top}%`, '--particle-delay': `${delay}ms` }} />)}</div>
    <div className="welcome-content" aria-hidden={closing ? true : undefined}>
      <div className="welcome-monogram" aria-hidden="true"><span>XX</span></div>
      <h1 id="welcome-title"><span>Welcome to</span>{' '}Chapter <em>Twenty</em></h1>
      <div className="welcome-rule" aria-hidden="true" />
      <p id="welcome-copy">For the full experience, turn on the music<br className="welcome-copy-break" /> and step into your world.</p>
      <div className="welcome-actions">
        <button ref={enterButton} type="button" className="welcome-enter" disabled={closing} onClick={() => startEntrance(true)}><Icon name="music" size={18} /><span>Enter with music</span><Icon name="arrowRight" size={18} /></button>
        <button type="button" className="welcome-quiet" disabled={closing} onClick={() => startEntrance(false)}><Icon name="volumeOff" size={16} /><span>Continue quietly</span></button>
      </div>
    </div>
    <p className="welcome-entrance-message" role="status" aria-live="polite">{closing ? 'A little world, made just for you.' : ''}</p>
  </dialog>;
}
