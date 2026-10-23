// Phones reserve a small music dock; desktop keeps the document's native scroll.
export function pageScrollport() {
  const port = document.querySelector('.experience-scroll');
  return port && getComputedStyle(port).display !== 'contents' ? port : null;
}

export function scrollPageTo(top) {
  (pageScrollport() || window).scrollTo({ top, behavior: 'instant' });
}

export function pageViewportBottom() {
  return pageScrollport()?.getBoundingClientRect().bottom ?? window.innerHeight;
}
