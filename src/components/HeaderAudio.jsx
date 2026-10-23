import Icon from './Icon';
import { useSoundtrack } from './soundtrack-context';

export default function HeaderAudio() {
  const { music, loading, openPlayer, playerOpen, muted } = useSoundtrack();
  return <div className="header-audio">
    <button type="button" className={`header-orente${music ? ' is-playing' : ''}`} onClick={openPlayer} aria-label={`Open Orente music player. ${loading ? 'Loading.' : music ? (muted ? 'Playing, muted.' : 'Playing.') : 'Paused.'}`} aria-expanded={playerOpen} aria-controls="soundtrack-player" aria-haspopup="dialog">
      <Icon name={music && !muted ? 'volume' : 'music'} size={16} /><span>Orente</span><i aria-hidden="true" />
    </button>
  </div>;
}
