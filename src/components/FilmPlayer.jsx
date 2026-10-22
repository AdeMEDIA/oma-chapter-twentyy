import { useEffect, useRef, useState } from 'react';
import { birthday } from '../data/birthday';
import './film-player.css';

export default function FilmPlayer() {
  const [failed, setFailed] = useState(false);
  const video = useRef(null);

  useEffect(() => {
    const element = video.current;
    return () => element?.pause();
  }, [failed]);

  return <div className="cinema-frame film-player" style={{ '--film-aspect': `${birthday.filmWidth} / ${birthday.filmHeight}`, '--film-poster': `url("${birthday.filmPoster}")` }}>
    <div className="film-screen">
      {failed ? <div className="film-placeholder film-error" role="alert"><h2>The film couldn’t load.</h2><p>Please try again.</p><button className="film-retry" onClick={() => setFailed(false)}>Try again</button></div> : <video
        ref={video}
        src={birthday.film}
        poster={birthday.filmPoster}
        width={birthday.filmWidth}
        height={birthday.filmHeight}
        controls
        playsInline
        preload="metadata"
        aria-label="Oma, on Film. A birthday film from Ade, with Orente."
        onError={() => setFailed(true)}
      >Your browser couldn’t play this film.</video>}
    </div>
  </div>;
}
