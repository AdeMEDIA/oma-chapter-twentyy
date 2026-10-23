import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { birthday } from '../data/birthday';
import Icon from './Icon';
import { SoundtrackContext } from './soundtrack-context';
import WelcomeExperience from './WelcomeExperience';
import { useModalScrollLock } from './useModalScrollLock';
import './soundtrack.css';

const INTRO_KEY = 'oma-welcome-choice-v1';
const VOLUME_KEY = 'oma-soundtrack-volume-v1';

function rememberedIntro() {
  try {
    const choice = sessionStorage.getItem(INTRO_KEY);
    return choice === 'music' || choice === 'quiet' ? choice : null;
  } catch { return null; }
}

function rememberedVolume() {
  try {
    const stored = sessionStorage.getItem(VOLUME_KEY);
    const value = Number(stored);
    return stored !== null && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.35;
  } catch { return 0.35; }
}

export default function SoundtrackProvider({ children }) {
  const [introChoice, setIntroChoice] = useState(rememberedIntro);
  const [showWelcome, setShowWelcome] = useState(() => introChoice === null);
  const [welcomeClosing, setWelcomeClosing] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [music, setMusic] = useState(false);
  const [volume, setVolumeState] = useState(rememberedVolume);
  const [audioMuted, setAudioMuted] = useState(false);
  const [volumeSupported, setVolumeSupported] = useState(true);
  const audio = useRef(null);
  const wantsPlayback = useRef(false);
  const playAttempt = useRef(0);
  const trigger = useRef(null);
  const panel = useRef(null);
  const launcher = useRef(null);
  const focusPlayer = useRef(false);
  const restoreFocus = useRef(false);
  const introChosen = useRef(introChoice !== null);
  const loading = status === 'loading' || status === 'buffering';
  const muted = audioMuted || volume === 0;
  const introComplete = introChoice !== null;
  const entrancePhase = showWelcome ? (welcomeClosing ? 'entering' : 'welcome') : 'ready';
  const track = birthday.soundtrack;
  useModalScrollLock(playerOpen && !showWelcome);

  useEffect(() => {
    const element = audio.current;
    return () => {
      playAttempt.current += 1;
      wantsPlayback.current = false;
      element?.pause();
    };
  }, []);

  useEffect(() => {
    const element = audio.current;
    element.volume = volume;
    // iOS can delegate volume exclusively to the device's physical controls.
    if (Math.abs(element.volume - volume) > .01) {
      setVolumeState(element.volume);
      setVolumeSupported(false);
    }
    try { sessionStorage.setItem(VOLUME_KEY, String(volume)); } catch { /* The volume still works without storage. */ }
  }, [volume]);

  useLayoutEffect(() => {
    if (playerOpen && !showWelcome && !panel.current.open) panel.current.showModal();
    if ((!playerOpen || showWelcome) && panel.current.open) panel.current.close();
    if (playerOpen && focusPlayer.current) {
      focusPlayer.current = false;
      panel.current?.querySelector('[data-player-focus]')?.focus({ preventScroll: true });
    } else if (!playerOpen && restoreFocus.current) {
      restoreFocus.current = false;
      const header = document.querySelector('.header-orente');
      const fallback = launcher.current?.getClientRects().length ? launcher.current : header;
      const returnTo = trigger.current?.isConnected && trigger.current.getClientRects().length ? trigger.current : fallback;
      returnTo?.focus({ preventScroll: true });
    }
  }, [playerOpen, showWelcome]);

  const openPlayer = useCallback(event => {
    if (event?.currentTarget && !panel.current?.contains(event.currentTarget)) trigger.current = event.currentTarget;
    if (panel.current?.open) {
      panel.current.querySelector('[data-player-focus]')?.focus({ preventScroll: true });
    } else {
      focusPlayer.current = true;
      setPlayerOpen(true);
    }
  }, []);

  const closePlayer = useCallback(() => {
    restoreFocus.current = true;
    setPlayerOpen(false);
  }, []);

  const pauseMusic = useCallback(() => {
    playAttempt.current += 1;
    wantsPlayback.current = false;
    audio.current?.pause();
    setMusic(false);
    setStatus('paused');
  }, []);

  const startMusic = useCallback(() => {
    const element = audio.current;
    if (!element) return;
    const attempt = ++playAttempt.current;
    wantsPlayback.current = true;
    setStatus('loading');
    if (element.error) element.load();
    // This is called only by an explicit music control, within its user gesture.
    element.play().catch(() => {
      if (attempt !== playAttempt.current || !wantsPlayback.current) return;
      wantsPlayback.current = false;
      setMusic(false);
      setStatus('error');
    });
  }, []);

  const toggleMusic = useCallback(event => {
    if (event?.currentTarget && !panel.current?.contains(event.currentTarget)) trigger.current = event.currentTarget;
    if (wantsPlayback.current || (audio.current && !audio.current.paused)) {
      pauseMusic();
    } else startMusic();
  }, [pauseMusic, startMusic]);

  const setVolume = useCallback(nextVolume => {
    const value = Number(nextVolume);
    if (!Number.isFinite(value)) return;
    const clamped = Math.min(1, Math.max(0, value));
    if (audio.current) {
      audio.current.volume = clamped;
      setVolumeState(audio.current.volume);
      if (Math.abs(audio.current.volume - clamped) > .01) setVolumeSupported(false);
      if (clamped > 0) audio.current.muted = false;
      setAudioMuted(audio.current.muted);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const element = audio.current;
    if (!element) return;
    if (element.muted || element.volume === 0) {
      element.muted = false;
      if (element.volume === 0) setVolume(0.35);
    } else element.muted = true;
    setAudioMuted(element.muted);
  }, [setVolume]);

  const enterExperience = useCallback(withMusic => {
    if (introChosen.current) return;
    introChosen.current = true;
    const choice = withMusic ? 'music' : 'quiet';
    try { sessionStorage.setItem(INTRO_KEY, choice); } catch { /* The current visit still remembers the choice. */ }
    setIntroChoice(choice);
    setWelcomeClosing(true);
    if (withMusic) startMusic();
  }, [startMusic]);

  const finishWelcome = useCallback(() => { setShowWelcome(false); setWelcomeClosing(false); }, []);

  const statusMessage = status === 'error' ? 'Couldn’t play. Please try again.'
    : status === 'buffering' ? 'Buffering…'
    : loading ? 'Opening Orente…'
    : music ? (muted ? 'Playing with sound muted' : 'Orente is playing')
    : status === 'paused' ? 'Music paused'
    : 'Press play to listen';

  return <SoundtrackContext.Provider value={{ music, loading, toggleMusic, playerOpen, openPlayer, closePlayer, volume, setVolume, muted, toggleMute, status, introComplete, entrancePhase }}>
    <div className="experience-scroll">{children}</div>
    <audio ref={audio} src={birthday.song} preload="none" loop playsInline
      onPlay={() => {
        if (!wantsPlayback.current) { audio.current.pause(); return; }
        setMusic(true);
      }}
      onPlaying={() => {
        if (!wantsPlayback.current) { audio.current.pause(); return; }
        setMusic(true);
        setStatus('playing');
      }}
      onWaiting={() => { if (wantsPlayback.current) setStatus('buffering'); }}
      onPause={() => {
        if (audio.current.paused) {
          wantsPlayback.current = false;
          setMusic(false);
          setStatus(audio.current.error ? 'error' : 'paused');
        }
      }}
      onVolumeChange={() => {
        setVolumeState(audio.current.volume);
        setAudioMuted(audio.current.muted);
      }}
      onError={() => {
        wantsPlayback.current = false;
        setMusic(false);
        setStatus('error');
      }} />
    <dialog ref={panel} id="soundtrack-player" className="soundtrack-panel" aria-label="Orente music player" aria-describedby="soundtrack-hint" onCancel={event => { event.preventDefault(); closePlayer(); }}
      onClick={event => {
        if (event.target !== panel.current) return;
        const bounds = panel.current.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closePlayer();
      }}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          closePlayer();
        } else if (event.key === 'Tab') {
          const controls = [...panel.current.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href],[tabindex="0"]')].filter(control => control.getClientRects().length);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}>
      <div className="soundtrack-heading">
        <div className={`soundtrack-mark${music ? ' is-playing' : ''}`} aria-hidden="true"><Icon name="music" size={20} /></div>
        <div className="soundtrack-track"><span>{music ? 'NOW PLAYING' : 'THE SOUNDTRACK'}</span><strong>{track.title}</strong><small>{track.artist}</small></div>
        <button type="button" className="soundtrack-close" onClick={closePlayer} aria-label="Dismiss music player"><Icon name="close" size={18} /></button>
      </div>
      <div className="soundtrack-controls">
        <button type="button" className="soundtrack-play" data-player-focus onClick={toggleMusic} aria-label={music || loading ? 'Pause Orente' : status === 'error' ? 'Try playing Orente again' : 'Play Orente'}>
          <Icon name={music || loading ? 'pause' : 'play'} size={20} />
        </button>
        <div><strong>{music || loading ? 'Pause music' : status === 'error' ? 'Try again' : 'Play music'}</strong><span role="status" aria-live="polite">{statusMessage}</span></div>
      </div>
      {volumeSupported ? <div className="soundtrack-volume">
        <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute music' : 'Mute music'} aria-pressed={muted}><Icon name={muted ? 'volumeOff' : 'volume'} size={18} /></button>
        <input id="soundtrack-volume" aria-label="Music volume" aria-valuetext={`${Math.round(volume * 100)} percent${audioMuted ? ', muted' : ''}`} type="range" min="0" max="100" step="1" value={Math.round(volume * 100)} onChange={event => setVolume(Number(event.target.value) / 100)} style={{ '--volume-fill': `${volume * 100}%` }} />
        <output htmlFor="soundtrack-volume" aria-hidden="true">{Math.round(volume * 100)}%</output>
      </div> : <p className="soundtrack-device-volume">Use your device’s volume buttons to adjust the sound.</p>}
      <p id="soundtrack-hint" className="soundtrack-hint">Tap × to hide this player. Your music will keep playing.</p>
    </dialog>
    <div className="soundtrack-dock" inert={showWelcome || playerOpen}>
      {introComplete && !showWelcome && !playerOpen && <button ref={launcher} type="button" className={`soundtrack-launcher${music ? ' is-playing' : ''}`} onClick={openPlayer} aria-label={`Open Orente music player. ${status === 'error' ? 'Couldn’t play. Please try again.' : music ? (muted ? 'Orente is playing, muted.' : 'Orente is playing.') : 'Music is paused.'}`} aria-controls="soundtrack-player" aria-expanded={false} aria-haspopup="dialog">
        <Icon name={music && !muted ? 'volume' : 'music'} size={18} /><span>Orente</span><i aria-hidden="true" />
      </button>}
    </div>
    {showWelcome && <WelcomeExperience closing={welcomeClosing} onEnter={enterExperience} onClosed={finishWelcome} />}
  </SoundtrackContext.Provider>;
}
