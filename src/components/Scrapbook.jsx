import { useEffect, useRef, useState } from 'react';
import { spreads } from '../data/birthday';
import './scrapbook.css';

function Photo({ image, aspect, alt }) {
  const [failed, setFailed] = useState(false);
  return <div className="memory-photo">
      <span className={`memory-photo-mount ${aspect ? 'has-photo-aspect' : ''}`} style={aspect ? { aspectRatio: aspect } : undefined}>
      <span className="memory-corner corner-tl" /><span className="memory-corner corner-tr" />
      <span className="memory-corner corner-bl" /><span className="memory-corner corner-br" />
      {image && !failed ? <img src={image} alt={alt} decoding="async" onError={() => setFailed(true)} /> : <span className="memory-placeholder"><small>Photo unavailable</small></span>}
      </span>
  </div>;
}

function Leaf({ index, side }) {
  const spread = spreads[index];
  // Retain the reserved rows so removing the copy does not resize the book.
  return <div className={`memory-leaf memory-${side} layout-${index % 3}`}>
    {side === 'left' ? <>
      <span aria-hidden="true" /><h2>{spread.title}</h2>
      <Photo key={`${index}-left`} image={spread.image} aspect={spread.imageAspect} alt={spread.imageAlt} />
      <span aria-hidden="true" />
    </> : <>
      <span className="memory-date">CHAPTER TWENTY · {String(index + 1).padStart(2, '0')}</span>
      <span aria-hidden="true" />
      <Photo key={`${index}-right`} image={spread.image2} aspect={spread.image2Aspect} alt={spread.image2Alt} />
      <span aria-hidden="true" />
    </>}
    <span className="memory-page-number">{String(index * 2 + (side === 'left' ? 1 : 2)).padStart(2, '0')}</span>
  </div>;
}

export default function Scrapbook() {
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState(null);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 800px)').matches);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const timers = useRef([]);
  const busy = useRef(false);
  const book = useRef(null);
  const coverButton = useRef(null);
  const touch = useRef(null);

  useEffect(() => {
    const pendingTimers = timers.current;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const smallScreen = window.matchMedia('(max-width: 800px)');
    const update = () => setReducedMotion(media.matches);
    const updateSize = () => setMobile(smallScreen.matches);
    media.addEventListener('change', update);
    smallScreen.addEventListener('change', updateSize);
    return () => { media.removeEventListener('change', update); smallScreen.removeEventListener('change', updateSize); pendingTimers.forEach(clearTimeout); };
  }, []);
  function later(callback, delay) { timers.current.push(setTimeout(callback, delay)); }
  function openBook() {
    if (busy.current || opened) return;
    busy.current = true;
    setOpened(true);
    setOpening(!reducedMotion);
    later(() => { setOpening(false); busy.current = false; book.current?.focus({ preventScroll: true }); }, reducedMotion ? 0 : 1000);
  }
  function closeBook() {
    if (busy.current) return;
    setOpened(false);
    later(() => coverButton.current?.focus({ preventScroll: true }), 0);
  }
  function goTo(target) {
    if (!opened || busy.current || target === page || target < 0 || target >= spreads.length) return;
    book.current?.focus({ preventScroll: true });
    if (reducedMotion) { setPage(target); return; }
    busy.current = true;
    setTurn({ from: page, to: target, direction: target > page ? 'forward' : 'backward' });
    later(() => setPage(target), 460);
    later(() => { setTurn(null); busy.current = false; }, 920);
  }
  function onKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    const target = { ArrowRight: page + 1, ArrowLeft: page - 1, Home: 0, End: spreads.length - 1 }[event.key];
    if (target !== undefined) { event.preventDefault(); goTo(target); }
    if (event.key === 'Escape' && opened) { event.preventDefault(); closeBook(); }
  }
  function renderLeaf(index, side) {
    return <Leaf index={index} side={side} />;
  }
  // The moving leaf reveals the next page underneath; the opposite page stays
  // in place until the leaf lands. Phone layouts swap at the fade midpoint.
  const leftPage = turn && !mobile ? (turn.direction === 'forward' ? turn.from : turn.to) : page;
  const rightPage = turn && !mobile ? (turn.direction === 'forward' ? turn.to : turn.from) : page;
  return <section className="memory-scrapbook" onKeyDown={onKeyDown} aria-label="Oma’s birthday scrapbook">
    <div className="experience-title"><h1>Our <em>scrapbook</em></h1></div>
    <div className={`memory-stage ${opened ? 'is-open' : 'is-closed'} ${opening ? 'is-opening' : ''}`}>
      {opened && <div ref={book} className="memory-book" tabIndex={0} role="group" aria-label="Open scrapbook. Use left and right arrow keys to turn pages." aria-busy={opening || !!turn}
        onTouchStart={event => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
        onTouchEnd={event => { if (!touch.current) return; const dx = event.changedTouches[0].clientX - touch.current.x; const dy = event.changedTouches[0].clientY - touch.current.y; if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) goTo(page + (dx < 0 ? 1 : -1)); touch.current = null; }} onTouchCancel={() => { touch.current = null; }}>
        <div className="memory-spread" inert={opening || !!turn}>{renderLeaf(leftPage, 'left')}{renderLeaf(rightPage, 'right')}</div>
        <div className="memory-spine" aria-hidden="true" />
        {turn && <div className={`memory-turn turn-${turn.direction}`} aria-hidden="true"><div className="turn-face turn-front">{renderLeaf(turn.from, turn.direction === 'forward' ? 'right' : 'left')}</div><div className="turn-face turn-back">{renderLeaf(turn.to, turn.direction === 'forward' ? 'left' : 'right')}</div></div>}
      </div>}
      {(!opened || opening) && <div className={`memory-cover ${opening ? 'cover-opening' : ''}`}>
        <div className="cover-border"><span className="cover-kicker">ADE’S GIFT TO OMA</span><span className="cover-ornament">✧</span><span className="cover-name">Chapter<br /><em>Twenty</em></span><span className="cover-rule" /><span className="cover-dedication">One in a Million</span><span className="cover-date">24 OCTOBER 2026</span>
          {!opening && <button ref={coverButton} className="cover-open-button" onClick={openBook}>Open your scrapbook <span>→</span></button>}
          <span className="cover-signature">with love, Ade</span>
        </div>
      </div>}
    </div>
    {opened ? <>
      <div className="memory-pagination"><button onClick={() => goTo(page - 1)} disabled={page === 0 || !!turn || opening}>← Previous</button><span role="status" aria-live="polite">Chapter {page + 1} of {spreads.length}</span><button onClick={() => goTo(page + 1)} disabled={page === spreads.length - 1 || !!turn || opening}>Next page →</button></div>
      <div className="memory-chapters" role="group" aria-label="Choose a scrapbook chapter">{spreads.map((spread, index) => <button key={spread.title} onClick={() => goTo(index)} disabled={!!turn || opening} aria-label={`Chapter ${index + 1}: ${spread.title}`} aria-pressed={page === index}>{String(index + 1).padStart(2, '0')}</button>)}</div>
      <p className="memory-help">Swipe or use ← → to turn pages.</p>
      <div className="memory-exits"><button onClick={closeBook} disabled={!!turn || opening}>Close the scrapbook</button><a href="#/room">← Back to your room</a></div>
    </> : null}
  </section>;
}
