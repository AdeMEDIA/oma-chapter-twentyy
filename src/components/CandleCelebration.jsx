import './candle-celebration.css';

const flecks = [
  [-170, -90, -35, 0], [-125, -130, 25, 45], [-72, -110, -15, 15], [-28, -148, 40, 60],
  [34, -135, -30, 20], [88, -120, 30, 70], [140, -108, -20, 35], [180, -68, 45, 55],
  [-190, -26, 18, 35], [-135, -48, -28, 75], [-80, -66, 38, 50], [75, -56, -45, 25],
  [130, -32, 25, 65], [188, -12, -10, 5], [-105, 18, 15, 80], [105, 20, -30, 40],
];

export default function CandleCelebration({ active }) {
  if (!active) return null;
  return <div className="candle-celebration" aria-hidden="true">
    <span className="celebration-light" />
    {flecks.map(([x, y, rotation, delay], index) => <span key={index} className={`celebration-fleck fleck-${index % 3}`} style={{ '--fleck-x': `${x}px`, '--fleck-y': `${y}px`, '--fleck-rotation': `${rotation}deg`, '--fleck-delay': `${delay}ms` }}>
      {index % 3 === 0 && <svg viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>}
    </span>)}
  </div>;
}
