/* Finite countdown and focus reveal. Content stays readable without JavaScript. */
(() => {
  const opening = document.querySelector('.opening');
  const overlay = document.querySelector('#countdown');
  const count = document.querySelector('#count');
  const skip = overlay?.querySelector('.jv-countdown-skip');
  const main = document.querySelector('#main-content');
  if (!opening || !overlay || !count || !skip || !main) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'jevi.opening.seen.v1';
  let seen = false;
  try { seen = sessionStorage.getItem(storageKey) === '1'; } catch (_) {}
  // Returning visitors and deep links go straight to their destination.
  if (seen || reduced.matches || location.hash || scrollY > 24) return;
  let finished = false, frame = 0, fallback = 0;
  const previousFocus = document.activeElement;
  const previousInert = main.inert;
  const previousScroll = { x: scrollX, y: scrollY };
  function finish(animate = true) {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame); clearTimeout(fallback);
    overlay.hidden = true;
    main.inert = previousInert;
    document.documentElement.classList.remove('jv-counting');
    opening.classList.toggle('is-focusing', animate && !reduced.matches);
    try { sessionStorage.setItem(storageKey, '1'); } catch (_) {}
    skip.removeEventListener('click', skipIntro);
    overlay.removeEventListener('keydown', keydown);
    reduced.removeEventListener('change', preferenceChanged);
    window.removeEventListener('pagehide', pagehide);
    if (document.activeElement === skip) {
      const focusTarget = previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : opening;
      focusTarget.focus({ preventScroll: true });
    }
    window.scrollTo({ left: previousScroll.x, top: previousScroll.y, behavior: 'instant' });
  }
  const skipIntro = () => finish();
  const preferenceChanged = e => { if (e.matches) finish(false); };
  const pagehide = () => finish(false);
  function keydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); finish(); }
    if (e.key === 'Tab') { e.preventDefault(); skip.focus({ preventScroll: true }); }
  }
  main.inert = true;
  overlay.hidden = false;
  document.documentElement.classList.add('jv-counting');
  skip.focus({ preventScroll: true });
  skip.addEventListener('click', skipIntro);
  overlay.addEventListener('keydown', keydown);
  reduced.addEventListener('change', preferenceChanged);
  window.addEventListener('pagehide', pagehide);
  const start = performance.now();
  function tick(now) {
    if (finished) return;
    const elapsed = now - start;
    if (elapsed >= 3000) { finish(); return; }
    count.textContent = String(3 - Math.floor(elapsed / 1000));
    frame = requestAnimationFrame(tick);
  }
  // Also release the overlay if frame delivery stops in a background tab.
  fallback = setTimeout(() => finish(), 3400);
  frame = requestAnimationFrame(tick);
})();
