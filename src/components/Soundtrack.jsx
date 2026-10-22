import { useCallback, useEffect, useRef, useState } from 'react';
import { birthday } from '../data/birthday';
import { SoundtrackContext } from './soundtrack-context';
import './soundtrack.css';

function musicStartsOn() {
  try { return localStorage.getItem('oma-music-preference-v1') !== 'off'; } catch { return true; }
}
function rememberMusic(enabled) {
  try { localStorage.setItem('oma-music-preference-v1', enabled ? 'on' : 'off'); } catch { /* Playback still works without storage. */ }
}

export default function SoundtrackProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState('idle');
  const [awaitingGesture, setAwaitingGesture] = useState(musicStartsOn);
  const audio = useRef(null);
  const wantsPlayback = useRef(false);
  const playAttempt = useRef(0);
  const trigger = useRef(null);
  const panel = useRef(null);
  const hideTimer = useRef(null);
  const music = status === 'playing';
  const loading = status === 'loading' || status === 'buffering';
  const track = birthday.soundtrack;

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      const card = panel.current;
      // Keep keyboard controls available until focus leaves the card.
      if (card?.querySelector(':focus-visible')) return;
      if (card?.contains(document.activeElement)) {
        const returnTo = trigger.current?.isConnected ? trigger.current : document.querySelector('.birthday-nav button, .site-header button[aria-pressed]');
        returnTo?.focus({ preventScroll: true });
      }
      setVisible(false);
    }, 4000);
  }, []);

  const showCard = useCallback(() => {
    setVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const pauseMusic = useCallback(() => {
    playAttempt.current += 1;
    wantsPlayback.current = false;
    audio.current?.pause();
    setAwaitingGesture(false);
    setStatus('paused');
    rememberMusic(false);
    showCard();
  }, [showCard]);

  useEffect(() => {
    const element = audio.current;
    return () => { clearTimeout(hideTimer.current); playAttempt.current += 1; wantsPlayback.current = false; element?.pause(); };
  }, []);

  useEffect(() => {
    if (!music) return;
    const reminder = setInterval(() => { if (!document.hidden && wantsPlayback.current) showCard(); }, 30000);
    return () => clearInterval(reminder);
  }, [music, showCard]);

  const startMusic = useCallback(() => {
    setAwaitingGesture(false);
    showCard();
    const element = audio.current;
    const attempt = ++playAttempt.current;
    wantsPlayback.current = true;
    setStatus('loading');
    element.volume = 0.35;
    if (element.error) element.load();
    // Keep play() directly in the tap handler so phones can start the music.
    element.play().catch(() => {
      if (attempt !== playAttempt.current || !wantsPlayback.current) return;
      wantsPlayback.current = false;
      clearTimeout(hideTimer.current);
      setVisible(true);
      setStatus('error');
    });
  }, [showCard]);

  useEffect(() => {
    if (!awaitingGesture) return;
    const begin = event => {
      if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Escape' || event.altKey || event.ctrlKey || event.metaKey)) return;
      if (event.target.closest?.('.birthday-nav button, .music-toggle, .spot-record, .soundtrack-panel')) return;
      // A real tap/key press permits sound on mobile without forcing autoplay.
      if (!wantsPlayback.current) startMusic();
    };
    document.addEventListener('click', begin);
    document.addEventListener('keydown', begin);
    return () => { document.removeEventListener('click', begin); document.removeEventListener('keydown', begin); };
  }, [awaitingGesture, startMusic]);

  function toggleMusic(event) {
    if (event?.currentTarget && !event.currentTarget.closest('.soundtrack-panel')) trigger.current = event.currentTarget;
    if (music || wantsPlayback.current) { pauseMusic(); return; }
    rememberMusic(true);
    startMusic();
  }

  function closeMusic() {
    pauseMusic();
    clearTimeout(hideTimer.current);
    if (audio.current) audio.current.currentTime = 0;
    setVisible(false);
    setStatus('idle');
    const returnTo = trigger.current?.isConnected ? trigger.current : document.querySelector('.birthday-nav button, .site-header button[aria-pressed]');
    returnTo?.focus({ preventScroll: true });
    clearTimeout(hideTimer.current);
  }

  return <SoundtrackContext.Provider value={{ music, loading, toggleMusic }}>
    {children}
    <audio ref={audio} src={birthday.song} preload="none" loop playsInline
      onPlaying={() => { if (!wantsPlayback.current) { audio.current.pause(); return; } setStatus('playing'); showCard(); }}
      onWaiting={() => { if (wantsPlayback.current) setStatus('buffering'); }}
      onPause={() => { if (audio.current.paused) { wantsPlayback.current = false; setStatus(audio.current.error ? 'error' : 'paused'); } }}
      onError={() => { wantsPlayback.current = false; clearTimeout(hideTimer.current); setVisible(true); setStatus('error'); }} />
    {visible && <aside ref={panel} className="soundtrack-panel" aria-label="Orente music player"
      onPointerMove={scheduleHide} onPointerDown={scheduleHide}
      onFocus={event => { if (event.target.matches(':focus-visible')) clearTimeout(hideTimer.current); }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) scheduleHide(); }}
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); closeMusic(); } }}>
      <div className="soundtrack-heading"><div><span>FOR MY ONE IN A MILLION</span><strong>{track.title} <small>· {track.artist}</small></strong></div><button type="button" onClick={closeMusic} aria-label="Close music player and stop music">×</button></div>
      <div className="soundtrack-keepsake"><span aria-hidden="true">♫</span><p>Nkem, you’re one in a million.</p></div>
      <div className="soundtrack-controls"><button type="button" onClick={toggleMusic} aria-label={music || loading ? 'Pause Orente' : 'Play Orente'}>{status === 'error' ? 'Try again' : music || loading ? 'Ⅱ Pause' : '▷ Play'}</button><span role="status">{status === 'error' ? 'Orente couldn’t play. Tap Try again.' : loading ? 'Loading Orente…' : music ? 'Orente is playing.' : 'Paused. Press play to listen.'}</span></div>
    </aside>}
  </SoundtrackContext.Provider>;
}
