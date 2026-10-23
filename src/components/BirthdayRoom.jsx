import { birthday } from '../data/birthday';
import { wishes } from '../data/wishes';
import Icon from './Icon';
import ResponsiveImage from './ResponsiveImage';
import { useSoundtrack } from './soundtrack-context';
import './room-experience.css';

const destinations = [
  { path: 'scrapbook', title: 'The scrapbook', subtitle: 'Look through our photos', icon: 'book' },
  { path: 'letters', title: 'Letters for you', subtitle: 'Read the four letters I wrote for you', icon: 'letter' },
  { path: 'portrait', title: 'Through Ade’s eyes', subtitle: 'What I love about you', icon: 'heart' },
  { path: 'film', title: 'Your birthday film', subtitle: 'Watch the film I made for your birthday', icon: 'film' },
  { path: 'cake', title: 'Make a wish', subtitle: 'Blow out your candles', icon: 'candle' },
  { path: 'gift', title: 'Your surprise', subtitle: 'Open your birthday gift', icon: 'gift' },
  { path: 'wishes', title: 'Your birthday wishes', subtitle: 'Read what everyone sent', icon: 'letter' },
  { path: 'notes', title: '20 little notes', subtitle: 'Pick any number.', icon: 'sparkle' },
];

function RoomLabel({ spot, path, label, children }) {
  return <a className={'room-object room-hotspot spot-' + spot} href={'#/' + path} aria-label={label}>
    <span className="hotspot-dot" aria-hidden="true" /><span className="hotspot-caption">{children}</span>
  </a>;
}

export default function BirthdayRoom({ foundCount = 0 }) {
  const { music, loading, toggleMusic } = useSoundtrack();
  const notesFound = Math.min(20, Math.max(0, Number(foundCount) || 0));
  const roomDestinations = destinations.filter(item => item.path !== 'gift' || birthday.giftDetail);
  return <div className="birthday-room birthday-room--restored">
    <div className="room-viewport" role="region" aria-label="Your birthday room">
      <section className="room-stage photographic-room" aria-label="Interactive birthday room">
        <div className="room-scene-canvas">
          <ResponsiveImage className="room-background" src="/images/room/birthday-room.webp" sizes="100vw" alt="A warmly lit birthday room with a burgundy sofa, a scrapbook, letters, a cake and a wrapped gift on a wooden table." width="1672" height="941" fetchPriority="high" decoding="async" />
          <div className="room-shade" aria-hidden="true" />
          <div className="scene-title"><span>OMA</span><h1>CHAPTER TWENTY</h1><p>One in a Million</p></div>
          {birthday.portrait && <div className="scene-portrait-frame"><ResponsiveImage className="scene-portrait-photo" src={birthday.portrait} sizes="7vw" alt="Oma’s framed portrait" width="960" height="1280" decoding="async" /></div>}
          <nav className="room-scene-labels" aria-label="Explore the objects in your birthday room">
            <RoomLabel spot="portrait" path="portrait" label="Open Through Ade’s eyes">Through Ade’s eyes</RoomLabel>
            <button type="button" className={'room-object room-hotspot spot-record' + (music ? ' playing' : '')} onClick={toggleMusic} aria-label={music || loading ? 'Pause Orente' : 'Play Orente'} aria-pressed={music} aria-busy={loading}><span className="hotspot-dot" aria-hidden="true" /><span className="hotspot-caption">Orente</span></button>
            <RoomLabel spot="book" path="scrapbook" label="Open the scrapbook">The scrapbook</RoomLabel>
            <RoomLabel spot="letters" path="letters" label="Open letters for you">Letters for you</RoomLabel>
            <RoomLabel spot="cake" path="cake" label="Make a birthday wish">Make a wish</RoomLabel>
            {birthday.giftDetail && <RoomLabel spot="gift" path="gift" label="Unwrap your surprise">Your surprise</RoomLabel>}
            <a className="room-film-link" href="#/film"><span className="film-play"><Icon name="play" size={12} /></span><span>Your birthday film</span></a>
            <a className="room-wishes-link" href="#/wishes"><span className="room-wishes-icon"><Icon name="heart" size={26} /></span><span className="room-wishes-caption">Your birthday wishes<small>{wishes.length} messages for you</small></span><Icon name="arrowRight" className="room-wishes-arrow" size={16} /></a>
          </nav>
        </div>
        <div className="scene-bottom"><span className="scene-welcome">I made this for you, Oma.<small>With love, Ade.</small></span><a href="#/notes"><Icon name="sparkle" size={14} /><span>{notesFound} / 20 little notes found</span><Icon name="arrowRight" size={13} /></a></div>
      </section>
    </div>
    <p className="room-instruction">Tap a light to open it.</p>
    <section className="birthday-room__collection" id="collection" aria-labelledby="room-collection-title">
      <header className="birthday-room__collection-intro" data-reveal>
        <div><span className="birthday-room__collection-eyebrow">Your birthday room</span><h2 id="room-collection-title">Where do you<br />want <em>to start?</em></h2></div>
        <a className="birthday-room__notes-count" href="#/notes"><Icon name="sparkle" size={19} /><span><strong>{notesFound.toString().padStart(2, '0')}<span> / 20</span></strong><small>little notes found</small></span><Icon name="arrowRight" size={16} /></a>
      </header>
      <nav className="birthday-room__collection-links" aria-label="Your birthday collection">
        {roomDestinations.map((item, index) => <a href={'#/' + item.path} className="birthday-room__destination" key={item.path} data-reveal>
          <span className="birthday-room__destination-mark" aria-hidden="true"><Icon name={item.icon} size={23} /><small>{String(index + 1).padStart(2, '0')}</small></span>
          <div><h3>{item.title}</h3><p>{item.subtitle}</p></div>
          <span className="birthday-room__destination-arrow" aria-hidden="true"><Icon name="arrowRight" size={19} /></span>
        </a>)}
      </nav>
    </section>
  </div>;
}

