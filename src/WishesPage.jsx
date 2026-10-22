import { useEffect, useMemo, useRef, useState } from 'react';
import { campaign, wishes } from './data/wishes';
import { useSoundtrack } from './components/soundtrack-context';
import { useModalScrollLock } from './components/useModalScrollLock';

function Icon({ kind, ...props }) {
  const paths = {
    arrow: <><path d="M4 12h15M13 5l7 7-7 7" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    share: <><path d="M12 16V3m-5 5 5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
    book: <><path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1ZM12 5v15" /></>,
    star: <path d="m12 2 2.9 6 6.6.9-4.8 4.7 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6L2.7 8.9l6.4-.9Z" />,
  };
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[kind]}</svg>;
}

export default function WishesPage() {
  const { music, loading, toggleMusic } = useSoundtrack();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('original');
  const [visible, setVisible] = useState(6);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const dialog = useRef(null);
  const lastFocus = useRef(null);
  const timer = useRef(null);
  const hasPicks = wishes.some(wish => wish.featured);
  useModalScrollLock(!!selected);
  const filters = [['all', 'All wishes'], ['heartfelt', 'Heartfelt'], ['playful', 'Funny'], ...(hasPicks ? [['favourites', 'Ade’s picks']] : [])];
  const results = useMemo(() => wishes.filter(w => {
    const matchesFilter = filter === 'all' || (filter === 'favourites' ? w.featured : w.tag === filter);
    return matchesFilter && `${w.name} ${w.message}`.toLowerCase().includes(query.toLowerCase().trim());
  }).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : 0), [filter, query, sort]);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (window.location.hash.includes('#collection')) document.getElementById('collection')?.scrollIntoView({ behavior: 'instant' });
  }, []);
  useEffect(() => {
    const modal = dialog.current;
    if (selected && modal && !modal.open) modal.showModal();
    if (!selected && modal?.open) modal.close();
  }, [selected]);

  function toast(message) {
    setNotice(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(''), 4500);
  }
  function openWish(wish, event) { lastFocus.current = event.currentTarget; setSelected(wish); }
  function closeWish() { setSelected(null); lastFocus.current?.focus({ preventScroll: true }); }
  function goToPost() {
    if (campaign.postUrl) window.open(campaign.postUrl, '_blank', 'noopener,noreferrer');
  }
  async function shareCampaign() {
    if (!campaign.postUrl) return;
    try {
      if (navigator.share) await navigator.share({ title: 'Birthday wishes for Oma', text: 'Wish Oma a happy twentieth birthday.', url: campaign.postUrl });
      else { await navigator.clipboard.writeText(campaign.postUrl); toast('Birthday post link copied.'); }
    } catch (error) { if (error.name !== 'AbortError') toast('Please copy the birthday post link from your browser.'); }
  }
  function changeFilter(value) { setFilter(value); setVisible(6); }
  function browseWishes(event) {
    event.preventDefault();
    window.location.hash = '/wishes#collection';
    document.getElementById('collection')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#/room" aria-label="Oma, Chapter Twenty home">OMA<span>CHAPTER TWENTY</span></a>
        <nav aria-label="Main navigation"><a href="#/room">Your room</a><a href="#/wishes#collection" onClick={browseWishes}>The wishes</a><button className="header-share music-toggle" onClick={toggleMusic} aria-pressed={music}>♫ {loading ? 'Loading…' : music ? 'Sound on' : 'Sound off'}</button>{campaign.postUrl && <button className="header-share" onClick={shareCampaign}><Icon kind="share" /> Share the birthday post</button>}</nav>
      </header>

      <main id="top" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow"><span /> YOUR TWENTIETH BIRTHDAY <span /></span>
            <h1 id="hero-title">Your birthday<br /><em>wishes</em></h1>
            <p className="hero-subtitle">I asked a few friends to wish you a happy birthday.<br />They sent these for you.</p>
            <a className="primary-button" href="#/wishes#collection" onClick={browseWishes}>Read your birthday wishes <Icon kind="arrow" /></a>
            {campaign.postUrl && <button className="browse-link text-button" onClick={goToPost}><Icon kind="heart" /> Add a birthday wish</button>}
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit" /><span className="art-spark spark-one">✧</span><span className="art-spark spark-two">✧</span>
            <div className="paper-note note-back"><span>24 October 2026</span><p>Oma,<br />Chapter<br />Twenty.</p><span className="note-heart">♡</span></div>
            <div className="paper-note note-front"><span className="paper-label">FOR MY OMA</span><p>Happy twentieth,<br /><em>my one<br />in a million.</em></p><div className="paper-footer"><span>With love, Ade</span><Icon kind="heart" /></div></div>
            <div className="envelope"><div className="envelope-fold" /><div className="wax-seal">O</div></div>
          </div>
        </section>

        <section className="collection" id="collection" aria-labelledby="collection-title">
          <div className="collection-heading"><div><h2 id="collection-title">Your birthday wishes<span>♡</span></h2></div><span className="scrapbook-label"><Icon kind="heart" /> Happy twentieth, Oma.</span></div>
          <div className="collection-controls">
            <div className="filter-tabs" role="group" aria-label="Filter wishes">{filters.map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'active' : ''} onClick={() => changeFilter(value)}>{label}</button>)}</div>
            <div className="search-sort"><label className="search-field"><Icon kind="search" /><input type="search" placeholder="Search names or wishes" aria-label="Search wishes" value={query} onChange={e => { setQuery(e.target.value); setVisible(6); }} /></label><select aria-label="Sort wishes" value={sort} onChange={e => { setSort(e.target.value); setVisible(6); }}><option value="original">As collected</option><option value="name">Name A–Z</option><option value="newest">Newest first</option></select></div>
          </div>
          <p className="result-count" aria-live="polite">{results.length} {results.length === 1 ? 'wish' : 'wishes'}{query && ` matching “${query}”`}</p>
          <div className="wish-grid">{results.slice(0, visible).map((wish, index) => <button className={`wish-card card-${wish.color}`} key={wish.id} onClick={event => openWish(wish, event)} aria-label={`Read birthday wish from ${wish.name}`} style={{ animationDelay: `${Math.min(index, 5) * 55}ms` }}>
            <div className="wish-author"><span className={`avatar avatar-${wish.color}`}>{wish.initials}</span><span><strong>{wish.name}</strong></span></div>
            <p className="wish-message">{wish.message}</p>
            <div className="wish-footer"><span><Icon kind="heart" width="14" height="14" /></span><span className="read-note">Read the wish <Icon kind="arrow" width="15" height="15" /></span></div>
          </button>)}</div>
          {results.length === 0 && <div className="empty-state"><Icon kind="search" width="32" height="32" /><h3>No matching wishes</h3><p>Try a name or another word.</p><button className="text-button" onClick={() => { setQuery(''); changeFilter('all'); }}>Show all wishes</button></div>}
          {visible < results.length && <button className="load-button" onClick={() => setVisible(v => v + 6)}>Read more wishes <Icon kind="arrow" /></button>}
        </section>

        <section className="closing-note"><h2>I love you,<br /><em>Oma.</em></h2><p>I left you a letter for today, and three for whenever you need them.</p><a className="primary-button" href="#/letters">Open my letters <Icon kind="arrow" /></a></section>
      </main>
      <footer className="site-footer"><span>OMA <span className="footer-divider">/</span> CHAPTER TWENTY</span><span>With love, Ade. <Icon kind="heart" width="14" height="14" /></span></footer>
      <div className={`toast ${notice ? 'visible' : ''}`} role="status">{notice}</div>
      <dialog ref={dialog} className="wish-dialog" aria-label="Birthday wish" onCancel={closeWish} onClose={() => { if (selected) closeWish(); }} onClick={event => { if (event.target === event.currentTarget) closeWish(); }}>
        {selected && <div className="dialog-paper"><button className="dialog-close" onClick={closeWish} aria-label="Close wish"><Icon kind="close" /></button><span className="eyebrow">A BIRTHDAY WISH FOR OMA</span><span className={`avatar avatar-${selected.color}`}>{selected.initials}</span><h2>Happy twentieth, Oma.</h2><p className="dialog-message">{selected.message}</p><div className="dialog-signature"><span>From</span><strong>{selected.name}</strong></div><div className="dialog-bottom"><Icon kind="heart" /> 24 October · Chapter Twenty</div></div>}
      </dialog>
    </div>
  );
}
