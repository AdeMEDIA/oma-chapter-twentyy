import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { birthday, letters, littleNotes, portraitNotes } from '../data/birthday';
import { useModalScrollLock } from './useModalScrollLock';
import FilmPlayer from './FilmPlayer';
import BirthdayRoom from './BirthdayRoom';
import Icon from './Icon';
import HeaderAudio from './HeaderAudio';
import CandleCelebration from './CandleCelebration';
import ResponsiveImage from './ResponsiveImage';

const Scrapbook = lazy(() => import('./Scrapbook'));

const pageNames = { letters: 'Letters for you', portrait: 'Through Ade’s eyes', film: 'Your birthday film', cake: 'Make a wish', gift: 'Your surprise', notes: '20 little notes', scrapbook: 'The scrapbook' };
function readLocal(key, fallback) { try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) : fallback; } catch { return fallback; } }
function writeLocal(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
function Frame({ image, label }) { return image ? <ResponsiveImage src={image} sizes="(max-width:650px) 82vw, 40vw" alt={label} width="960" height="1280" decoding="async" /> : <div className="photo-placeholder"><span>O</span><p>{label}</p></div>; }
export default function BirthdayExperience({ route }) {
  const [cakeImageFailed, setCakeImageFailed] = useState(false);
  const [letter, setLetter] = useState(null);
  const [wish, setWish] = useState(() => { const saved = readLocal('oma-birthday-wish-v1', ''); return typeof saved === 'string' ? saved : ''; });
  const [wishStatus, setWishStatus] = useState('');
  const [celebrated, setCelebrated] = useState(false);
  const [openedGift, setOpenedGift] = useState(false);
  const [found, setFound] = useState(() => {
    const saved = readLocal('oma-notes-v1', []);
    return Array.isArray(saved) ? [...new Set(saved.filter(id => Number.isInteger(id) && id > 0 && id <= 20))] : [];
  });
  const [note, setNote] = useState(null);
  const letterDialog = useRef(null);
  const noteDialog = useRef(null);
  const lastFocus = useRef(null);
  useModalScrollLock(!!((letter && route === 'letters') || (note && route === 'notes')));

  useEffect(() => {
    if (letter && route === 'letters' && !letterDialog.current?.open) letterDialog.current?.showModal();
    if ((!letter || route !== 'letters') && letterDialog.current?.open) letterDialog.current.close();
  }, [letter, route]);
  useEffect(() => {
    if (note && route === 'notes' && !noteDialog.current?.open) noteDialog.current?.showModal();
    if ((!note || route !== 'notes') && noteDialog.current?.open) noteDialog.current.close();
  }, [note, route]);
  function closeDialog(which) {
    const modal = which === 'letter' ? letterDialog.current : noteDialog.current;
    // Release the native modal's inert background before restoring its trigger.
    if (modal?.open) modal.close();
    if (which === 'letter') setLetter(null); else setNote(null);
    const returnTo = lastFocus.current;
    queueMicrotask(() => { if (returnTo?.isConnected) returnTo.focus({ preventScroll: true }); });
  }
  function discover(item, event) {
    lastFocus.current = event.currentTarget;
    setNote(item);
    if (!found.includes(item.id)) { const next = [...found, item.id]; setFound(next); writeLocal('oma-notes-v1', next); }
  }

  return <div className={`birthday-shell ${route === 'room' ? 'room-focused' : ''}`}>
    <header className="birthday-header"><a className="wordmark" href="#/room" aria-label="Oma, Chapter Twenty home">OMA<span>CHAPTER TWENTY</span></a><nav className="birthday-nav" aria-label="Main navigation"><a href="#/wishes">Birthday wishes</a><HeaderAudio /></nav></header>
    {route !== 'room' && <div className="experience-breadcrumb"><a href="#/room"><Icon name="arrowLeft" size={16} /> Back to your room</a><span>{pageNames[route]}</span></div>}

    <main tabIndex={-1}>
    {route === 'room' && <BirthdayRoom foundCount={found.length} />}

    {route === 'scrapbook' && <Suspense fallback={<div className="page-loading" role="status">Opening your scrapbook…</div>}><Scrapbook /></Suspense>}

    {route === 'letters' && <section className="letters-page"><div className="experience-title" data-reveal><span className="eyebrow">WITH LOVE, ADE</span><h1>Letters <em>for you</em></h1><p>I wrote one for your birthday and three for when you need them.</p></div><div className="letter-grid">{letters.map((item, i) => <button key={item.id} className="letter-envelope" data-reveal onClick={e => { lastFocus.current = e.currentTarget; setLetter(item); }}><span className="envelope-number">0{i + 1}</span><div className="letter-seal">O</div><h2>{item.title}</h2><p>{item.subtitle}</p><span className="letter-open">Open your letter <Icon name="arrowRight" size={15} /></span></button>)}</div></section>}

    {route === 'portrait' && <section className="portrait-page"><div className="large-portrait" data-reveal><Frame image={birthday.portrait} label="Oma, through Ade’s eyes" /></div><div className="portrait-copy" data-reveal><h1>Through<br /><em>my eyes</em></h1><p>Here are a few things I love about you.</p>{portraitNotes.map((item, i) => <details key={item.title}><summary><span>0{i + 1}</span>{item.title}<span><Icon name="plus" size={17} /></span></summary><p>{item.body}</p></details>)}</div></section>}

    {route === 'film' && <section className="film-page"><div className="experience-title" data-reveal><span className="eyebrow">FOR OMA, FROM ADE</span><h1>Oma <em>on film</em></h1></div><FilmPlayer /><div className="cinema-ticket" data-reveal><span>ADMIT ONE</span><strong>OMA · CHAPTER TWENTY</strong><span>24 OCTOBER 2026</span></div></section>}

    {route === 'cake' && <section className="cake-page">
      <CandleCelebration active={celebrated} />
      <div className="experience-title" data-reveal><span className="eyebrow">OMA · 24 OCTOBER 2026</span><h1>{celebrated ? <>Happy birthday,<br /><em>Oma.</em></> : <>Close your eyes.<br /><em>Make a wish.</em></>}</h1><p>{celebrated ? 'Happy twentieth, my one in a million.' : 'Make a wish for your twentieth birthday.'}</p></div>
      <figure className={`birthday-cake photo-cake ${!birthday.cake || cakeImageFailed ? 'room-cake' : ''} ${celebrated ? 'candles-out' : ''}`} aria-label={celebrated ? 'Oma’s twentieth birthday cake, candles extinguished' : 'Oma’s twentieth birthday cake with lit candles'}>
        <div className="photo-candles" aria-hidden="true"><span className="photo-candle"><i /></span><span className="photo-candle"><i /></span></div>
        {birthday.cake && !cakeImageFailed ? <img src={birthday.cake} onError={() => setCakeImageFailed(true)} alt="Oma’s twentieth birthday cake." /> : <div className="cake-room-detail"><img src="/images/room/birthday-room.webp" alt="The white birthday cake from Oma’s room, with the message: Not you turning 20 in this economy." /></div>}
        <figcaption>Not you turning twenty in this economy</figcaption>
      </figure>
      {!celebrated ? <button className="primary-button" onClick={() => setCelebrated(true)}>Blow out your candles <Icon name="candle" size={19} /></button> : <div className="birthday-celebration" role="status"><span aria-hidden="true"><Icon name="sparkle" size={20} /><Icon name="heart" size={27} /><Icon name="sparkle" size={20} /></span><p>Happy birthday, Oma. I love you.</p><button className="text-button" onClick={() => setCelebrated(false)}>Light the candles again</button></div>}
      <form className="wish-journal" data-reveal onSubmit={e => { e.preventDefault(); if (!wish.trim()) { setWishStatus('Write your wish first.'); return; } setWishStatus(writeLocal('oma-birthday-wish-v1', wish.trim()) ? 'Your wish is saved in this browser.' : 'Your wish couldn’t be saved here. Download it to keep a copy.'); }}>
        <label htmlFor="birthday-wish">My first wish at twenty</label><textarea id="birthday-wish" value={wish} onChange={e => setWish(e.target.value)} placeholder="At twenty, I want…" maxLength={1500} />
        <div><button className="journal-save" type="submit">Keep my wish</button><button type="button" className="text-button" disabled={!wish.trim()} onClick={() => { const url = URL.createObjectURL(new Blob([`Oma · Chapter Twenty\n\n${wish}`], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = 'my-chapter-twenty-wish.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}>Download a copy</button></div>
        <small>This wish is just for you. It stays in this browser.</small><p role="status">{wishStatus}</p>
      </form>
    </section>}

    {route === 'gift' && birthday.giftDetail && <section className="gift-page"><div className="experience-title"><span className="eyebrow">FROM ADE, TO OMA</span><h1>For you,<br /><em>my love.</em></h1><p>{openedGift ? 'With love, Ade.' : 'Untie your ribbon.'}</p></div><button className={`big-gift ${openedGift ? 'gift-open' : ''}`} onClick={() => setOpenedGift(!openedGift)} aria-label={openedGift ? 'Wrap the gift again' : 'Unwrap your birthday gift'} aria-expanded={openedGift}><span className="gift-bow">⌁</span><span className="gift-lid" /><span className="gift-box"><span>O</span></span></button>{openedGift && <div className="gift-message" role="status"><h2>{birthday.gift || 'For you, Oma.'}</h2><p>{birthday.giftDetail}</p><span>With love, Ade.</span></div>}</section>}

    {route === 'notes' && <section className="notes-page"><div className="experience-title" data-reveal><h1>20 little <em>notes</em></h1><p>{found.length} of 20 opened. Pick any number.</p></div><div className="notes-grid">{littleNotes.map(item => <button key={item.id} data-reveal onClick={event => discover(item, event)} className={found.includes(item.id) ? 'note-found' : ''}><span>{String(item.id).padStart(2, '0')}</span><span>{found.includes(item.id) ? <>Read again <Icon name="heart" size={14} /></> : <>Open your note <Icon name="arrowRight" size={14} /></>}</span></button>)}</div></section>}
    </main>
    <footer className="birthday-footer"><span>For Oma. With love, Ade.</span><a href="#/wishes">Read your birthday wishes <Icon name="arrowRight" size={15} /></a></footer>
    <dialog ref={letterDialog} className="wish-dialog letter-dialog" aria-label="Letter for Oma" onCancel={() => closeDialog('letter')} onClose={() => { if (letter) closeDialog('letter'); }} onClick={e => { if (e.currentTarget === e.target) closeDialog('letter'); }}>{letter && <div className="dialog-paper"><button className="dialog-close" onClick={() => closeDialog('letter')} aria-label="Close letter"><Icon name="close" size={20} /></button><span className="eyebrow">A LETTER FOR OMA</span><h2>{letter.title}</h2><p className="letter-body">{letter.body}</p></div>}</dialog>
    <dialog ref={noteDialog} className="wish-dialog" aria-label="Little note for Oma" onCancel={() => closeDialog('note')} onClose={() => { if (note) closeDialog('note'); }} onClick={e => { if (e.currentTarget === e.target) closeDialog('note'); }}>{note && <div className="dialog-paper"><button className="dialog-close" onClick={() => closeDialog('note')} aria-label="Close note"><Icon name="close" size={20} /></button><span className="eyebrow">{note.title}</span><p className="dialog-message">{note.body}</p><span className="note-signature">With love, Ade <Icon name="heart" size={15} /></span></div>}</dialog>
  </div>;
}
