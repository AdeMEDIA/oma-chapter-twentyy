import Icon from './Icon';
import { useSoundtrack } from './soundtrack-context';

export default function HeaderAudio() {
  const { music, loading, toggleMusic, openPlayer, playerOpen, muted } = useSoundtrack();
  return <div className="header-audio">
    <button className="header-sound-toggle" onClick={toggleMusic} aria-pressed={music} aria-busy={loading} aria-label={loading || music ? 'Pause Orente' : 'Play Orente'}>
      <Icon name={music && !muted ? 'volume' : 'volumeOff'} size={16} />
      <span>{loading ? 'Loading…' : music ? (muted ? 'Muted' : 'Sound on') : 'Sound off'}</span>
    </button>
    <button className="header-player-open" onClick={openPlayer} aria-label="Open music player" aria-expanded={playerOpen} aria-controls="soundtrack-player"><Icon name="music" size={17} /></button>
  </div>;
}
