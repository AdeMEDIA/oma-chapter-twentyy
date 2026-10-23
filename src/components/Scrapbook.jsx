import { useCallback, useEffect, useRef, useState } from 'react';
import { spreads } from '../data/birthday';
import Icon from './Icon';
import ResponsiveImage from './ResponsiveImage';
import './scrapbook.css';

const NOTICE_KEY = 'oma-scrapbook-viewing-note-v1';
const MOBILE_QUERY = '(max-width: 800px), (max-width: 1000px) and (max-height: 500px)';
let viewingNoteShown = false;
function shouldShowViewingNote() {
  if (!window.matchMedia(MOBILE_QUERY).matches || viewingNoteShown) return false;
  try { return !sessionStorage.getItem(NOTICE_KEY); } catch { return true; }
}

function Photo({ image, aspect, alt, placeholder, caption }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const reserved = !image;
  return <figure className={`memory-photo ${loaded || failed || reserved ? 'is-loaded' : ''} ${reserved ? 'is-reserved' : ''}`}>
      <span className="memory-photo-mount" style={{ aspectRatio: aspect || '3 / 4' }}>
      <span className="memory-corner corner-tl" /><span className="memory-corner corner-tr" />
      <span className="memory-corner corner-bl" /><span className="memory-corner corner-br" />
      {image && !failed ? <ResponsiveImage src={image} sizes="(max-width:800px) min(62vw, 255px), 254px" alt={alt} loading="lazy" decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} /> : <span className="memory-placeholder" role="img" aria-label={reserved ? alt || 'A photograph will be added here' : `Photograph unavailable: ${alt}`}><span className="memory-placeholder-outline" aria-hidden="true" /><small>{reserved ? placeholder || 'Photo to be added' : 'Photograph unavailable'}</small></span>}
      </span>
      {caption && <figcaption className="memory-photo-caption">{caption}</figcaption>}
  </figure>;
}

function Leaf({ index, side }) {
  const spread = spreads[index];
  const left = side === 'left';
  const image = left ? spread.image : spread.image2;
  return <div className={`memory-leaf memory-${side} layout-${index % 3}`} data-chapter={index + 1} data-side={side}>
    <header className="memory-leaf-heading"><span className="memory-date">CHAPTER {String(index + 1).padStart(2, '0')}</span><h2>{spread.title}</h2></header>
    <Photo key={`${spread.id}-${side}-${image || 'reserved'}`} image={image} aspect={left ? spread.imageAspect : spread.image2Aspect} alt={left ? spread.imageAlt : spread.image2Alt} placeholder={left ? spread.imagePlaceholder : spread.image2Placeholder} caption={left ? spread.caption : spread.caption2} />
    <span className="memory-page-number">{String(index * 2 + (side === 'left' ? 1 : 2)).padStart(2, '0')}</span>
  </div>;
}

