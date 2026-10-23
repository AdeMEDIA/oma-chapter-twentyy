const paths = {
  arrowRight: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
  arrowLeft: <><path d="M20 12H5m6-6-6 6 6 6" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  play: <path d="m9 5 11 7-11 7V5Z" />,
  pause: <><path d="M8 5v14M16 5v14" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12 4 4L19 6" />,
  heart: <path d="M20 5a5 5 0 0 0-7 0l-1 1-1-1a5 5 0 0 0-7 7l8 8 8-8a5 5 0 0 0 0-7Z" />,
  book: <><path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1ZM12 5v15" /></>,
  letter: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m3 6 9 7 9-7M3 18l6-6m12 6-6-6" /></>,
  film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4m-10-7 4 3-4 3V9Z" /></>,
  portrait: <><rect x="4" y="2.5" width="16" height="19" rx="1" /><circle cx="12" cy="9" r="3" /><path d="M7.5 18c.6-4.4 8.4-4.4 9 0" /></>,
  notes: <><path d="M5 3h11l4 4v14H5V3Zm11 0v5h4M9 12h7m-7 4h5" /></>,
  music: <><path d="M9 17V5l11-2v12M9 8l11-2" /><ellipse cx="6" cy="17.5" rx="3" ry="2.5" /><ellipse cx="17" cy="15.5" rx="3" ry="2.5" /></>,
  volume: <><path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  volumeOff: <><path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6" /></>,
  candle: <><path d="M9 10h6v11H9V10Zm3 0V7m-5 14h10" /><path d="M12 2c-4 4-2 6 0 6s4-2 0-6Z" /></>,
  sparkle: <><path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z" /></>,
  gift: <><path d="M4 11h16v10H4V11Zm8-4v14M3 7h18v4H3V7Z" /><path d="M12 7C3 7 5 0 9 3l3 4Zm0 0c9 0 7-7 3-4l-3 4Z" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  share: <><path d="M12 16V3m-5 5 5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
};

export function Icon({ name, kind, size = 20, className = '', title, ...props }) {
  const key = name || ({ arrow: 'arrowRight', star: 'sparkle' }[kind] || kind);
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} aria-label={title} role={title ? 'img' : undefined} focusable="false" {...props}>{title && <title>{title}</title>}{paths[key] || paths.sparkle}</svg>;
}

export default Icon;
