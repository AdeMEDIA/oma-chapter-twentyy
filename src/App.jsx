import { lazy, Suspense, useEffect, useState } from 'react';
import './birthday.css';
import './room-artwork.css';
import BirthdayExperience from './components/BirthdayExperience';
import SoundtrackProvider from './components/Soundtrack';
import { birthday } from './data/birthday';
import './responsive.css';

const WishesPage = lazy(() => import('./WishesPage'));

const routes = new Set(['wishes', 'room', 'scrapbook', 'letters', 'portrait', 'film', 'cake', 'gift', 'notes']);
const pageTitles = { room: 'Oma', wishes: 'Birthday Wishes', letters: 'Letters for Oma', portrait: 'Through Ade’s Eyes', film: 'Oma on Film', cake: 'Make a Wish', gift: 'For Oma', notes: '20 Little Notes', scrapbook: 'Scrapbook' };
function currentRoute() {
  const route = window.location.hash.split('#/')[1]?.split('#')[0];
  if (route === 'gift' && !birthday.giftDetail) return 'room';
  return routes.has(route) ? route : 'room';
}
export default function App() {
  const [route, setRoute] = useState(currentRoute);
  useEffect(() => {
    const update = () => { setRoute(currentRoute()); if (!window.location.hash.includes('#collection')) window.scrollTo({ top: 0, behavior: 'instant' }); };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    document.title = `${pageTitles[route]} | Chapter Twenty`;
    if (window.location.hash.includes('#collection')) document.getElementById('collection')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [route]);
  return <SoundtrackProvider><button className="skip-link" onClick={() => { const main = document.querySelector('main'); main?.focus(); main?.scrollIntoView({ behavior: 'instant' }); }}>Skip to content</button><Suspense fallback={<div className="page-loading" role="status">Opening…</div>}>{route === 'wishes' ? <WishesPage /> : <BirthdayExperience route={route} />}</Suspense></SoundtrackProvider>;
}