export default function Scrapbook() {
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  // One canonical leaf index preserves the current chapter/side on resize.
  // Desktop moves by complete spreads; phones move through the ten leaves.
  const [position, setPosition] = useState(0);
  const [turn, setTurn] = useState(null);
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [showViewingNote, setShowViewingNote] = useState(shouldShowViewingNote);
  const timers = useRef(new Set());
  const busy = useRef(false);
  const positionRef = useRef(0);
  const turnRef = useRef(null);
  const book = useRef(null);
  const coverButton = useRef(null);
  const touch = useRef(null);
  const pageCount = spreads.length * 2;
  const chapter = Math.floor(position / 2);

  const later = useCallback((callback, delay) => {
    const timer = window.setTimeout(() => { timers.current.delete(timer); callback(); }, delay);
    timers.current.add(timer);
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach(timer => window.clearTimeout(timer));
    timers.current.clear();
  }, []);
  const canFocusBook = useCallback(() => {
    const active = document.activeElement;
    // WebKit returns focus to the owning main when the cover button leaves.
    return active === document.body || active === book.current?.closest('main') || book.current?.contains(active);
  }, []);
  const settle = useCallback(() => {
    const restoreBookFocus = busy.current && canFocusBook();
    clearTimers();
    if (turnRef.current) {
      positionRef.current = turnRef.current.to;
      setPosition(turnRef.current.to);
    }
    turnRef.current = null;
    setTurn(null);
    setOpening(false);
    busy.current = false;
    touch.current = null;
    if (restoreBookFocus) queueMicrotask(() => book.current?.focus({ preventScroll: true }));
  }, [clearTimers, canFocusBook]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smallScreen = window.matchMedia(MOBILE_QUERY);
    const update = () => { setReducedMotion(media.matches); if (media.matches) settle(); };
    const updateSize = () => { settle(); setMobile(smallScreen.matches); if (shouldShowViewingNote()) setShowViewingNote(true); };
    media.addEventListener('change', update);
    smallScreen.addEventListener('change', updateSize);
    return () => { media.removeEventListener('change', update); smallScreen.removeEventListener('change', updateSize); clearTimers(); };
  }, [clearTimers, settle]);

  useEffect(() => {
    if (!showViewingNote) return;
    viewingNoteShown = true;
    try { sessionStorage.setItem(NOTICE_KEY, 'shown'); } catch { /* The module still remembers this visit. */ }
  }, [showViewingNote]);

  function keepBookInView() {
    const element = book.current;
    // Do not undo a deliberate move to the music player or another control.
    if (!canFocusBook()) return;
    element?.focus({ preventScroll: true });
    if (mobile && element) {
      const bounds = element.getBoundingClientRect();
      if (bounds.top < 12 || bounds.bottom > window.innerHeight - 12) element.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'instant' : 'smooth' });
    }
  }
  function openBook() {
    if (busy.current || opened) return;
    busy.current = true;
    setOpened(true);
    setOpening(!reducedMotion);
    later(finishOpening, reducedMotion ? 0 : 980);
  }
  function finishOpening() {
    clearTimers();
    setOpening(false);
    busy.current = false;
    keepBookInView();
  }
  function closeBook() {
    settle();
    setOpened(false);
    later(() => coverButton.current?.focus({ preventScroll: true }), 0);
  }
  function goTo(target) {
    const from = positionRef.current;
    if (!opened || busy.current || target === from || target < 0 || target >= pageCount) return;
    if (!mobile && Math.floor(target / 2) === Math.floor(from / 2)) return;
    book.current?.focus({ preventScroll: true });
    if (reducedMotion) { positionRef.current = target; setPosition(target); return; }
    busy.current = true;
    const next = { from, to: target, direction: target > from ? 'forward' : 'backward', single: mobile };
    turnRef.current = next;
    setTurn(next);
    // The animation event commits the page; a bounded fallback also handles
    // suspended tabs or browsers that do not dispatch an animation-end event.
    later(settle, mobile ? 640 : 840);
  }
  function step(direction) {
    goTo(mobile ? positionRef.current + direction : (Math.floor(positionRef.current / 2) + direction) * 2);
  }
  function onKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); goTo(event.key === 'Home' ? 0 : pageCount - (mobile ? 1 : 2)); }
    if (event.key === 'Escape' && opened) { event.preventDefault(); closeBook(); }
  }
  function startSwipe(event) {
    if (event.pointerType === 'mouse' || !event.isPrimary || event.target.closest('button,a')) { touch.current = null; return; }
    touch.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function finishSwipe(event) {
    const start = touch.current;
    touch.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const threshold = Math.max(36, event.currentTarget.clientWidth * .12);
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.35 && performance.now() - start.time < 1600) step(dx < 0 ? 1 : -1);
  }
  function renderLeaf(index, side) {
    return <Leaf index={index} side={side} />;
  }
  function renderPosition(index) {
    return renderLeaf(Math.floor(index / 2), index % 2 ? 'right' : 'left');
  }
  const fromChapter = turn ? Math.floor(turn.from / 2) : chapter;
  const toChapter = turn ? Math.floor(turn.to / 2) : chapter;
  const leftPage = turn && !mobile ? (turn.direction === 'forward' ? fromChapter : toChapter) : chapter;
  const rightPage = turn && !mobile ? (turn.direction === 'forward' ? toChapter : fromChapter) : chapter;
  const blocked = opening || !!turn;
  const atStart = mobile ? position === 0 : chapter === 0;
  const atEnd = mobile ? position === pageCount - 1 : chapter === spreads.length - 1;
  return <section className="memory-scrapbook" onKeyDown={onKeyDown} aria-label="Oma’s birthday scrapbook">
    <div className="experience-title"><h1>Our <em>scrapbook</em></h1></div>
    {mobile && showViewingNote && <aside className="memory-viewing-note" aria-label="Viewing recommendation"><p>For the fullest experience, explore on a bigger screen. But wherever you are, enjoy every little moment. <Icon name="heart" size={13} /></p><button type="button" aria-label="Dismiss viewing recommendation" onClick={() => { setShowViewingNote(false); later(() => (opened ? book.current : coverButton.current)?.focus({ preventScroll: true }), 0); }}><Icon name="close" size={17} /></button></aside>}
    <div className={`memory-stage ${opened ? 'is-open' : 'is-closed'} ${opening ? 'is-opening' : ''}`}>
      {opened && <div ref={book} className="memory-book" tabIndex={0} role="group" aria-label={mobile ? 'Open scrapbook, one page at a time' : 'Open scrapbook, two-page chapter spread'} aria-describedby="memory-help" aria-busy={blocked} data-page={position + 1} data-chapter={chapter + 1} style={{ '--turn-duration': mobile ? '560ms' : '760ms' }} onPointerDown={startSwipe} onPointerUp={finishSwipe} onPointerCancel={() => { touch.current = null; }} onLostPointerCapture={() => { touch.current = null; }}>
        <div className={`memory-spread${mobile ? ' memory-spread--single' : ''}`} inert={blocked}>
          {mobile ? renderPosition(turn ? turn.to : position) : <>{renderLeaf(leftPage, 'left')}{renderLeaf(rightPage, 'right')}</>}
        </div>
        <div className="memory-spine" aria-hidden="true" />
        {turn && <div className={`memory-turn turn-${turn.direction}${turn.single ? ' memory-turn--single' : ''}`} aria-hidden="true" onAnimationEnd={event => { if ((!turn.single && event.target === event.currentTarget) || (turn.single && event.target.classList.contains('turn-back'))) settle(); }}><div className="turn-face turn-front">{turn.single ? renderPosition(turn.from) : renderLeaf(fromChapter, turn.direction === 'forward' ? 'right' : 'left')}</div><div className="turn-face turn-back">{turn.single ? renderPosition(turn.to) : renderLeaf(toChapter, turn.direction === 'forward' ? 'left' : 'right')}</div></div>}
        <button type="button" className="memory-flip memory-flip--previous" aria-label={mobile ? 'Previous page' : 'Previous chapter'} title={mobile ? 'Previous page' : 'Previous chapter'} disabled={atStart || blocked} onClick={() => step(-1)}><Icon name="arrowLeft" size={18} /></button>
        <button type="button" className="memory-flip memory-flip--next" aria-label={mobile ? 'Next page' : 'Next chapter'} title={mobile ? 'Next page' : 'Next chapter'} disabled={atEnd || blocked} onClick={() => step(1)}><Icon name="arrowRight" size={18} /></button>
      </div>}
      {(!opened || opening) && <div className={`memory-cover ${opening ? 'cover-opening' : ''}`} onAnimationEnd={event => { if (opening && event.target === event.currentTarget) finishOpening(); }}>
        <div className="cover-border"><span className="cover-kicker">ADE’S GIFT TO OMA</span><span className="cover-ornament"><Icon name="sparkle" size={35} /></span><span className="cover-name">Chapter<br /><em>Twenty</em></span><span className="cover-rule" /><span className="cover-dedication">One in a Million</span><span className="cover-date">24 OCTOBER 2026</span>
          {!opening && <button ref={coverButton} className="cover-open-button" onClick={openBook}>Open your scrapbook <Icon name="arrowRight" size={17} /></button>}
          <span className="cover-signature">with love, Ade</span>
        </div>
      </div>}
    </div>
    {opened ? <>
      <div className="memory-progress"><span className="memory-chapter-status" role="status" aria-live="polite" aria-atomic="true"><span>Chapter {chapter + 1} of {spreads.length}</span>{mobile && <small>{position % 2 ? 'Right page' : 'Left page'} · {position + 1} / {pageCount}</small>}</span><div className="memory-chapters" role="group" aria-label="Choose a scrapbook chapter">{spreads.map((spread, index) => <button type="button" key={spread.id} onClick={() => goTo(index * 2)} disabled={blocked} aria-label={`Chapter ${index + 1}: ${spread.title}`} aria-pressed={chapter === index}>{String(index + 1).padStart(2, '0')}</button>)}</div></div>
      <p id="memory-help" className="memory-help">{mobile ? 'Swipe or tap a page corner to turn.' : 'Turn a page corner or use the arrow keys.'}</p>
      <div className="memory-exits"><button type="button" onClick={closeBook}>Close the scrapbook</button><a href="#/room"><Icon name="arrowLeft" size={15} />Back to your room</a></div>
    </> : null}
  </section>;
}
