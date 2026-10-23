import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import './birthday.css';
import './room-artwork.css';
import BirthdayExperience from './components/BirthdayExperience';
import SoundtrackProvider from './components/Soundtrack';
import { useSoundtrack } from './components/soundtrack-context';
import { useExperienceMotion } from './components/useExperienceMotion';
import { birthday } from './data/birthday';
import './responsive.css';
import './section-polish.css';
import './cinematic.css';
import './room-fit.css';

const WishesPage = lazy(() => import('./WishesPage'));

const routes = new Set(['wishes', 'room', 'scrapbook', 'letters', 'portrait', 'film', 'cake', 'gift', 'notes']);
const pageTitles = { room: 'Oma', wishes: 'Birthday Wishes', letters: 'Letters for Oma', portrait: 'Through Ade’s Eyes', film: 'Oma on Film', cake: 'Make a Wish', gift: 'For Oma', notes: '20 Little Notes', scrapbook: 'Scrapbook' };
function currentRoute(hash) {
  const route = hash.split('#/')[1]?.split('#')[0];
  if (route === 'gift' && !birthday.giftDetail) return 'room';
  return routes.has(route) ? route : 'room';
}
function ExperienceRouter() {
  const [hash, setHash] = useState(() => window.location.hash);
  const route = currentRoute(hash);
  const { introComplete } = useSoundtrack();
  const experience = useRef(null);
  useExperienceMotion(experience, route, hash, introComplete);
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    document.title = `${pageTitles[route]} | Chapter Twenty`;
  }, [route]);
  return <div ref={experience} className={`cinematic-app ${introComplete ? 'is-entered' : ''}`} inert={!introComplete} data-route={route}><button className="skip-link" onClick={() => { const main = document.querySelector('main'); main?.focus(); main?.scrollIntoView({ behavior: 'instant' }); }}>Skip to content</button><Suspense fallback={<div className="page-loading" role="status">Opening…</div>}>{route === 'wishes' ? <WishesPage /> : <BirthdayExperience route={route} />}</Suspense></div>;
}

export default function App() { return <SoundtrackProvider><ExperienceRouter /></SoundtrackProvider>; }
